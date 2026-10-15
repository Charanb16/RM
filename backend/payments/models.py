"""Payment and refund models with Decimal currency handling."""
from decimal import Decimal
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from core.utils import TimeStampedModel


class PaymentStatus(models.TextChoices):
    """Payment transaction states."""
    PENDING = 'pending', 'Pending Creation / Authorization'
    PROCESSING = 'processing', 'Processing Payment'
    COMPLETED = 'completed', 'Completed & Captured'
    FAILED = 'failed', 'Payment Failed'
    REFUNDED = 'refunded', 'Fully Refunded'
    PARTIALLY_REFUNDED = 'partially_refunded', 'Partially Refunded'


class PaymentMethod(models.TextChoices):
    """Supported payment modes."""
    RAZORPAY_UPI = 'razorpay_upi', 'UPI (Google Pay, PhonePe, Paytm)'
    RAZORPAY_CARD = 'razorpay_card', 'Credit / Debit Card'
    RAZORPAY_NETBANKING = 'razorpay_netbanking', 'Net Banking'
    RAZORPAY_WALLET = 'razorpay_wallet', 'Mobile Wallet'
    CASH = 'cash', 'Cash on Delivery / Direct to Technician'


class Payment(TimeStampedModel):
    """Payment record linked 1-to-1 with an AssistanceRequest.

    Stores Razorpay order, payment, and signature identifiers with HMAC verification audit.
    All financial figures strictly stored as Decimal.
    """

    request = models.OneToOneField(
        'assistance.AssistanceRequest',
        on_delete=models.CASCADE,
        related_name='payment',
        verbose_name='Assistance Request',
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments',
        verbose_name='Paying Customer',
    )
    amount = models.DecimalField(
        verbose_name='Amount (INR)',
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text='Payment amount in INR (always stored as Decimal, never float).',
    )
    currency = models.CharField(
        verbose_name='Currency',
        max_length=10,
        default='INR',
    )
    status = models.CharField(
        verbose_name='Payment Status',
        max_length=30,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        db_index=True,
    )
    payment_method = models.CharField(
        verbose_name='Payment Method',
        max_length=30,
        choices=PaymentMethod.choices,
        default=PaymentMethod.RAZORPAY_UPI,
    )
    razorpay_order_id = models.CharField(
        verbose_name='Razorpay Order ID',
        max_length=100,
        blank=True,
        null=True,
        db_index=True,
    )
    razorpay_payment_id = models.CharField(
        verbose_name='Razorpay Payment ID',
        max_length=100,
        blank=True,
        null=True,
        db_index=True,
    )
    razorpay_signature = models.CharField(
        verbose_name='Razorpay HMAC Signature',
        max_length=255,
        blank=True,
        null=True,
    )
    error_code = models.CharField(
        verbose_name='Gateway Error Code',
        max_length=100,
        blank=True,
    )
    error_description = models.TextField(
        verbose_name='Gateway Error Description',
        blank=True,
    )
    paid_at = models.DateTimeField(
        verbose_name='Payment Timestamp',
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['razorpay_order_id']),
            models.Index(fields=['razorpay_payment_id']),
        ]

    def __str__(self):
        return f"Payment #{self.id} for Req #{self.request_id} - ₹{self.amount} [{self.get_status_display()}]"


class Refund(TimeStampedModel):
    """Refund transaction issued against a captured payment."""

    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='refunds',
        verbose_name='Parent Payment',
    )
    amount = models.DecimalField(
        verbose_name='Refund Amount (INR)',
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    razorpay_refund_id = models.CharField(
        verbose_name='Razorpay Refund ID',
        max_length=100,
        blank=True,
    )
    reason = models.TextField(
        verbose_name='Refund Reason',
    )
    status = models.CharField(
        verbose_name='Refund Status',
        max_length=30,
        default='pending',
    )

    class Meta:
        verbose_name = 'Refund'
        verbose_name_plural = 'Refunds'
        ordering = ['-created_at']

    def __str__(self):
        return f"Refund #{self.id} for Payment #{self.payment_id} - ₹{self.amount} ({self.status})"
