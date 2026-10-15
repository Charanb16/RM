FROM python:3.11-slim-bullseye

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies including GDAL, GEOS, and PROJ for GeoDjango
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    binutils \
    gdal-bin \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    curl \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy project code
COPY . /app/

EXPOSE 8000

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "roadmate.asgi:application"]
