# 🚗 RoadMate — On-Demand Roadside Assistance & Dispatch Platform

[![Django](https://img.shields.io/badge/Django-4.2.16-092E20?logo=django)](https://www.djangoproject.com/)
[![Django REST Framework](https://img.shields.io/badge/DRF-3.15.2-red?logo=django)](https://www.django-rest-framework.org/)
[![PostGIS](https://img.shields.io/badge/PostGIS-PostgreSQL%2015-336791?logo=postgresql)](https://postgis.net/)
[![Django Channels](https://img.shields.io/badge/Channels-4.1.0-blue?logo=fastapi)](https://channels.readthedocs.io/)
[![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?logo=redis)](https://redis.io/)
[![Razorpay](https://img.shields.io/badge/Razorpay-HMAC--SHA256-0C2340?logo=razorpay)](https://razorpay.com/)

**RoadMate** is a production-grade, enterprise-ready backend platform for on-demand roadside assistance (breakdowns, towing, flat tires, battery jumpstart, fuel delivery, and lockout services). Built with **Django 4.2+**, **GeoDjango (PostGIS)**, **Django Channels**, and **Django REST Framework**, RoadMate matches stranded motorists with nearby qualified mechanics and tow-truck providers in real time using an automated **expanding radius dispatch algorithm**.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Clients["Clients"]
        Customer["Customer Mobile / Web App"]
        Provider["Provider / Mechanic App"]
        Admin["Admin Portal"]
    end

    subgraph Gateway["Edge & ASGI Server"]
        Daphne["Daphne ASGI Server (:8000)"]
    end

    subgraph Application["Django Application Core"]
        Auth["SimpleJWT Auth & Permissions"]
        FSM["Assistance FSM & Concurrency Lock"]
        Dispatch["Expanding Radius Dispatch Engine"]
        PaymentEngine["Razorpay Gateway + HMAC-SHA256"]
        WS["Django Channels WebSockets"]
    end

    subgraph Data["Persistence & Event Layers"]
        PostGIS[("PostgreSQL 15 + PostGIS<br/>Spatial Indexing (SRID 4326)")]
        Redis[("Redis 7<br/>Channel Layers & Caching")]
    end

    Customer -->|HTTP REST / JWT| Daphne
    Provider -->|HTTP REST / JWT| Daphne
    Admin -->|HTTP REST / JWT| Daphne
    Customer <-->|WebSocket: GPS Tracking| Daphne
    Provider <-->|WebSocket: Job Dispatch Alerts| Daphne

    Daphne --> Auth
    Daphne --> WS
    Auth --> Dispatch
    Auth --> FSM
    Auth --> PaymentEngine

    Dispatch -->|Spatial Radius Query D(km=r)| PostGIS
    FSM -->|Atomic select_for_update| PostGIS
    WS <-->|Pub/Sub Groups| Redis
    Dispatch -->|Async Event Alert| Redis
```

---

## ✨ Key Architectural Highlights

1. **GeoDjango & PostGIS Spatial Engine**:
   - Stores real-time provider coordinates and customer breakdown locations using `PointField(srid=4326, geography=True)`.
   - Utilizes spatial indexing and spherical distance queries (`Distance('location', point)`) with zero manual distance math overhead.

2. **Expanding Radius Dispatch Engine (`assistance/dispatch.py`)**:
   - Dispatches emergency requests using a stepped radial search: **3 km &rarr; 5 km &rarr; 8 km &rarr; 10 km**.
   - Identifies active, online, approved providers who service the required category.
   - Dispatches time-limited offers (10-minute expiry) and notifies technicians in real time via WebSockets.

3. **Concurrency-Safe Atomic Offer Acceptance (`assistance/views.py`)**:
   - Uses `select_for_update()` inside `@transaction.atomic` blocks to eliminate race conditions.
   - When a customer accepts an offer, all competing sibling offers are atomically expired, the provider is assigned, marked busy, and an immutable audit event (`BookingEvent`) is recorded.

4. **Finite State Machine Lifecycle (`assistance/fsm.py`)**:
   - Strict transition graph preventing illegal state jumps:
     $$\text{DRAFT} \to \text{REQUESTED} \to \text{OFFERED} \to \text{ACCEPTED} \to \text{EN\_ROUTE} \to \text{ARRIVED} \to \text{IN\_PROGRESS} \to \text{COMPLETED}$$
   - State conflicts trigger standard HTTP 409 Conflict responses.

5. **Cryptographic Payment Gateway (`payments/razorpay_client.py`)**:
   - Real **HMAC-SHA256** signature verification for checkout payments (`order_id|payment_id`).
   - Secure asynchronous webhook verification (`X-Razorpay-Signature`).
   - Strict `Decimal` handling across all currency fields (never float).

6. **Real-Time WebSockets with Django Channels (`assistance/consumers.py`)**:
   - **`AssistanceTrackingConsumer`**: Bidirectional live GPS location streaming between provider and customer on active jobs.
   - **`ProviderNotificationConsumer`**: Immediate push notifications when new jobs are dispatched nearby.
   - Authenticated via JWT query parameter or Authorization headers (`core/channels_middleware.py`).

7. **Standardized Error Envelope (`core/exceptions.py`)**:
   Every API error strictly adheres to:
   ```json
   {
     "detail": "Error message summary",
     "code": "error_code",
     "field_errors": {
       "field_name": ["Specific validation error"]
     }
   }
   ```

---

## 📂 Project Directory Structure

```
c:\charan\RM\
├── docker-compose.yml              # PostGIS 15, Redis 7, and Daphne services
├── .env.example                    # Template environment variables
├── README.md                       # Architecture & API documentation
└── backend/
    ├── manage.py
    ├── requirements.txt
    ├── Dockerfile                  # GDAL/GEOS GeoDjango Bullseye image
    ├── roadmate/                   # Project package
    │   ├── settings/
    │   │   ├── base.py             # GeoDjango, Channels, JWT, Logging
    │   │   ├── development.py      # CORS allow all, console email
    │   │   └── production.py       # Strict SSL, HSTS, JSON logging
    │   ├── urls.py                 # Versioned API routes
    │   ├── wsgi.py
    │   └── asgi.py                 # ProtocolTypeRouter (HTTP + WebSockets)
    ├── core/                       # Shared platform utilities
    │   ├── exceptions.py           # Canonical error handler (409, 400, etc.)
    │   ├── pagination.py           # Standard page number pagination
    │   ├── utils.py                # PostGIS Point helpers & TimeStampedModel
    │   └── channels_middleware.py  # WebSocket JWT authentication
    ├── accounts/                   # Custom User & Auth
    │   ├── models.py               # AbstractBaseUser with role discriminator
    │   ├── serializers.py          # Registration, Login, Profile
    │   ├── permissions.py          # IsCustomer, IsProvider, IsAdmin
    │   ├── views.py                # JWT endpoints & Token blacklist
    │   └── admin.py
    ├── services/                   # Assistance Service Catalog
    │   ├── models.py               # Service catalog (Towing, Battery, Tire)
    │   ├── serializers.py
    │   └── views.py
    ├── vehicles/                   # Customer Automobile Garage
    │   ├── models.py               # Vehicle specs & primary car flag
    │   ├── serializers.py
    │   └── views.py
    ├── providers/                  # Technicians & Spatial Discovery
    │   ├── models.py               # ProviderProfile with PostGIS PointField
    │   ├── serializers.py
    │   ├── views.py                # PostGIS nearby search & location update
    │   └── admin.py                # GISModelAdmin with map widget
    ├── assistance/                 # Core Dispatch & Lifecycle
    │   ├── models.py               # AssistanceRequest, Offer, BookingEvent
    │   ├── fsm.py                  # Lifecycle state transitions
    │   ├── dispatch.py             # Stepped radial search engine (3-10km)
    │   ├── consumers.py            # Real-time GPS & alert WebSockets
    │   ├── routing.py              # WebSocket routes
    │   └── views.py                # Atomic offer acceptance & state changes
    ├── payments/                   # Financial Transactions
    │   ├── models.py               # Payment & Refund with Decimal amounts
    │   ├── razorpay_client.py      # HMAC-SHA256 verification + order mock
    │   ├── serializers.py
    │   └── views.py                # Order creation, verification, webhooks
    └── reviews/                    # Reputation & Quality Control
        ├── models.py               # 1-5 Star Reviews with cached avg rating
        ├── serializers.py
        └── views.py
```

---

## 🚀 Quickstart with Docker Compose

The fastest way to run RoadMate with PostGIS and Redis is Docker Compose:

### 1. Clone & Setup Environment
```bash
cp .env.example .env
```

### 2. Launch Containers
```bash
docker-compose up --build
```
This spins up:
- **PostGIS 15**: Spatial database on `localhost:5432`
- **Redis 7**: Pub/Sub channel layer on `localhost:6379`
- **Backend (Daphne)**: ASGI application server on `http://localhost:8000`

### 3. Apply Migrations & Create Superuser
In another terminal:
```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

---

## 🛠️ Manual Local Setup (Virtual Environment)

### Prerequisites
- Python 3.11+
- PostgreSQL 15 with **PostGIS** extension enabled
- Redis 7 server running
- GDAL, GEOS, and PROJ libraries installed for GeoDjango

### Setup Steps
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
cp ../.env.example .env

# Run migrations
python manage.py migrate

# Seed or create admin
python manage.py createsuperuser

# Launch ASGI Daphne server
daphne -b 127.0.0.1 -p 8000 roadmate.asgi:application
```

---

## 📡 Complete REST API Documentation

Base URL: `/api/v1/`

### 1. Authentication & Accounts (`/accounts/`)
| Method | Endpoint | Auth / Permission | Description |
|---|---|---|---|
| `POST` | `/api/v1/accounts/register/` | Public | Register new Customer or Service Provider account |
| `POST` | `/api/v1/accounts/login/` | Public | Authenticate with email/password; returns JWT access & refresh tokens |
| `POST` | `/api/v1/accounts/token/refresh/` | Public | Obtain fresh access token using refresh token |
| `POST` | `/api/v1/accounts/logout/` | Authenticated | Blacklist refresh token and invalidate session |
| `GET` | `/api/v1/accounts/me/` | Authenticated | Retrieve profile details of authenticated user |
| `PATCH` | `/api/v1/accounts/me/` | Authenticated | Update user profile (name, phone, avatar) |
| `POST` | `/api/v1/accounts/change-password/` | Authenticated | Change account password |

### 2. Customer Vehicles (`/vehicles/`)
| Method | Endpoint | Auth / Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/vehicles/` | Customer | List all vehicles owned by current user |
| `POST` | `/api/v1/vehicles/` | Customer | Register a new vehicle (make, model, license plate, VIN) |
| `GET` | `/api/v1/vehicles/<id>/` | Owner / Admin | Retrieve vehicle details |
| `PATCH` | `/api/v1/vehicles/<id>/` | Owner | Update vehicle details |
| `DELETE` | `/api/v1/vehicles/<id>/` | Owner | Delete registered vehicle |
| `POST` | `/api/v1/vehicles/<id>/set-primary/` | Owner | Atomically mark as primary vehicle |

### 3. Service Catalog (`/services/`)
| Method | Endpoint | Auth / Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/services/` | Public | List active assistance services (towing, tire, fuel, battery, etc.) |
| `GET` | `/api/v1/services/<id>/` | Public | Retrieve detailed pricing and duration for a specific service |
| `POST` | `/api/v1/services/` | Admin | Create a new catalog service offering |
| `PATCH` | `/api/v1/services/<id>/` | Admin | Update service rates or descriptions |

### 4. Service Providers (`/providers/`)
| Method | Endpoint | Auth / Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/providers/me/` | Provider | Retrieve authenticated provider profile & ratings |
| `PATCH` | `/api/v1/providers/me/` | Provider | Update business information, bio, coverage radius |
| `POST` | `/api/v1/providers/location/` | Provider | Ingest real-time GPS coordinate ping (`latitude`, `longitude`) |
| `POST` | `/api/v1/providers/toggle-online/` | Provider | Toggle availability (`is_online: true/false`) |
| `GET` | `/api/v1/providers/nearby/` | Public / Customer | PostGIS spatial search (`?lat=...&lng=...&radius=10&service_id=...`) |
| `GET` | `/api/v1/providers/my-services/` | Provider | List custom rates and services configured by provider |
| `POST` | `/api/v1/providers/my-services/` | Provider | Add catalog service to provider's supported offerings |
| `POST` | `/api/v1/providers/<id>/verify/` | Admin | Approve, reject, or suspend provider verification status |

### 5. Roadside Assistance & Dispatch (`/assistance/`)
| Method | Endpoint | Auth / Permission | Description |
|---|---|---|---|
| `POST` | `/api/v1/assistance/requests/` | Customer | Request emergency assistance (auto-triggers dispatch engine) |
| `GET` | `/api/v1/assistance/requests/` | Authenticated | List assistance requests (scoped to customer / provider) |
| `GET` | `/api/v1/assistance/requests/<id>/` | Participant / Admin | Detailed request timeline, location, offers, and events |
| `POST` | `/api/v1/assistance/requests/<id>/retry-dispatch/` | Customer | Re-run expanding radial dispatch engine (3km &rarr; 10km) |
| `POST` | `/api/v1/assistance/requests/<id>/transition/` | Participant | Perform state transition (`en_route`, `arrived`, `in_progress`, `completed`, `cancelled`) |
| `GET` | `/api/v1/assistance/offers/` | Authenticated | List offers dispatched for this user / provider |
| `POST` | `/api/v1/assistance/offers/<id>/accept/` | Customer | **Atomic Offer Acceptance** (locks record, assigns provider, expires competitors) |
| `POST` | `/api/v1/assistance/offers/<id>/decline/` | Provider | Decline dispatched offer |

### 6. Payments & Invoicing (`/payments/`)
| Method | Endpoint | Auth / Permission | Description |
|---|---|---|---|
| `POST` | `/api/v1/payments/create-order/` | Customer | Generate Razorpay order for accepted/completed request |
| `POST` | `/api/v1/payments/verify/` | Customer | **HMAC-SHA256 Signature Verification** of client payment |
| `POST` | `/api/v1/payments/webhook/` | Public | Asynchronous Razorpay webhook receiver with HMAC validation |
| `GET` | `/api/v1/payments/<id>/` | Owner / Admin | Retrieve transaction details and receipt |

### 7. Reviews & Ratings (`/reviews/`)
| Method | Endpoint | Auth / Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/reviews/` | Public | Browse public provider reviews (`?provider=...`) |
| `POST` | `/api/v1/reviews/` | Customer | Submit 1–5 star rating & feedback for completed assistance request |
| `GET` | `/api/v1/reviews/<id>/` | Public | Retrieve review details |

### 8. System Health
| Method | Endpoint | Auth / Permission | Description |
|---|---|---|---|
| `GET` | `/api/health/` | Public | Verifies PostgreSQL connection and system availability |

---

## ⚡ WebSocket Endpoints & Schemas

Connect using: `ws://localhost:8000/ws/.../?token=<jwt_access_token>`

### 1. Live Job Tracking (`ws/assistance/<request_id>/tracking/`)
Stream provider GPS location in real time:

#### Incoming Payload (from Provider mobile client):
```json
{
  "type": "location_update",
  "latitude": 28.613939,
  "longitude": 77.209021,
  "heading": 180.5,
  "speed": 35.2
}
```

#### Outgoing Broadcast (received by Customer & Provider):
```json
{
  "type": "location_update",
  "data": {
    "provider_id": 4,
    "latitude": 28.613939,
    "longitude": 77.209021,
    "heading": 180.5,
    "speed": 35.2,
    "timestamp": "2026-10-14T18:40:00Z"
  }
}
```

### 2. Provider Job Alerts (`ws/provider/notifications/`)
When the dispatch engine matches an eligible provider:

#### Broadcast Event:
```json
{
  "type": "new_offer",
  "data": {
    "offer_id": 42,
    "request_id": 105,
    "service_name": "Flatbed Towing",
    "distance_km": 3.8,
    "dispatched_at": "2026-10-14T18:40:00Z"
  }
}
```

---

## 🧪 Testing Razorpay HMAC Verification

RoadMate ships with an internal signature generation utility for end-to-end integration testing:

```python
from payments.razorpay_client import generate_mock_signature, verify_payment_signature

order_id = "order_1234567890abcd"
payment_id = "pay_9876543210zyxw"
secret = "roadmate_razorpay_secret_987654321"

# Generate authentic HMAC-SHA256 signature
signature = generate_mock_signature(order_id, payment_id, secret)

# Cryptographically verify signature
assert verify_payment_signature(order_id, payment_id, signature, secret) is True
```

---

## 🛡️ Security & Production Readiness

- **CORS Configuration**: Restricts access to whitelist origins (`CORS_ALLOWED_ORIGINS`).
- **Secrets Management**: Clean 12-factor configuration via `django-environ`. Zero hardcoded credentials.
- **HSTS & Security Headers**: Strict HTTPS redirection, HSTS preload, clickjacking frame prevention.
- **Structured JSON Logging**: Every error, dispatch, and state transition emits standardized JSON logs via `python-json-logger` for ELK / Datadog / CloudWatch ingestion.
