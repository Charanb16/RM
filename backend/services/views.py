"""Views for managing and browsing roadside assistance services."""
from rest_framework import permissions, viewsets
from accounts.permissions import IsAdmin
from .models import Service
from .serializers import ServiceSerializer


class ServiceViewSet(viewsets.ModelViewSet):
    """API endpoint allowing clients to browse services and administrators to manage them.

    - Unauthenticated/Customer users can list and retrieve active services.
    - Platform administrators can create, update, or deactivate services.
    """
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    filterset_fields = ('category', 'is_active')
    search_fields = ('name', 'description', 'code')
    ordering_fields = ('name', 'base_price', 'category', 'created_at')
    ordering = ('category', 'name')

    def get_permissions(self):
        """Allow read-only requests for anyone; mutations require Admin privileges."""
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdmin()]

    def get_queryset(self):
        """Default non-admin users only see active catalog offerings."""
        user = self.request.user
        if user.is_authenticated and user.is_platform_admin:
            return Service.objects.all()
        return Service.objects.filter(is_active=True)
