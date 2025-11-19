from pathlib import Path
import os
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-key")
DEBUG = os.getenv("DEBUG", "1") == "1"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1,0.0.0.0,frontend,backend,reverse-proxy").split(",")

AUTH_USER_MODEL = "accounts.User"

INSTALLED_APPS = [
    "django.contrib.admin","django.contrib.auth","django.contrib.contenttypes",
    "django.contrib.sessions","django.contrib.messages","django.contrib.staticfiles",
    "rest_framework","corsheaders","api","accounts","mozilla_django_oidc",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

ROOT_URLCONF = "stitchtracker_backend.urls"
WSGI_APPLICATION = "stitchtracker_backend.wsgi.application"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticatedOrReadOnly",),
}

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_ROOT = BASE_DIR / "projects"
MEDIA_URL  = "/projects/"

SQLITE_PATH = os.getenv("SQLITE_PATH", str(BASE_DIR / "db.sqlite3"))

ENABLE_OIDC = os.getenv("ENABLE_OIDC", "true").lower() in {"1", "true", "yes", "on"}

if ENABLE_OIDC:
    if "mozilla_django_oidc" not in INSTALLED_APPS:
        INSTALLED_APPS.append("mozilla_django_oidc")

    AUTHENTICATION_BACKENDS = [
        "mozilla_django_oidc.auth.OIDCAuthenticationBackend",
        "django.contrib.auth.backends.ModelBackend",
    ]

    OIDC_RP_CLIENT_ID = os.environ.get("OIDC_RP_CLIENT_ID")
    OIDC_RP_CLIENT_SECRET = os.environ.get("OIDC_RP_CLIENT_SECRET", "")

    OIDC_OP_AUTHORIZATION_ENDPOINT = os.environ.get("OIDC_OP_AUTHORIZATION_ENDPOINT")
    OIDC_OP_TOKEN_ENDPOINT = os.environ.get("OIDC_OP_TOKEN_ENDPOINT")
    OIDC_OP_USER_ENDPOINT = os.environ.get("OIDC_OP_USER_ENDPOINT")
    OIDC_OP_JWKS_ENDPOINT = os.environ.get("OIDC_OP_JWKS_ENDPOINT")

    OIDC_RP_SCOPES = os.environ.get("OIDC_RP_SCOPES", "openid email profile")
    OIDC_RP_SIGN_ALGO = os.environ.get("OIDC_RP_SIGN_ALGO", "RS256")
    OIDC_CREATE_USER = os.getenv("OIDC_CREATE_USER", "false").lower() in {"1", "true", "yes", "on"}

    OIDC_CALLBACK_CLASS = "accounts.oidc.StitchTrackerOIDCCallbackView"

    FRONTEND_OIDC_REDIRECT_URL = os.environ.get(
        "FRONTEND_OIDC_REDIRECT_URL",
        "http://localhost:5173/oidc-callback",
    )
else:
    AUTHENTICATION_BACKENDS = [
        "django.contrib.auth.backends.ModelBackend",
    ]

SITE_URL = os.environ.get("SITE_URL", "http://localhost:8082/")
