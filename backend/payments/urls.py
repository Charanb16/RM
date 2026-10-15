"""URL routing for payments app."""
from django.urls import path
from .views import (
    CreateOrderView,
    PaymentDetailView,
    RazorpayWebhookView,
    VerifyPaymentView,
)

app_name = 'payments'

urlpatterns = [
    path('create-order/', CreateOrderView.as_view(), name='create-order'),
    path('verify/', VerifyPaymentView.as_view(), name='verify-payment'),
    path('webhook/', RazorpayWebhookView.as_view(), name='razorpay-webhook'),
    path('<int:pk>/', PaymentDetailView.as_view(), name='payment-detail'),
]
