"""URL routing for providers app."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    AdminProviderVerificationView,
    NearbyProvidersView,
    ProviderLocationUpdateView,
    ProviderProfileView,
    ProviderServicesViewSet,
    ProviderToggleOnlineView,
)

app_name = 'providers'

router = DefaultRouter()
router.register(r'my-services', ProviderServicesViewSet, basename='provider-service')

urlpatterns = [
    path('me/', ProviderProfileView.as_view(), name='my-profile'),
    path('location/', ProviderLocationUpdateView.as_view(), name='update-location'),
    path('toggle-online/', ProviderToggleOnlineView.as_view(), name='toggle-online'),
    path('nearby/', NearbyProvidersView.as_view(), name='nearby-providers'),
    path('<int:pk>/verify/', AdminProviderVerificationView.as_view(), name='admin-verify-provider'),
    path('', include(router.urls)),
]
