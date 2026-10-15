"""Serializers for payment order creation, verification, and audit details."""
from decimal import Decimal
from rest_framework import serializers

from accounts.serializers import UserSummarySerializer
from assistance.fsm import RequestStatus
from assistance.models import AssistanceRequest
from .models import Payment, PaymentMethod, PaymentStatus, Refund


class PaymentDetailSerializer(serializers.ModelSerializer):
    """Complete serializer for payment transactions."""

    customer = UserSummarySerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = Payment
        fields = (
            'id',
            'request',
            'customer',
            'amount',
            'currency',
            'status',
            'status_display',
            'payment_method',
            'payment_method_display',
            'razorpay_order_id',
            'razorpay_payment_id',
            'paid_at',
            'error_code',
            'error_description',
            'created_at',
            'updated_at',
        )
        read_only_fields = fields


class CreateOrderSerializer(serializers.Serializer):
    """Serializer for generating a new Razorpay checkout order for an assistance request."""

    request_id = serializers.PrimaryKeyRelatedField(
        queryset=AssistanceRequest.objects.all(),
        help_text='ID of the assistance request to bill.',
    )
    payment_method = serializers.ChoiceField(
        choices=PaymentMethod.choices,
        default=PaymentMethod.RAZORPAY_UPI,
        help_text='Intended payment method.',
    )

    def validate_request_id(self, req: AssistanceRequest):
        user = self.context['request'].user
        # Must be customer who made the request, or admin
        if req.customer != user and not user.is_platform_admin:
            raise serializers.ValidationError("You can only initiate payment for your own requests.")

        if req.status in [RequestStatus.DRAFT, RequestStatus.REQUESTED, RequestStatus.CANCELLED]:
            raise serializers.ValidationError(f"Cannot generate payment for a request with status '{req.status}'.")

        # Determine billing amount
        billable_amount = req.final_amount or req.quoted_amount
        if not billable_amount or billable_amount <= Decimal('0.00'):
            raise serializers.ValidationError("The assistance request does not have a billable amount.")

        # Check if already paid
        if hasattr(req, 'payment') and req.payment.status == PaymentStatus.COMPLETED:
            raise serializers.ValidationError("This assistance request has already been paid in full.")

        return req


class VerifyPaymentSerializer(serializers.Serializer):
    """Serializer for submitting Razorpay checkout payload for HMAC-SHA256 signature verification."""

    razorpay_order_id = serializers.CharField(
        required=True,
        max_length=100,
        help_text='Order ID returned from order creation.',
    )
    razorpay_payment_id = serializers.CharField(
        required=True,
        max_length=100,
        help_text='Payment ID issued by Razorpay checkout gateway.',
    )
    razorpay_signature = serializers.CharField(
        required=True,
        max_length=255,
        help_text='HMAC-SHA256 signature returned by Razorpay checkout.',
    )
    payment_method = serializers.ChoiceField(
        choices=PaymentMethod.choices,
        required=False,
        default=PaymentMethod.RAZORPAY_UPI,
    )


class RefundSerializer(serializers.ModelSerializer):
    """Serializer for issuing refunds on completed payments."""

    class Meta:
        model = Refund
        fields = (
            'id',
            'payment',
            'amount',
            'razorpay_refund_id',
            'reason',
            'status',
            'created_at',
        )
        read_only_fields = ('id', 'razorpay_refund_id', 'status', 'created_at')

    def validate_amount(self, value):
        if value <= Decimal('0.00'):
            raise serializers.ValidationError("Refund amount must be greater than zero.")
        return value
