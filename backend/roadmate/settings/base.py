"""Base settings for RoadMate project.

Shared configuration across development and production environments.
Configured with GeoDjango (PostGIS), Django Channels, SimpleJWT, and python-json-logger.
"""
from datetime import timedelta
from pathlib import Path
import environ

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Initialize django-environ
env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ['localhost', '127.0.0.1']),
    CORS_ALLOWED_ORIGINS=(list, []),
    DISPATCH_RADIUS_STEPS=(list, [3, 5, 8, 10]),
    DISPATCH_OFFER_EXPIRY_MINUTES=(int, 10),
)

# Read .env file from root or backend directory if present
env_file_backend = BASE_DIR / '.env'
env_file_root = BASE_DIR.parent / '.env'
if env_file_backend.is_file():
    environ.Env.read_env(str(env_file_backend))
elif env_file_root.is_file():
    environ.Env.read_env(str(env_file_root))

SECRET_KEY = env('SECRET_KEY', default='django-insecure-roadmate-super-secret-key-1234567890')

DEBUG = env('DEBUG')

ALLOWED_HOSTS = env('ALLOWED_HOSTS')

# Application definition
INSTALLED_APPS = [
    # Daphne must be listed before django.contrib.staticfiles for ASGI support
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # GeoDjango
    'django.contrib.gis',
    # Third-party packages
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'channels',
    # RoadMate Local Apps
    'core.apps.CoreConfig',
    'accounts.apps.AccountsConfig',
    'services.apps.ServicesConfig',
    'vehicles.apps.VehiclesConfig',
    'providers.apps.ProvidersConfig',
    'assistance.apps.AssistanceConfig',
    'payments.apps.PaymentsConfig',
    'reviews.apps.ReviewsConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'roadmate.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'roadmate.wsgi.application'
ASGI_APPLICATION = 'roadmate.asgi.application'

# PostGIS Database Configuration
# Default uses postgis engine
DATABASES = {
    'default': env.db_url(
        'DATABASE_URL',
        default='postgis://roadmate_user:roadmate_secure_pass@localhost:5432/roadmate_db',
        engine='django.contrib.gis.db.backends.postgis',
    )
}

# Ensure the engine is explicitly postgis even if parsed as postgres
if 'postgis' not in DATABASES['default']['ENGINE']:
    DATABASES['default']['ENGINE'] = 'django.contrib.gis.db.backends.postgis'

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static & Media files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'core.pagination.StandardResultsSetPagination',
    'PAGE_SIZE': 20,
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DATETIME_FORMAT': '%Y-%m-%dT%H:%M:%SZ',
}

# SimpleJWT Authentication Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

# Channel Layers (Django Channels / WebSockets)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [env('REDIS_URL', default='redis://localhost:6379/1')],
        },
    },
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = env('CORS_ALLOWED_ORIGINS')
CORS_ALLOW_CREDENTIALS = True

# Razorpay Configuration
RAZORPAY_KEY_ID = env('RAZORPAY_KEY_ID', default='rzp_test_roadmate_key_123456789')
RAZORPAY_KEY_SECRET = env('RAZORPAY_KEY_SECRET', default='roadmate_razorpay_secret_987654321')
RAZORPAY_WEBHOOK_SECRET = env('RAZORPAY_WEBHOOK_SECRET', default='roadmate_whsec_secret_key_112233')

# Dispatch Engine Parameters
DISPATCH_RADIUS_STEPS = [int(r) for r in env.list('DISPATCH_RADIUS_STEPS', default=[3, 5, 8, 10])]
DISPATCH_OFFER_EXPIRY_MINUTES = env.int('DISPATCH_OFFER_EXPIRY_MINUTES', default=10)

# Structured JSON Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(levelname)s %(name)s %(module)s %(message)s',
        },
        'standard': {
            'format': '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json' if not DEBUG else 'standard',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'roadmate': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
