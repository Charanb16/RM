"""Custom permission classes for role-based access control in RoadMate."""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsCustomer(BasePermission):
    """Allows access only to authenticated users with the Customer role."""
    message = "Only customers are permitted to perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_customer
        )


class IsProvider(BasePermission):
    """Allows access only to authenticated users with the Service Provider role."""
    message = "Only registered service providers are permitted to perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_provider
        )


class IsAdmin(BasePermission):
    """Allows access only to platform administrators."""
    message = "Only platform administrators are permitted to perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_platform_admin
        )


class IsOwnerOrReadOnly(BasePermission):
    """Object-level permission allowing read-only access to any request,

    while restricting write actions exclusively to the object's owner.
    """
    message = "You can only modify or delete your own resources."

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        # Check for various user owner conventions on objects
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        if hasattr(obj, 'customer'):
            return obj.customer == request.user
        return False


class IsAssistanceParticipant(BasePermission):
    """Object-level permission allowing access to customers or providers involved in a booking."""
    message = "You are not an authorized participant in this assistance request."

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_platform_admin:
            return True

        customer_match = getattr(obj, 'customer', None) == user
        provider_match = (
            hasattr(obj, 'assigned_provider')
            and obj.assigned_provider is not None
            and getattr(obj.assigned_provider, 'user', None) == user
        )
        return customer_match or provider_match
