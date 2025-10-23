#!/usr/bin/env bash
set -e

# Make sure volumes are writable (no-op if already correct)
mkdir -p /app/media /app/staticfiles
chown -R appuser:appuser /app/media /app/staticfiles || true

python manage.py migrate --noinput

# In dev, keep collectstatic here; for prod, set COLLECTSTATIC=1 at build and skip here if you prefer
python manage.py collectstatic --noinput

exec gunicorn stitchtracker_backend.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 3 \
  --log-file -

