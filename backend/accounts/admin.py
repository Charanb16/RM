"""Admin interface configuration for User model."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    """Rich admin representation for custom User model."""
    list_display = (
        'email',
        'full_name',
        'phone',
        'role',
        'is_active',
        'is_staff',
        'date_joined',
    )
    list_filter = ('role', 'is_active', 'is_staff', 'date_joined')
    search_fields = ('email', 'full_name', 'phone')
    ordering = ('-date_joined',)

    fieldsets = (
        ('Authentication', {'fields': ('email', 'password')}),
        ('Personal Information', {'fields': ('full_name', 'phone', 'avatar')}),
        ('Role & Permissions', {
            'fields': (
                'role',
                'is_active',
                'is_staff',
                'is_superuser',
                'groups',
                'user_permissions',
            )
        }),
        ('Important Dates', {'fields': ('last_login', 'date_joined', 'created_at', 'updated_at')}),
    )

    readonly_fields = ('date_joined', 'created_at', 'updated_at', 'last_login')

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'phone', 'role', 'password', 'is_staff', 'is_active'),
        }),
    )
