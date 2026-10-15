"""URL configuration for accounts authentication and profile management."""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    ChangePasswordView,
    CustomLoginView,
    LogoutView,
    RegisterView,
    UserProfileView,
)

app_name = 'accounts'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomLoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', UserProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
]
