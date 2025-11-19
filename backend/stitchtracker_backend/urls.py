from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api.views import me  
from django.conf import settings
from django.conf.urls.static import static
from . import backup_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('oidc/', include('mozilla_django_oidc.urls')),
    path('api/auth/me/', me, name='auth_me'),
    path("api-auth/", include("rest_framework.urls")),
    path('api/', include('api.urls')),
    path("api/backup/", backup_views.backup_all, name="backup-all"),
    path("api/restore-local/", backup_views.restore_local_state, name="restore-local"),]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
