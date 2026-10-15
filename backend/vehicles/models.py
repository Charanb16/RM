"""Vehicle models representing automobiles registered by customers."""
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from core.utils import TimeStampedModel


class VehicleType(models.TextChoices):
    """Types of vehicles serviceable on the platform."""
    HATCHBACK = 'hatchback', 'Hatchback'
    SEDAN = 'sedan', 'Sedan'
    SUV = 'suv', 'SUV / Crossover'
    MOTORCYCLE = 'motorcycle', 'Motorcycle / Scooter'
    TRUCK = 'truck', 'Pickup Truck / LCV'
    VAN = 'van', 'Van / Minivan'
    OTHER = 'other', 'Other Vehicle'


class Vehicle(TimeStampedModel):
    """Customer-owned vehicle registered for roadside assistance dispatches.

    Enforces ownership by Customer user and tracks primary vehicle preference.
    """

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vehicles',
        verbose_name='Vehicle Owner',
        help_text='Customer user who owns and registers this vehicle.',
    )
    make = models.CharField(
        verbose_name='Make / Brand',
        max_length=50,
        help_text='Vehicle manufacturer (e.g. Maruti Suzuki, Hyundai, Toyota).',
    )
    model = models.CharField(
        verbose_name='Model',
        max_length=50,
        help_text='Vehicle model name (e.g. Swift, Creta, Fortuner).',
    )
    year = models.PositiveIntegerField(
        verbose_name='Manufacturing Year',
        validators=[
            MinValueValidator(1950, message="Year must be 1950 or newer."),
            MaxValueValidator(2035, message="Year cannot exceed 2035."),
        ],
        help_text='Year of manufacture.',
    )
    license_plate = models.CharField(
        verbose_name='Registration Number',
        max_length=20,
        db_index=True,
        help_text='Official vehicle license plate number (e.g. DL 01 AB 1234).',
    )
    vehicle_type = models.CharField(
        verbose_name='Vehicle Type',
        max_length=20,
        choices=VehicleType.choices,
        default=VehicleType.SEDAN,
        help_text='Body style/category of the vehicle.',
    )
    color = models.CharField(
        verbose_name='Color',
        max_length=30,
        help_text='Exterior color (e.g. White, Metallic Silver, Black).',
    )
    vin = models.CharField(
        verbose_name='Vehicle Identification Number (VIN)',
        max_length=17,
        blank=True,
        null=True,
        help_text='Optional 17-character VIN number.',
    )
    is_primary = models.BooleanField(
        verbose_name='Primary Vehicle',
        default=False,
        help_text='If true, this vehicle defaults as pre-selected for new service requests.',
    )

    class Meta:
        verbose_name = 'Vehicle'
        verbose_name_plural = 'Vehicles'
        ordering = ['-is_primary', '-created_at']
        unique_together = ('owner', 'license_plate')

    def __str__(self):
        primary_badge = " (Primary)" if self.is_primary else ""
        return f"{self.year} {self.make} {self.model} [{self.license_plate}]{primary_badge}"
