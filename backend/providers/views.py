"""Views for provider profile management, GPS location streaming, and PostGIS geospatial queries."""
import logging
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdmin, IsProvider
from core.exceptions import BadRequest, Forbidden, NotFound
from core.utils import api_success_response, point_from_coords
from .models import ProviderProfile, ProviderService, VerificationStatus
from .serializers import (
    NearbyProviderSerializer,
    ProviderLocationUpdateSerializer,
    ProviderProfileSerializer,
    ProviderServiceSerializer,
    ProviderStatusUpdateSerializer,
    ProviderVerificationSerializer,
)

logger = logging.getLogger('roadmate.providers')


class ProviderProfileView(generics.RetrieveUpdateAPIView):
    """Retrieve or update the authenticated provider's profile."""
    serializer_class = ProviderProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsProvider]

    def get_object(self):
        try:
            return self.request.user.provider_profile
        except ProviderProfile.DoesNotExist:
            raise NotFound("Provider profile not found for this account.")


class ProviderLocationUpdateView(APIView):
    """Update current GPS location coordinates for the provider using PostGIS."""
    permission_classes = [permissions.IsAuthenticated, IsProvider]

    def post(self, request, *args, **kwargs):
        serializer = ProviderLocationUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            profile = request.user.provider_profile
        except ProviderProfile.DoesNotExist:
            raise NotFound("Provider profile does not exist.")

        serializer.save(profile)
        logger.info(
            "Provider location updated: provider_id=%s lat=%s lng=%s",
            profile.id,
            serializer.validated_data['latitude'],
            serializer.validated_data['longitude'],
        )
        return api_success_response(
            data={
                "provider_id": profile.id,
                "latitude": serializer.validated_data['latitude'],
                "longitude": serializer.validated_data['longitude'],
                "last_location_update": profile.last_location_update,
            },
            message="Location updated successfully.",
        )


class ProviderToggleOnlineView(APIView):
    """Toggle online/offline status for receiving job dispatches."""
    permission_classes = [permissions.IsAuthenticated, IsProvider]

    def post(self, request, *args, **kwargs):
        serializer = ProviderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = request.user.provider_profile

        # Validate that unapproved providers cannot go online
        is_online = serializer.validated_data['is_online']
        if is_online and profile.verification_status != VerificationStatus.APPROVED:
            raise Forbidden("Your account must be approved by an administrator before going online.")

        profile.is_online = is_online
        profile.save(update_fields=['is_online', 'updated_at'])
        state_str = "online" if is_online else "offline"
        logger.info("Provider id=%s went %s", profile.id, state_str)

        return api_success_response(
            data={"is_online": profile.is_online},
            message=f"You are now {state_str}.",
        )


class ProviderServicesViewSet(viewsets.ModelViewSet):
    """Manage the catalog services and custom pricing offered by the current provider."""
    serializer_class = ProviderServiceSerializer
    permission_classes = [permissions.IsAuthenticated, IsProvider]

    def get_queryset(self):
        return ProviderService.objects.filter(provider=self.request.user.provider_profile)

    def perform_create(self, serializer):
        serializer.save(provider=self.request.user.provider_profile)


class NearbyProvidersView(APIView):
    """Find nearby active and approved providers using PostGIS spatial distance queries.

    Query parameters:
        lat (float): Customer's latitude coordinate (required)
        lng (float): Customer's longitude coordinate (required)
        radius (float): Search radius in kilometers (optional, default: 10.0)
        service_id (int): Filter providers supporting this service ID (optional)
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        lat_str = request.query_params.get('lat')
        lng_str = request.query_params.get('lng')
        radius_km = float(request.query_params.get('radius', 10.0))
        service_id = request.query_params.get('service_id')

        if not lat_str or not lng_str:
            raise BadRequest("Both 'lat' and 'lng' query parameters are required.")

        try:
            lat = float(lat_str)
            lng = float(lng_str)
        except ValueError:
            raise BadRequest("Invalid 'lat' or 'lng' float values.")

        customer_point = point_from_coords(lat, lng)

        queryset = ProviderProfile.objects.filter(
            verification_status=VerificationStatus.APPROVED,
            is_online=True,
            location__isnull=False,
            location__distance_lte=(customer_point, D(km=radius_km)),
        ).annotate(
            distance=Distance('location', customer_point)
        ).order_by('distance')

        if service_id:
            queryset = queryset.filter(services__id=service_id)

        serializer = NearbyProviderSerializer(queryset[:20], many=True)
        return api_success_response(
            data=serializer.data,
            message=f"Found {len(serializer.data)} nearby service providers within {radius_km}km."
        )


class AdminProviderVerificationView(APIView):
    """Platform administrator endpoint to approve, reject, or suspend a provider."""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, pk, *args, **kwargs):
        try:
            profile = ProviderProfile.objects.get(pk=pk)
        except ProviderProfile.DoesNotExist:
            raise NotFound("Provider profile not found.")

        serializer = ProviderVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['verification_status']
        profile.verification_status = new_status

        if new_status == VerificationStatus.APPROVED:
            profile.approved_at = timezone.now()
            profile.approved_by = request.user
        elif new_status in [VerificationStatus.REJECTED, VerificationStatus.SUSPENDED]:
            # If rejected/suspended, take provider offline immediately
            profile.is_online = False

        profile.save()
        logger.info(
            "Provider id=%s verification updated to %s by admin id=%s",
            profile.id,
            new_status,
            request.user.id,
        )

        return api_success_response(
            data=ProviderProfileSerializer(profile).data,
            message=f"Provider verification status updated to '{new_status}'.",
        )
