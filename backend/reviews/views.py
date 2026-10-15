"""Views for browsing, submitting, and managing customer reviews."""
from rest_framework import permissions, viewsets
from accounts.permissions import IsCustomer, IsOwnerOrReadOnly
from .models import Review
from .serializers import ReviewSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    """ViewSet for browsing public reviews and submitting feedback for completed assistance requests."""
    queryset = Review.objects.all().select_related('customer', 'provider', 'request')
    serializer_class = ReviewSerializer
    filterset_fields = ('provider', 'rating', 'is_public')
    search_fields = ('comment', 'provider__business_name', 'customer__full_name')
    ordering_fields = ('rating', 'created_at')
    ordering = ('-created_at',)

    def get_permissions(self):
        """Allow public read access; review creation requires Customer role; modification requires ownership."""
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        if self.action == 'create':
            return [permissions.IsAuthenticated(), IsCustomer()]
        return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]

    def get_queryset(self):
        """Public visitors only see public reviews; admins see all."""
        user = self.request.user
        if user.is_authenticated and user.is_platform_admin:
            return self.queryset
        return self.queryset.filter(is_public=True)
