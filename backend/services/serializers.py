"""Serializers for RoadMate services."""
from decimal import Decimal
from rest_framework import serializers
from .models import Service


class ServiceSerializer(serializers.ModelSerializer):
    """Full serializer for Service items with category human-readable display."""

    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Service
        fields = (
            'id',
            'name',
            'code',
            'category',
            'category_display',
            'description',
            'base_price',
            'per_km_price',
            'estimated_duration_minutes',
            'icon',
            'is_active',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_code(self, value):
        """Standardize service code to uppercase snake_case."""
        return value.strip().upper().replace(' ', '_')

    def validate_base_price(self, value):
        if value < Decimal('0.00'):
            raise serializers.ValidationError("Base price cannot be negative.")
        return value

    def validate_per_km_price(self, value):
        if value < Decimal('0.00'):
            raise serializers.ValidationError("Per-km price cannot be negative.")
        return value
