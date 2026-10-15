"""Views for customer vehicle CRUD operations and primary vehicle management."""
from django.db import transaction
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsOwnerOrReadOnly
from core.utils import api_success_response
from .models import Vehicle
from .serializers import VehicleSerializer


class VehicleViewSet(viewsets.ModelViewSet):
    """ViewSet for customers to manage their vehicles registered on the platform.

    Provides standard CRUD operations plus a dedicated `set-primary` action.
    """
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    filterset_fields = ('vehicle_type', 'is_primary', 'make')
    search_fields = ('make', 'model', 'license_plate', 'vin')
    ordering_fields = ('year', 'created_at', 'make')
    ordering = ('-is_primary', '-created_at')

    def get_queryset(self):
        """Customers see only their own vehicles; platform admins can view all."""
        user = self.request.user
        if user.is_platform_admin:
            return Vehicle.objects.all().select_related('owner')
        return Vehicle.objects.filter(owner=user)

    @action(detail=True, methods=['post'], url_path='set-primary')
    @transaction.atomic
    def set_primary(self, request, pk=None):
        """Set this vehicle as the user's primary vehicle and unset any previously active primary."""
        vehicle = self.get_object()
        Vehicle.objects.filter(owner=request.user, is_primary=True).exclude(pk=vehicle.pk).update(is_primary=False)
        vehicle.is_primary = True
        vehicle.save(update_fields=['is_primary', 'updated_at'])
        return api_success_response(
            data=self.get_serializer(vehicle).data,
            message=f"{vehicle.make} {vehicle.model} set as primary vehicle."
        )
