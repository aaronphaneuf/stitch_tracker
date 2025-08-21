from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ProjectViewSet, TagViewSet, ProjectProgressViewSet, YarnViewSet, ProjectYarnViewSet,
    ChangePasswordView, RegisterView, AdminUserViewSet, me
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'progress', ProjectProgressViewSet)
router.register(r'yarns', YarnViewSet)
router.register(r'project-yarns', ProjectYarnViewSet, basename='projectyarn')

admin_router = DefaultRouter()
admin_router.register(r'users', AdminUserViewSet, basename='admin-users')

urlpatterns = [
    path('', include(router.urls)),

    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('auth/me/', me, name='me'),  

    path('admin/', include(admin_router.urls)),  ]

