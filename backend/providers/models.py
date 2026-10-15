"""Provider models managing mechanics, verification status, and PostGIS location data."""
from decimal import Decimal
from django.conf import settings
from django.contrib.gis.db import models as gis_models
from django.db import models
from core.utils import TimeStampedModel, coords_from_point


class VerificationStatus(models.TextChoices):
    """Lifecycle states for provider business and identity verification."""
    PENDING = 'pending', 'Pending Approval'
    APPROVED = 'approved', 'Approved & Verified'
    REJECTED = 'rejected', 'Rejected'
    SUSPENDED = 'suspended', 'Suspended'


class ProviderProfile(TimeStampedModel):
    """Profile extension for Service Providers, storing real-time location and credentials.

    Uses GeoDjango PointField with PostGIS spatial indexing for high-performance
    distance calculation and radial radius dispatch queries.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='provider_profile',
        verbose_name='User Account',
        help_text='Associated provider user account.',
    )
    business_name = models.CharField(
        verbose_name='Business / Trading Name',
        max_length=150,
        help_text='Name of mechanic workshop or individual technician.',
    )
    location = gis_models.PointField(
        verbose_name='Current GPS Location',
        srid=4326,
        geography=True,
        null=True,
        blank=True,
        help_text='Current PostGIS geographical coordinate (Point) in WGS 84.',
    )
    verification_status = models.CharField(
        verbose_name='Verification Status',
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
        db_index=True,
        help_text='Administrative approval status allowing the provider to accept jobs.',
    )
    is_online = models.BooleanField(
        verbose_name='Online & Available',
        default=False,
        db_index=True,
        help_text='Whether the provider is currently on-shift and accepting dispatch requests.',
    )
    is_busy = models.BooleanField(
        verbose_name='Busy on Active Job',
        default=False,
        db_index=True,
        help_text='Indicates provider is currently attending an in-progress assistance job.',
    )
    service_radius_km = models.PositiveIntegerField(
        verbose_name='Max Service Radius (KM)',
        default=5,
        help_text='Maximum distance in kilometers the provider is willing to travel for jobs.',
    )
    services = models.ManyToManyField(
        'services.Service',
        through='ProviderService',
        related_name='providers',
        verbose_name='Offered Services',
        blank=True,
        help_text='Catalog services supported by this provider.',
    )
    bio = models.TextField(
        verbose_name='Provider Bio / Description',
        blank=True,
        help_text='Experience, specialty equipment, or company description.',
    )
    id_document_url = models.URLField(
        verbose_name='ID / Trade License Document URL',
        blank=True,
        help_text='URL to uploaded government ID or business certificate.',
    )
    business_license_number = models.CharField(
        verbose_name='License / GST Number',
        max_length=100,
        blank=True,
        help_text='Official trade license or tax identification registration.',
    )
    approved_at = models.DateTimeField(
        verbose_name='Approved At',
        null=True,
        blank=True,
        help_text='Timestamp when administrative verification was approved.',
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='approved_providers',
        null=True,
        blank=True,
        verbose_name='Approved By Admin',
        help_text='Platform administrator who reviewed and approved this profile.',
    )
    average_rating = models.DecimalField(
        verbose_name='Average Customer Rating',
        max_digits=3,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text='Aggregated customer review rating (1.00 to 5.00).',
    )
    total_reviews = models.PositiveIntegerField(
        verbose_name='Total Reviews Count',
        default=0,
        help_text='Total number of completed verified customer reviews.',
    )
    last_location_update = models.DateTimeField(
        verbose_name='Last GPS Ping Timestamp',
        null=True,
        blank=True,
        help_text='Timestamp of the most recent location ping from provider mobile app.',
    )

    class Meta:
        verbose_name = 'Provider Profile'
        verbose_name_plural = 'Provider Profiles'
        ordering = ['-average_rating', '-created_at']
        indexes = [
            models.Index(fields=['verification_status', 'is_online', 'is_busy']),
        ]

    def __str__(self):
        online_str = "🟢 Online" if self.is_online else "⚪ Offline"
        return f"{self.business_name} ({self.get_verification_status_display()}) [{online_str}]"

    @property
    def is_eligible_for_dispatch(self) -> bool:
        """Determines if the provider is currently available to receive dispatched job offers."""
        return (
            self.verification_status == VerificationStatus.APPROVED
            and self.is_online
            and not self.is_busy
            and self.location is not None
        )

    @property
    def coordinates(self) -> dict:
        """Return dict of latitude and longitude floats."""
        return coords_from_point(self.location)


class ProviderService(TimeStampedModel):
    """Through-model connecting providers with services they offer, allowing custom pricing."""

    provider = models.ForeignKey(
        ProviderProfile,
        on_delete=models.CASCADE,
        related_name='provider_services',
        verbose_name='Provider',
    )
    service = models.ForeignKey(
        'services.Service',
        on_delete=models.CASCADE,
        related_name='offered_by_providers',
        verbose_name='Service Offering',
    )
    custom_base_price = models.DecimalField(
        verbose_name='Custom Base Price Override (INR)',
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Optional custom base rate if different from standard catalog price.',
    )
    is_available = models.BooleanField(
        verbose_name='Service Currently Available',
        default=True,
        help_text='Allows provider to temporarily pause a specific service offering.',
    )

    class Meta:
        verbose_name = 'Provider Service Offering'
        verbose_name_plural = 'Provider Service Offerings'
        unique_together = ('provider', 'service')
        ordering = ['service__name']

    def __str__(self):
        price = self.custom_base_price or self.service.base_price
        return f"{self.provider.business_name} - {self.service.name} (₹{price})"
