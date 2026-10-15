"""Serializers for assistance requests, offers, dispatch operations, and audit events."""
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from accounts.serializers import UserSummarySerializer
from core.utils import coords_from_point, point_from_coords
from providers.models import ProviderProfile
from services.models import Service
from services.serializers import ServiceSerializer
from vehicles.models import Vehicle
from vehicles.serializers import VehicleSerializer
from .fsm import OfferStatus, RequestStatus, can_transition, validate_transition
from .models import AssistanceOffer, AssistanceRequest, BookingEvent


class BookingEventSerializer(serializers.ModelSerializer):
    """Serializer for immutable booking timeline events."""

    actor_name = serializers.CharField(source='actor.full_name', read_only=True)

    class Meta:
        model = BookingEvent
        fields = (
            'id',
            'actor',
            'actor_name',
            'from_status',
            'to_status',
            'event_type',
            'note',
            'metadata',
            'created_at',
        )
        read_only_fields = fields


class AssistanceOfferSerializer(serializers.ModelSerializer):
    """Serializer representing an offer made to a provider for an assistance request."""

    provider_business_name = serializers.CharField(source='provider.business_name', read_only=True)
    provider_rating = serializers.DecimalField(source='provider.average_rating', max_digits=3, decimal_places=2, read_only=True)
    provider_phone = serializers.CharField(source='provider.user.phone', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = AssistanceOffer
        fields = (
            'id',
            'request',
            'provider',
            'provider_business_name',
            'provider_rating',
            'provider_phone',
            'quoted_amount',
            'estimated_arrival_minutes',
            'status',
            'status_display',
            'expires_at',
            'is_expired',
            'response_notes',
            'created_at',
        )
        read_only_fields = (
            'id',
            'request',
            'provider',
            'quoted_amount',
            'status',
            'status_display',
            'expires_at',
            'created_at',
        )

    def get_is_expired(self, obj) -> bool:
        return obj.expires_at < timezone.now() and obj.status == OfferStatus.PENDING


class AssistanceRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for customer submission of a new assistance request."""

    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.filter(is_active=True),
        source='service',
        write_only=True,
    )
    vehicle_id = serializers.PrimaryKeyRelatedField(
        queryset=Vehicle.objects.all(),
        source='vehicle',
        required=False,
        allow_null=True,
        write_only=True,
    )
    latitude = serializers.FloatField(
        write_only=True,
        min_value=-90.0,
        max_value=90.0,
        help_text='Latitude of breakdown location.',
    )
    longitude = serializers.FloatField(
        write_only=True,
        min_value=-180.0,
        max_value=180.0,
        help_text='Longitude of breakdown location.',
    )
    auto_dispatch = serializers.BooleanField(
        default=True,
        write_only=True,
        help_text='Whether to immediately trigger the expanding radius dispatch engine.',
    )

    class Meta:
        model = AssistanceRequest
        fields = (
            'id',
            'service_id',
            'vehicle_id',
            'latitude',
            'longitude',
            'address',
            'description',
            'auto_dispatch',
            'created_at',
        )
        read_only_fields = ('id', 'created_at')

    def validate_vehicle_id(self, vehicle):
        """Ensure customer can only select a vehicle they own."""
        if vehicle:
            user = self.context['request'].user
            if vehicle.owner != user:
                raise serializers.ValidationError("You can only request assistance for vehicles you own.")
        return vehicle

    @transaction.atomic
    def create(self, validated_data):
        user = self.context['request'].user
        lat = validated_data.pop('latitude')
        lng = validated_data.pop('longitude')
        auto_dispatch = validated_data.pop('auto_dispatch', True)

        point = point_from_coords(lat, lng)
        initial_status = RequestStatus.REQUESTED if auto_dispatch else RequestStatus.DRAFT

        request_instance = AssistanceRequest.objects.create(
            customer=user,
            location=point,
            status=initial_status,
            **validated_data,
        )

        from .fsm import record_booking_event
        record_booking_event(
            request_obj=request_instance,
            actor=user,
            from_status=RequestStatus.DRAFT,
            to_status=initial_status,
            event_type="REQUEST_CREATED",
            note="Customer submitted assistance request.",
        )

        # Trigger automatic dispatch if requested
        if auto_dispatch:
            from .dispatch import find_and_dispatch
            find_and_dispatch(request_instance)

        return request_instance


class AssistanceRequestDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for assistance requests including timeline events and offers."""

    customer = UserSummarySerializer(read_only=True)
    service = ServiceSerializer(read_only=True)
    vehicle = VehicleSerializer(read_only=True)
    assigned_provider_details = serializers.SerializerMethodField()
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    offers = AssistanceOfferSerializer(many=True, read_only=True)
    events = BookingEventSerializer(many=True, read_only=True)

    class Meta:
        model = AssistanceRequest
        fields = (
            'id',
            'customer',
            'service',
            'vehicle',
            'assigned_provider',
            'assigned_provider_details',
            'latitude',
            'longitude',
            'address',
            'status',
            'status_display',
            'description',
            'quoted_amount',
            'final_amount',
            'current_search_radius_km',
            'cancellation_reason',
            'completed_at',
            'offers',
            'events',
            'created_at',
            'updated_at',
        )
        read_only_fields = fields

    def get_latitude(self, obj):
        return coords_from_point(obj.location)['latitude']

    def get_longitude(self, obj):
        return coords_from_point(obj.location)['longitude']

    def get_assigned_provider_details(self, obj):
        if not obj.assigned_provider:
            return None
        p = obj.assigned_provider
        return {
            'id': p.id,
            'business_name': p.business_name,
            'phone': p.user.phone,
            'average_rating': str(p.average_rating),
            'latitude': coords_from_point(p.location)['latitude'],
            'longitude': coords_from_point(p.location)['longitude'],
        }


class StatusTransitionSerializer(serializers.Serializer):
    """Serializer for validating state transitions in the assistance lifecycle."""

    target_status = serializers.ChoiceField(choices=RequestStatus.choices, required=True)
    note = serializers.CharField(required=False, allow_blank=True, default="")
    cancellation_reason = serializers.CharField(required=False, allow_blank=True)
    final_amount = serializers.DecimalField(
        required=False,
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.00'),
    )

    def validate(self, attrs):
        target_status = attrs.get('target_status')
        cancellation_reason = attrs.get('cancellation_reason')
        if target_status == RequestStatus.CANCELLED and not cancellation_reason:
            raise serializers.ValidationError({"cancellation_reason": "A cancellation reason must be provided."})
        return attrs
