"""Admin configuration for customer vehicles."""
from django.contrib import admin
from .models import Vehicle


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    """Admin interface for managing registered vehicles."""
    list_display = (
        'license_plate',
        'make',
        'model',
        'year',
        'vehicle_type',
        'owner',
        'color',
        'is_primary',
        'created_at',
    )
    list_filter = ('vehicle_type', 'is_primary', 'created_at', 'make')
    search_fields = ('license_plate', 'make', 'model', 'vin', 'owner__email', 'owner__full_name')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('owner',)
    fieldsets = (
        ('Owner Info', {'fields': ('owner',)}),
        ('Vehicle Specification', {
            'fields': ('make', 'model', 'year', 'vehicle_type', 'color', 'vin')
        }),
        ('Registration & Status', {
            'fields': ('license_plate', 'is_primary')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
