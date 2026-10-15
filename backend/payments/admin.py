"""Admin configuration for Payment and Refund models."""
from django.contrib import admin
from .models import Payment, Refund


class RefundInline(admin.TabularInline):
    """Inline view of refunds issued on a payment."""
    model = Refund
    extra = 0
    readonly_fields = ('amount', 'razorpay_refund_id', 'status', 'created_at')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Rich admin representation for payment transactions."""
    list_display = (
        'id',
        'request_id_display',
        'customer_email',
        'amount',
        'currency',
        'status',
        'payment_method',
        'razorpay_order_id',
        'razorpay_payment_id',
        'paid_at',
        'created_at',
    )
    list_filter = ('status', 'payment_method', 'currency', 'created_at')
    search_fields = (
        'razorpay_order_id',
        'razorpay_payment_id',
        'customer__email',
        'customer__full_name',
        'request__id',
    )
    ordering = ('-created_at',)
    readonly_fields = (
        'request',
        'customer',
        'razorpay_order_id',
        'razorpay_payment_id',
        'razorpay_signature',
        'paid_at',
        'created_at',
        'updated_at',
    )
    raw_id_fields = ('request', 'customer')
    inlines = [RefundInline]

    fieldsets = (
        ('Transaction Summary', {
            'fields': ('request', 'customer', 'amount', 'currency', 'status', 'payment_method')
        }),
        ('Gateway Identifiers & Signature', {
            'fields': ('razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature', 'paid_at')
        }),
        ('Error Diagnostics', {
            'fields': ('error_code', 'error_description'),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def request_id_display(self, obj):
        return f"Req #{obj.request_id}"
    request_id_display.short_description = 'Request'

    def customer_email(self, obj):
        return obj.customer.email
    customer_email.short_description = 'Customer'


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    """Admin representation for issued refunds."""
    list_display = ('id', 'payment_id_display', 'amount', 'razorpay_refund_id', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('razorpay_refund_id', 'payment__razorpay_order_id')
    raw_id_fields = ('payment',)
    readonly_fields = ('created_at', 'updated_at')

    def payment_id_display(self, obj):
        return f"Payment #{obj.payment_id}"
    payment_id_display.short_description = 'Payment'
