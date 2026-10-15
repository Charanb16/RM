"""URL routing for assistance app."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import AssistanceOfferViewSet, AssistanceRequestViewSet

app_name = 'assistance'

router = DefaultRouter()
router.register(r'requests', AssistanceRequestViewSet, basename='assistance-request')
router.register(r'offers', AssistanceOfferViewSet, basename='assistance-offer')

urlpatterns = [
    path('', include(router.urls)),
]
