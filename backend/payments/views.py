"""Views for Razorpay order generation, cryptographic HMAC signature verification, and webhooks."""
import json
import logging
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsOwnerOrReadOnly
from assistance.fsm import record_booking_event
from core.exceptions import BadRequest, Conflict, Forbidden, NotFound
from core.utils import api_success_response
from .models import Payment, PaymentMethod, PaymentStatus
from .razorpay_client import (
    KEY_ID,
    RazorpayClient,
    verify_payment_signature,
    verify_webhook_signature,
)
from .serializers import (
    CreateOrderSerializer,
    PaymentDetailSerializer,
    VerifyPaymentSerializer,
)

logger = logging.getLogger('roadmate.payments')


class CreateOrderView(APIView):
    """Generate a Razorpay checkout order for an assistance request."""
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = CreateOrderSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        req = serializer.validated_data['request_id']
        payment_method = serializer.validated_data.get('payment_method', PaymentMethod.RAZORPAY_UPI)

        amount = req.final_amount or req.quoted_amount
        if not amount or amount <= Decimal('0.00'):
            raise BadRequest("Cannot create order for zero or negative amount.")

        client = RazorpayClient()
        order_data = client.create_order(
            amount=amount,
            currency="INR",
            receipt=f"req_{req.id}",
            notes={
                "request_id": req.id,
                "customer_id": request.user.id,
                "customer_email": request.user.email,
                "service": req.service.name,
            },
        )

        razorpay_order_id = order_data['id']

        # Create or update Payment record
        payment, _ = Payment.objects.update_or_create(
            request=req,
            defaults={
                'customer': request.user,
                'amount': amount,
                'currency': 'INR',
                'status': PaymentStatus.PENDING,
                'payment_method': payment_method,
                'razorpay_order_id': razorpay_order_id,
            },
        )

        record_booking_event(
            request_obj=req,
            actor=request.user,
            from_status=req.status,
            to_status=req.status,
            event_type="PAYMENT_ORDER_CREATED",
            note=f"Payment order {razorpay_order_id} generated for ₹{amount}.",
            metadata={"razorpay_order_id": razorpay_order_id, "amount": str(amount)},
        )

        return api_success_response(
            data={
                "order_id": razorpay_order_id,
                "amount": str(amount),
                "amount_in_paise": order_data['amount'],
                "currency": order_data['currency'],
                "key_id": KEY_ID,
                "payment_id": payment.id,
                "customer": {
                    "name": request.user.full_name,
                    "email": request.user.email,
                    "phone": request.user.phone or "",
                },
            },
            message="Payment order created successfully.",
            status_code=status.HTTP_201_CREATED,
        )


class VerifyPaymentView(APIView):
    """Verify cryptographic HMAC-SHA256 signature returned by Razorpay checkout client."""
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = VerifyPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order_id = serializer.validated_data['razorpay_order_id']
        payment_id = serializer.validated_data['razorpay_payment_id']
        signature = serializer.validated_data['razorpay_signature']
        payment_method = serializer.validated_data.get('payment_method')

        try:
            payment = Payment.objects.select_for_update().get(razorpay_order_id=order_id)
        except Payment.DoesNotExist:
            raise NotFound(f"No payment record found for order ID '{order_id}'.")

        # Verify HMAC-SHA256 signature
        is_valid = verify_payment_signature(
            razorpay_order_id=order_id,
            razorpay_payment_id=payment_id,
            razorpay_signature=signature,
        )

        if not is_valid:
            payment.status = PaymentStatus.FAILED
            payment.error_code = "INVALID_SIGNATURE"
            payment.error_description = "HMAC-SHA256 signature verification failed."
            payment.save(update_fields=['status', 'error_code', 'error_description', 'updated_at'])

            logger.error("Signature verification failed for order %s and payment %s", order_id, payment_id)
            raise BadRequest("Cryptographic payment signature verification failed.")

        # Payment verified successfully
        payment.status = PaymentStatus.COMPLETED
        payment.razorpay_payment_id = payment_id
        payment.razorpay_signature = signature
        if payment_method:
            payment.payment_method = payment_method
        payment.paid_at = timezone.now()
        payment.save()

        # Update event log
        record_booking_event(
            request_obj=payment.request,
            actor=request.user,
            from_status=payment.request.status,
            to_status=payment.request.status,
            event_type="PAYMENT_CAPTURED",
            note=f"Payment ₹{payment.amount} verified and captured successfully via Razorpay (Tx: {payment_id}).",
            metadata={"payment_id": payment_id, "order_id": order_id, "amount": str(payment.amount)},
        )

        logger.info("Payment #%s captured successfully for Request #%s", payment.id, payment.request.id)

        return api_success_response(
            data=PaymentDetailSerializer(payment).data,
            message="Payment verified and captured successfully.",
        )


@method_decorator(csrf_exempt, name='dispatch')
class RazorpayWebhookView(APIView):
    """Asynchronous webhook receiver for Razorpay payment lifecycle events.

    Validates incoming 'X-Razorpay-Signature' header with HMAC-SHA256 before processing.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        signature = request.headers.get('X-Razorpay-Signature')
        if not signature:
            logger.warning("Webhook received without X-Razorpay-Signature header.")
            return Response({"detail": "Missing signature header."}, status=status.HTTP_400_BAD_REQUEST)

        # Cryptographically verify webhook body
        if not verify_webhook_signature(request.body, signature):
            logger.warning("Webhook HMAC signature validation failed.")
            return Response({"detail": "Invalid webhook signature."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = json.loads(request.body.decode('utf-8'))
        except Exception:
            return Response({"detail": "Malformed JSON."}, status=status.HTTP_400_BAD_REQUEST)

        event = payload.get('event')
        entity_payload = payload.get('payload', {}).get('payment', {}).get('entity', {})
        order_id = entity_payload.get('order_id')
        payment_id = entity_payload.get('id')

        logger.info("Razorpay webhook event received: %s (Order: %s, Payment: %s)", event, order_id, payment_id)

        if order_id:
            try:
                payment = Payment.objects.get(razorpay_order_id=order_id)
                if event == 'payment.captured' and payment.status != PaymentStatus.COMPLETED:
                    payment.status = PaymentStatus.COMPLETED
                    payment.razorpay_payment_id = payment_id
                    payment.paid_at = timezone.now()
                    payment.save()
                elif event == 'payment.failed':
                    payment.status = PaymentStatus.FAILED
                    payment.error_code = entity_payload.get('error_code', 'PAYMENT_FAILED')
                    payment.error_description = entity_payload.get('error_description', '')
                    payment.save()
            except Payment.DoesNotExist:
                logger.info("Webhook received for unknown order: %s", order_id)

        return Response({"status": "acknowledged"}, status=status.HTTP_200_OK)


class PaymentDetailView(generics.RetrieveAPIView):
    """Retrieve detailed payment status and receipt information."""
    queryset = Payment.objects.all().select_related('customer', 'request')
    serializer_class = PaymentDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
