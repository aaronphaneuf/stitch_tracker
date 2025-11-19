from urllib.parse import urlencode
from django.conf import settings
from django.shortcuts import redirect
from mozilla_django_oidc.views import OIDCAuthenticationCallbackView
from rest_framework_simplejwt.tokens import RefreshToken

class StitchTrackerOIDCCallbackView(OIDCAuthenticationCallbackView):
    """
    After OIDC login succeeds, turn the django user into
    a SimpleJWT token pair and bounce the user to the frontend.
    """

    def login_success(self):
        user = getattr(self, "user", None) or getattr(self.request, "user", None)

        if not user or not getattr(user, "is_authenticated", False):
            redirect_url = getattr(settings, "FRONTEND_OIDC_REDIRECT_URL", "/")
            return redirect(f"{redirect_url.rstrip('/')}/login")

        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        params = {
            "access": str(access),
            "refresh": str(refresh),
        }

        frontend_url = settings.FRONTEND_OIDC_REDIRECT_URL.rstrip("/")
        return redirect(f"{frontend_url}?{urlencode(params)}")

