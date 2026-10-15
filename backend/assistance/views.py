"""Views for AssistanceRequest lifecycle management, atomic offer acceptance, and dispatching."""
import logging
from django.db import models, transaction
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsAssistanceParticipant, IsCustomer, IsProvider
from core.exceptions import BadRequest, Conflict, Forbidden, NotFound
from core.utils import api_success_response
from .dispatch import find_and_dispatch
from .fsm import OfferStatus, RequestStatus, record_booking_event, validate_transition
from .models import AssistanceOffer, AssistanceRequest, BookingEvent
from .serializers import (
    AssistanceOfferSerializer,
    AssistanceRequestCreateSerializer,
    AssistanceRequestDetailSerializer,
    StatusTransitionSerializer,
)

logger = logging.getLogger('roadmate.assistance')


class AssistanceRequestViewSet(viewsets.ModelViewSet):
    """ViewSet managing assistance requests, lifecycle state transitions, and dispatch retry."""
    queryset = AssistanceRequest.objects.all().select_related(
        'customer', 'service', 'vehicle', 'assigned_provider', 'assigned_provider__user'
    ).prefetch_related('offers', 'events')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return AssistanceRequestCreateSerializer
        return AssistanceRequestDetailSerializer

    def get_queryset(self):
        """Scope query results based on user role."""
        user = self.request.user
        if user.is_platform_admin:
            return self.queryset
        if user.is_provider and hasattr(user, 'provider_profile'):
            # Providers see requests they are assigned to or have received offers for
            profile = user.provider_profile
            return self.queryset.filter(
                models.Q(assigned_provider=profile) | models.Q(offers__provider=profile)
            ).distinct()
        # Default customer query
        return self.queryset.filter(customer=user)

    @action(detail=True, methods=['post'], url_path='retry-dispatch')
    def retry_dispatch(self, request, pk=None):
        """Manually trigger dispatch retry for a request that has not yet found a provider."""
        assistance_request = self.get_object()
        user = request.user

        if assistance_request.customer != user and not user.is_platform_admin:
            raise Forbidden("Only the customer who created this request can retry dispatch.")

        if assistance_request.status not in [RequestStatus.NO_PROVIDERS_FOUND, RequestStatus.OFFERED, RequestStatus.REQUESTED]:
            raise Conflict(f"Cannot retry dispatch from current status: {assistance_request.status}")

        success = find_and_dispatch(assistance_request)
        assistance_request.refresh_from_db()
        return api_success_response(
            data=AssistanceRequestDetailSerializer(assistance_request).data,
            message="Dispatch retry completed." if success else "No additional nearby providers found at this time.",
        )

    @action(detail=True, methods=['post'], url_path='transition')
    @transaction.atomic
    def transition_status(self, request, pk=None):
        """Execute a validated state transition on an assistance request."""
        assistance_request = AssistanceRequest.objects.select_for_update().get(pk=pk)
        user = request.user

        serializer = StatusTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_status = serializer.validated_data['target_status']
        note = serializer.validated_data.get('note', '')
        cancellation_reason = serializer.validated_data.get('cancellation_reason', '')
        final_amount = serializer.validated_data.get('final_amount')

        current_status = assistance_request.status
        validate_transition(current_status, target_status)

        # Role-based authorization for specific transitions
        is_assigned_provider = (
            assistance_request.assigned_provider is not None
            and assistance_request.assigned_provider.user == user
        )
        is_customer = assistance_request.customer == user
        is_admin = user.is_platform_admin

        if target_status in [RequestStatus.EN_ROUTE, RequestStatus.ARRIVED, RequestStatus.IN_PROGRESS]:
            if not (is_assigned_provider or is_admin):
                raise Forbidden("Only the assigned provider can update operational progress.")

        if target_status == RequestStatus.COMPLETED:
            if not (is_assigned_provider or is_admin):
                raise Forbidden("Only the assigned provider or admin can mark a job as completed.")
            assistance_request.completed_at = timezone.now()
            assistance_request.final_amount = final_amount or assistance_request.quoted_amount
            # Provider is now free for next jobs
            if assistance_request.assigned_provider:
                assistance_request.assigned_provider.is_busy = False
                assistance_request.assigned_provider.save(update_fields=['is_busy', 'updated_at'])

        if target_status == RequestStatus.CANCELLED:
            if not (is_customer or is_assigned_provider or is_admin):
                raise Forbidden("You are not authorized to cancel this assistance request.")
            assistance_request.cancellation_reason = cancellation_reason
            assistance_request.cancelled_by = user
            # Free assigned provider if busy
            if assistance_request.assigned_provider:
                assistance_request.assigned_provider.is_busy = False
                assistance_request.assigned_provider.save(update_fields=['is_busy', 'updated_at'])

        assistance_request.status = target_status
        assistance_request.save()

        # Audit event record
        record_booking_event(
            request_obj=assistance_request,
            actor=user,
            from_status=current_status,
            to_status=target_status,
            event_type=f"STATUS_{target_status.upper()}",
            note=note or f"Status changed to {target_status}",
            metadata={"cancellation_reason": cancellation_reason} if cancellation_reason else {},
        )

        return api_success_response(
            data=AssistanceRequestDetailSerializer(assistance_request).data,
            message=f"Request transitioned successfully to {target_status}.",
        )


class AssistanceOfferViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for reviewing and atomically accepting or declining offers."""
    queryset = AssistanceOffer.objects.all().select_related('request', 'provider', 'provider__user')
    serializer_class = AssistanceOfferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return self.queryset
        if user.is_provider and hasattr(user, 'provider_profile'):
            return self.queryset.filter(provider=user.provider_profile)
        return self.queryset.filter(request__customer=user)

    @action(detail=True, methods=['post'], url_path='accept')
    @transaction.atomic
    def accept_offer(self, request, pk=None):
        """Atomically accept an offer, assign provider, expire all sibling offers, and record event."""
        try:
            offer = AssistanceOffer.objects.select_for_update().get(pk=pk)
        except AssistanceOffer.DoesNotExist:
            raise NotFound("Offer does not exist.")

        # Ensure only the customer who created the request can accept the offer
        if offer.request.customer != request.user and not request.user.is_platform_admin:
            raise Forbidden("Only the customer who created this request can accept an offer.")

        if offer.status != 'pending':
            raise Conflict('This offer is no longer available.')  # 409

        if offer.expires_at < timezone.now():
            offer.status = 'expired'
            offer.save(update_fields=['status', 'updated_at'])
            raise Conflict('This offer has expired.')  # 409

        # Accept this offer, expire all others for the same request
        offer.status = 'accepted'
        offer.save(update_fields=['status', 'updated_at'])

        AssistanceOffer.objects.filter(
            request=offer.request
        ).exclude(pk=pk).update(status='expired')

        # Update parent assistance request
        old_status = offer.request.status
        offer.request.status = 'accepted'
        offer.request.quoted_amount = offer.quoted_amount
        offer.request.assigned_provider = offer.provider
        offer.request.save(update_fields=['status', 'quoted_amount', 'assigned_provider', 'updated_at'])

        # Mark provider as busy
        offer.provider.is_busy = True
        offer.provider.save(update_fields=['is_busy', 'updated_at'])

        # Create immutable audit record
        BookingEvent.objects.create(
            request=offer.request,
            actor=request.user,
            from_status=old_status,
            to_status='accepted',
            event_type='OFFER_ACCEPTED',
            note=f"Customer accepted offer #{offer.id} from {offer.provider.business_name} for ₹{offer.quoted_amount}.",
            metadata={"offer_id": offer.id, "amount": str(offer.quoted_amount)},
        )

        logger.info(
            "Offer #%s accepted by user id=%s for Request #%s (Provider: %s)",
            offer.id,
            request.user.id,
            offer.request.id,
            offer.provider.business_name,
        )

        return Response(AssistanceOfferSerializer(offer).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='decline')
    @transaction.atomic
    def decline_offer(self, request, pk=None):
        """Allow a provider to decline an offer dispatched to them."""
        try:
            offer = AssistanceOffer.objects.select_for_update().get(pk=pk)
        except AssistanceOffer.DoesNotExist:
            raise NotFound("Offer does not exist.")

        # Ensure only the provider can decline their own offer
        if not hasattr(request.user, 'provider_profile') or offer.provider != request.user.provider_profile:
            raise Forbidden("You can only decline offers addressed to your provider profile.")

        if offer.status != OfferStatus.PENDING:
            raise Conflict(f"Cannot decline offer with status '{offer.status}'.")

        reason = request.data.get('reason', '')
        offer.status = OfferStatus.REJECTED
        offer.response_notes = reason
        offer.save(update_fields=['status', 'response_notes', 'updated_at'])

        record_booking_event(
            request_obj=offer.request,
            actor=request.user,
            from_status=offer.request.status,
            to_status=offer.request.status,
            event_type='OFFER_DECLINED_BY_PROVIDER',
            note=f"Provider {offer.provider.business_name} declined offer #{offer.id}: {reason}",
        )

        return api_success_response(
            data=AssistanceOfferSerializer(offer).data,
            message="Offer declined.",
        )
