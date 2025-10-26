#!/usr/bin/env bash
set -e

# Make sure the directories exist
mkdir -p /app/media /app/staticfiles

# Fix permissions so uploads won't 500 on first boot
chown -R 1000:1000 /app/media /app/staticfiles || true
chmod -R u+rwX /app/media /app/staticfiles || true

# Run migrations and collect static
python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Start gunicorn (will run as whatever user is executing this script;
# that's root in your container, which is fine for now)
exec gunicorn stitchtracker_backend.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 3 \
  --log-file -

