"""Serializers for customer reviews and ratings."""
from rest_framework import serializers

from accounts.serializers import UserSummarySerializer
from assistance.fsm import RequestStatus
from assistance.models import AssistanceRequest
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for submitting and reading customer reviews."""

    customer = UserSummarySerializer(read_only=True)
    provider_name = serializers.CharField(source='provider.business_name', read_only=True)
    request_id = serializers.PrimaryKeyRelatedField(
        queryset=AssistanceRequest.objects.all(),
        source='request',
        write_only=True,
    )

    class Meta:
        model = Review
        fields = (
            'id',
            'request',
            'request_id',
            'customer',
            'provider',
            'provider_name',
            'rating',
            'comment',
            'is_public',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'request', 'customer', 'provider', 'created_at', 'updated_at')

    def validate_request_id(self, req: AssistanceRequest):
        user = self.context['request'].user

        # Ensure only the customer who booked the request can review it
        if req.customer != user and not user.is_platform_admin:
            raise serializers.ValidationError("You can only review assistance requests that you booked.")

        # Ensure request is completed
        if req.status != RequestStatus.COMPLETED:
            raise serializers.ValidationError(
                f"Reviews can only be submitted for completed assistance jobs (current status: '{req.status}')."
            )

        # Ensure assigned provider exists
        if not req.assigned_provider:
            raise serializers.ValidationError("This assistance request does not have an assigned provider.")

        # Ensure request has not already been reviewed
        if hasattr(req, 'review'):
            raise serializers.ValidationError("You have already submitted a review for this assistance request.")

        return req

    def create(self, validated_data):
        user = self.context['request'].user
        req = validated_data['request']
        provider = req.assigned_provider

        validated_data['customer'] = user
        validated_data['provider'] = provider
        return super().create(validated_data)
