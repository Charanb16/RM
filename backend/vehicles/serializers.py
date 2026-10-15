"""Serializers for customer vehicle management."""
import datetime
import re
from django.db import transaction
from rest_framework import serializers
from .models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    """Serializer for Vehicle CRUD operations with plate normalization and primary toggle."""

    vehicle_type_display = serializers.CharField(source='get_vehicle_type_display', read_only=True)
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)

    class Meta:
        model = Vehicle
        fields = (
            'id',
            'owner',
            'owner_name',
            'make',
            'model',
            'year',
            'license_plate',
            'vehicle_type',
            'vehicle_type_display',
            'color',
            'vin',
            'is_primary',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'owner', 'created_at', 'updated_at')

    def validate_license_plate(self, value):
        """Clean and normalize license plate."""
        cleaned = re.sub(r'[\s\-]', '', value).upper()
        if len(cleaned) < 4:
            raise serializers.ValidationError("License plate is too short.")
        # Check uniqueness per owner
        user = self.context['request'].user
        instance = self.instance
        qs = Vehicle.objects.filter(owner=user, license_plate=cleaned)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("You have already registered a vehicle with this license plate.")
        return cleaned

    def validate_year(self, value):
        current_year = datetime.date.today().year
        if value < 1950 or value > current_year + 1:
            raise serializers.ValidationError(f"Year must be between 1950 and {current_year + 1}.")
        return value

    def validate_vin(self, value):
        if value:
            cleaned = value.strip().upper()
            if len(cleaned) != 17:
                raise serializers.ValidationError("VIN must be exactly 17 characters long.")
            return cleaned
        return value

    @transaction.atomic
    def create(self, validated_data):
        user = self.context['request'].user
        is_primary = validated_data.get('is_primary', False)

        # If this is the user's first vehicle, force it to be primary
        if not Vehicle.objects.filter(owner=user).exists():
            is_primary = True
            validated_data['is_primary'] = True

        if is_primary:
            Vehicle.objects.filter(owner=user, is_primary=True).update(is_primary=False)

        validated_data['owner'] = user
        return super().create(validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        is_primary = validated_data.get('is_primary', instance.is_primary)
        if is_primary and not instance.is_primary:
            Vehicle.objects.filter(owner=instance.owner, is_primary=True).update(is_primary=False)
        return super().update(instance, validated_data)
