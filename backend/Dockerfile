# backend/Dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# system deps (psycopg)
RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# project
COPY backend /app

# collect static at build-time only if using whitenoise; otherwise do it in entrypoint
# RUN python manage.py collectstatic --noinput

# Run as non-root
RUN useradd -m appuser
USER appuser

CMD ["gunicorn", "stitchtracker_backend.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]

