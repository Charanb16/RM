"""Custom User model and UserManager for the RoadMate platform.

Supports email-based authentication and role-based access control (Customer, Provider, Admin).
"""
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from core.utils import TimeStampedModel


class UserRole(models.TextChoices):
    """Enumeration of platform user roles."""
    CUSTOMER = 'customer', 'Customer'
    PROVIDER = 'provider', 'Service Provider'
    ADMIN = 'admin', 'Platform Administrator'


class UserManager(BaseUserManager):
    """Custom user manager where email is the unique identifier for authentication."""

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a standard user with the given email and password.

        Args:
            email: Primary contact email address.
            password: Raw plaintext password to be hashed.
            **extra_fields: Additional attributes (full_name, phone, role).

        Returns:
            User instance.
        """
        if not email:
            raise ValueError('The Email address must be provided.')
        email = self.normalize_email(email).lower()
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', UserRole.CUSTOMER)

        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a Superuser with platform administrator privileges."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', UserRole.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """Custom user model for RoadMate.

    Uses email as the unique username identifier for secure JWT authentication.
    Maintains a role discriminator for Customer, Service Provider, and Admin permissions.
    """

    email = models.EmailField(
        verbose_name='Email Address',
        max_length=255,
        unique=True,
        db_index=True,
        help_text='Unique email address used for login and notifications.',
    )
    phone = models.CharField(
        verbose_name='Phone Number',
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        help_text='Contact phone number in international format (e.g. +919876543210).',
    )
    full_name = models.CharField(
        verbose_name='Full Name',
        max_length=150,
        help_text="User's complete legal name or business representative name.",
    )
    role = models.CharField(
        verbose_name='User Role',
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.CUSTOMER,
        db_index=True,
        help_text='System role determining access control permissions across the platform.',
    )
    avatar = models.ImageField(
        verbose_name='Profile Picture',
        upload_to='avatars/',
        null=True,
        blank=True,
        help_text='Optional profile picture or logo.',
    )
    is_active = models.BooleanField(
        verbose_name='Active',
        default=True,
        help_text='Designates whether this user should be treated as active. Unselect instead of deleting.',
    )
    is_staff = models.BooleanField(
        verbose_name='Staff Status',
        default=False,
        help_text='Designates whether the user can log into the Django admin site.',
    )
    date_joined = models.DateTimeField(
        verbose_name='Date Joined',
        default=timezone.now,
        help_text='The timestamp when the user registered.',
    )

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['email', 'role']),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.email}) [{self.get_role_display()}]"

    @property
    def is_customer(self) -> bool:
        """Check if user role is Customer."""
        return self.role == UserRole.CUSTOMER

    @property
    def is_provider(self) -> bool:
        """Check if user role is Service Provider."""
        return self.role == UserRole.PROVIDER

    @property
    def is_platform_admin(self) -> bool:
        """Check if user is a platform administrator."""
        return self.role == UserRole.ADMIN or self.is_staff or self.is_superuser
