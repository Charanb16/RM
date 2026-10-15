"""Views for user registration, authentication, profile management, and logout."""
import logging
from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from core.utils import api_success_response
from .serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
)

logger = logging.getLogger('roadmate.accounts')
User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Register a new customer or service provider account.

    Accessible to unauthenticated visitors. Returns the newly created user profile.
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        logger.info("New user registered successfully: id=%s email=%s role=%s", user.id, user.email, user.role)
        return Response(
            {
                "success": True,
                "message": "User registered successfully.",
                "user": UserProfileSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class CustomLoginView(TokenObtainPairView):
    """Authenticate with email and password to receive JWT access and refresh tokens.

    Injects user role and provider status into the token response payload.
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Retrieve or update the authenticated user's profile details."""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """Change password for the currently logged-in user."""
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        logger.info("Password changed for user id=%s", user.id)
        return api_success_response(message="Password updated successfully.")


class LogoutView(APIView):
    """Logout user by blacklisting their JWT refresh token."""
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {"detail": "Refresh token is required.", "code": "missing_refresh_token", "field_errors": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return api_success_response(message="Successfully logged out and token blacklisted.")
        except Exception as exc:
            logger.warning("Token blacklisting failed: %s", str(exc))
            return Response(
                {"detail": "Invalid or expired token.", "code": "invalid_token", "field_errors": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )
