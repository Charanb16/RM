"""Serializers for user registration, authentication, and profile management."""
import re
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import UserRole

User = get_user_model()


class UserSummarySerializer(serializers.ModelSerializer):
    """Lightweight user serializer for nested representations in requests/offers/reviews."""

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'phone', 'role', 'avatar')
        read_only_fields = fields


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for registering new customer and service provider accounts."""

    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text='Account password (minimum 8 characters).',
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text='Re-enter password for confirmation.',
    )
    role = serializers.ChoiceField(
        choices=[UserRole.CUSTOMER, UserRole.PROVIDER],
        default=UserRole.CUSTOMER,
        help_text='Select either "customer" or "provider".',
    )

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'phone',
            'full_name',
            'role',
            'password',
            'password_confirm',
            'date_joined',
        )
        read_only_fields = ('id', 'date_joined')

    def validate_email(self, value):
        """Ensure email is lowercased and unique."""
        norm_email = value.lower().strip()
        if User.objects.filter(email=norm_email).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return norm_email

    def validate_phone(self, value):
        """Validate phone format and uniqueness if provided."""
        if not value:
            return value
        cleaned = re.sub(r'[\s\-\(\)]', '', value)
        if not re.match(r'^\+?[0-9]{10,15}$', cleaned):
            raise serializers.ValidationError("Enter a valid phone number with 10 to 15 digits.")
        if User.objects.filter(phone=cleaned).exists():
            raise serializers.ValidationError("An account with this phone number already exists.")
        return cleaned

    def validate(self, attrs):
        """Verify matching passwords and validate password complexity."""
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')

        if password != password_confirm:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})

        # Apply Django's built-in password validators
        validate_password(password)

        return attrs

    def create(self, validated_data):
        """Create user with hashed password and auto-initialize provider profile if role is provider."""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        role = validated_data.get('role', UserRole.CUSTOMER)

        user = User.objects.create_user(password=password, **validated_data)

        # Automatically create ProviderProfile skeleton if registered as provider
        if role == UserRole.PROVIDER:
            from providers.models import ProviderProfile
            ProviderProfile.objects.create(
                user=user,
                business_name=user.full_name,
            )

        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom SimpleJWT token serializer injecting user profile metadata in response."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Custom claims
        token['email'] = user.email
        token['full_name'] = user.full_name
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        data['user'] = {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'phone': user.phone,
            'role': user.role,
            'is_customer': user.is_customer,
            'is_provider': user.is_provider,
            'is_staff': user.is_staff,
        }

        # Include provider-specific status if applicable
        if user.is_provider and hasattr(user, 'provider_profile'):
            profile = user.provider_profile
            data['user']['provider_profile'] = {
                'id': profile.id,
                'business_name': profile.business_name,
                'verification_status': profile.verification_status,
                'is_online': profile.is_online,
                'average_rating': str(profile.average_rating),
            }

        return data


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for retrieving and updating user profile details."""

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'phone',
            'full_name',
            'role',
            'avatar',
            'is_active',
            'date_joined',
        )
        read_only_fields = ('id', 'email', 'role', 'is_active', 'date_joined')

    def validate_phone(self, value):
        """Validate phone format and uniqueness excluding current user."""
        if not value:
            return value
        cleaned = re.sub(r'[\s\-\(\)]', '', value)
        if not re.match(r'^\+?[0-9]{10,15}$', cleaned):
            raise serializers.ValidationError("Enter a valid phone number with 10 to 15 digits.")
        instance = self.instance
        qs = User.objects.filter(phone=cleaned)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("An account with this phone number already exists.")
        return cleaned


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing the password of the authenticated user."""

    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text='Current account password.',
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text='New replacement password (min 8 characters).',
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text='Confirm new replacement password.',
    )

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, attrs):
        new_password = attrs.get('new_password')
        new_password_confirm = attrs.get('new_password_confirm')

        if new_password != new_password_confirm:
            raise serializers.ValidationError({"new_password_confirm": "New passwords do not match."})

        validate_password(new_password)
        return attrs
