"""Service models representing catalog offerings in the RoadMate system."""
from decimal import Decimal
from django.core.validators import MinValueValidator
from django.db import models
from core.utils import TimeStampedModel


class ServiceCategory(models.TextChoices):
    """Categories of emergency assistance services available on RoadMate."""
    TOWING = 'towing', 'Towing Service'
    FLAT_TIRE = 'flat_tire', 'Flat Tire Repair / Replacement'
    BATTERY_JUMP = 'battery_jump', 'Battery Jumpstart'
    FUEL_DELIVERY = 'fuel_delivery', 'Emergency Fuel Delivery'
    LOCKOUT = 'lockout', 'Lockout Assistance'
    MECHANICAL_REPAIR = 'mechanical_repair', 'On-Site Mechanical Repair'
    WINCHING = 'winching', 'Winching / Ditch Extraction'
    OTHER = 'other', 'Other Assistance'


class Service(TimeStampedModel):
    """Roadside assistance service catalog item.

    Represents a standard service offering (e.g. Towing, Battery Jumpstart)
    with base pricing, category, and average duration estimates.
    """

    name = models.CharField(
        verbose_name='Service Name',
        max_length=100,
        help_text='Human-readable service title (e.g. Flatbed Towing).',
    )
    code = models.CharField(
        verbose_name='Service Code',
        max_length=50,
        unique=True,
        db_index=True,
        help_text='Unique identifier code (e.g. TOW_FLATBED, BATT_JUMP).',
    )
    category = models.CharField(
        verbose_name='Category',
        max_length=30,
        choices=ServiceCategory.choices,
        db_index=True,
        help_text='Broad category classification for filtering and dispatch.',
    )
    description = models.TextField(
        verbose_name='Description',
        help_text='Detailed overview of what this service covers and includes.',
    )
    base_price = models.DecimalField(
        verbose_name='Base Price (INR)',
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text='Starting base cost for dispatching this service.',
    )
    per_km_price = models.DecimalField(
        verbose_name='Per-KM Rate (INR)',
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text='Additional cost per kilometer (primarily applicable for towing).',
    )
    estimated_duration_minutes = models.PositiveIntegerField(
        verbose_name='Estimated Duration (Minutes)',
        default=30,
        help_text='Typical expected duration on-site to resolve this problem.',
    )
    icon = models.CharField(
        verbose_name='Icon Identifier',
        max_length=100,
        blank=True,
        help_text='Frontend icon name or URL (e.g. "truck-tow", "battery-charging").',
    )
    is_active = models.BooleanField(
        verbose_name='Is Active',
        default=True,
        db_index=True,
        help_text='Whether this service is currently offered to customers.',
    )

    class Meta:
        verbose_name = 'Service'
        verbose_name_plural = 'Services'
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_category_display()}) - ₹{self.base_price}"
