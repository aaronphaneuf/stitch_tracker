# backend/Dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps (psycopg if/when you move to Postgres)
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Project source
COPY backend/ /app/

# Create non-root user and writable dirs for DB and static
RUN useradd -m appuser \
 && mkdir -p /app/data /app/staticfiles \
 && chown -R appuser:appuser /app

USER appuser

# Collect static at build time (WhiteNoise serves from STATIC_ROOT)
RUN python manage.py collectstatic --noinput

# Entrypoint: migrate then start gunicorn
COPY backend/entrypoint.sh /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]

