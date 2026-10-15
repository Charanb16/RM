"""Serializers for provider profiles, location updates, and services."""
from decimal import Decimal
from rest_framework import serializers
from accounts.serializers import UserSummarySerializer
from core.utils import coords_from_point, point_from_coords
from services.models import Service
from services.serializers import ServiceSerializer
from .models import ProviderProfile, ProviderService, VerificationStatus


class ProviderServiceSerializer(serializers.ModelSerializer):
    """Serializer for provider-service association and custom pricing."""

    service_details = ServiceSerializer(source='service', read_only=True)
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        source='service',
        write_only=True,
    )

    class Meta:
        model = ProviderService
        fields = (
            'id',
            'service_id',
            'service_details',
            'custom_base_price',
            'is_available',
            'created_at',
        )
        read_only_fields = ('id', 'created_at')

    def validate_custom_base_price(self, value):
        if value is not None and value < Decimal('0.00'):
            raise serializers.ValidationError("Custom base price cannot be negative.")
        return value


class ProviderProfileSerializer(serializers.ModelSerializer):
    """Complete serializer for provider profile with coordinates and service listings."""

    user = UserSummarySerializer(read_only=True)
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()
    provider_services = ProviderServiceSerializer(many=True, read_only=True)
    verification_status_display = serializers.CharField(source='get_verification_status_display', read_only=True)

    class Meta:
        model = ProviderProfile
        fields = (
            'id',
            'user',
            'business_name',
            'verification_status',
            'verification_status_display',
            'is_online',
            'is_busy',
            'service_radius_km',
            'bio',
            'id_document_url',
            'business_license_number',
            'average_rating',
            'total_reviews',
            'latitude',
            'longitude',
            'provider_services',
            'last_location_update',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'user',
            'verification_status',
            'verification_status_display',
            'is_busy',
            'average_rating',
            'total_reviews',
            'last_location_update',
            'created_at',
            'updated_at',
        )

    def get_latitude(self, obj):
        coords = coords_from_point(obj.location)
        return coords['latitude']

    def get_longitude(self, obj):
        coords = coords_from_point(obj.location)
        return coords['longitude']


class ProviderLocationUpdateSerializer(serializers.Serializer):
    """Serializer for updating real-time provider GPS coordinates."""

    latitude = serializers.FloatField(
        required=True,
        min_value=-90.0,
        max_value=90.0,
        help_text='Current GPS latitude (-90.0 to 90.0).',
    )
    longitude = serializers.FloatField(
        required=True,
        min_value=-180.0,
        max_value=180.0,
        help_text='Current GPS longitude (-180.0 to 180.0).',
    )

    def save(self, profile: ProviderProfile):
        lat = self.validated_data['latitude']
        lng = self.validated_data['longitude']
        from django.utils import timezone
        profile.location = point_from_coords(lat, lng)
        profile.last_location_update = timezone.now()
        profile.save(update_fields=['location', 'last_location_update', 'updated_at'])
        return profile


class ProviderStatusUpdateSerializer(serializers.Serializer):
    """Serializer for toggling provider online/offline status."""

    is_online = serializers.BooleanField(required=True)


class ProviderVerificationSerializer(serializers.Serializer):
    """Serializer for administrative approval or rejection of a provider."""

    verification_status = serializers.ChoiceField(
        choices=VerificationStatus.choices,
        required=True,
    )
    notes = serializers.CharField(required=False, allow_blank=True)


class NearbyProviderSerializer(serializers.ModelSerializer):
    """Serializer for nearby providers with calculated distance in kilometers."""

    distance_km = serializers.SerializerMethodField()
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()
    services = ServiceSerializer(many=True, read_only=True)

    class Meta:
        model = ProviderProfile
        fields = (
            'id',
            'business_name',
            'average_rating',
            'total_reviews',
            'distance_km',
            'latitude',
            'longitude',
            'services',
        )

    def get_distance_km(self, obj):
        """Distance returned by PostGIS distance annotation in kilometers."""
        if hasattr(obj, 'distance') and obj.distance is not None:
            return round(obj.distance.km, 2)
        return None

    def get_latitude(self, obj):
        return coords_from_point(obj.location)['latitude']

    def get_longitude(self, obj):
        return coords_from_point(obj.location)['longitude']
