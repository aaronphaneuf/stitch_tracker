# settings/dev.py
from .base import *
import os
from pathlib import Path

DEBUG = True

ALLOWED_HOSTS = ["*", "localhost", "127.0.0.1", "[::1]"]

# --- Database (keep your SQLite default for dev) ---
SQLITE_PATH = BASE_DIR / "db.sqlite3"
DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": SQLITE_PATH}}

# --- Static & Media so uploads work in dev ---
STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR / "static"] if (BASE_DIR / "static").exists() else []
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# --- CSRF: env-driven & exact (mirror prod pattern) ---
# Accept comma-separated full origins: scheme://host[:port]
_dev_origins = os.getenv("CSRF_TRUSTED_ORIGINS", "")
CSRF_TRUSTED_ORIGINS = [o.strip() for o in _dev_origins.split(",") if o.strip()]

# Reasonable fallbacks for common local setups
if not CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS = [
        "http://localhost:8082",
        "http://127.0.0.1:8082",
    ]

# In dev you’re on http, so keep these False
CSRF_COOKIE_SECURE = False
SESSION_COOKIE_SECURE = False

# If you use SessionAuthentication from the browser:
CSRF_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SAMESITE = "Lax"

# --- CORS (optional; harmless for same-origin dev) ---
if "corsheaders" not in INSTALLED_APPS:
    INSTALLED_APPS += ["corsheaders"]
if "corsheaders.middleware.CorsMiddleware" not in MIDDLEWARE:
    MIDDLEWARE = ["corsheaders.middleware.CorsMiddleware"] + MIDDLEWARE
CORS_ALLOW_ALL_ORIGINS = True

# --- Dev logging (optional) ---
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
}
