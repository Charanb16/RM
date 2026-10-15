"""Admin configuration for Service catalog."""
from django.contrib import admin
from .models import Service


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    """Admin representation for roadside assistance services."""
    list_display = (
        'name',
        'code',
        'category',
        'base_price',
        'per_km_price',
        'estimated_duration_minutes',
        'is_active',
        'created_at',
    )
    list_filter = ('category', 'is_active', 'created_at')
    search_fields = ('name', 'code', 'description')
    ordering = ('category', 'name')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Service Details', {
            'fields': ('name', 'code', 'category', 'description', 'icon', 'is_active')
        }),
        ('Pricing & Timing', {
            'fields': ('base_price', 'per_km_price', 'estimated_duration_minutes')
        }),
        ('Audit Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
