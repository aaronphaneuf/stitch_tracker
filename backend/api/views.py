from django.db import transaction
from django.db.models import Count, Q
from rest_framework import viewsets, permissions, parsers, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Project, Tag, ProjectProgress, Yarn, ProgressImage, ProjectYarn
from .serializers import (
    ProjectSerializer, TagSerializer, ProjectProgressSerializer, YarnSerializer,
    ProgressImageSerializer, ProjectYarnLinkSerializer, ChangePasswordSerializer,
    RegisterSerializer, AdminUserSerializer
)

User = get_user_model()

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    return Response({
        "id": user.id,
        "username": user.get_username(),
        "email": getattr(user, "email", ""),
        "is_staff": bool(getattr(user, "is_staff", False)),
        "is_superuser": bool(getattr(user, "is_superuser", False)),
        "is_active": bool(getattr(user, "is_active", True)),
    })

class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Admin-only user management:
      - list/search users
      - update flags (is_staff/is_superuser/is_active)
      - delete users
      - custom action to set password
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = User.objects.all().order_by("id")
    serializer_class = AdminUserSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["username", "email"]

    def _guard_self_deactivation(self, request, instance, data):
        """
        Prevent an admin from deactivating their own account.
        """
        if not data:
            return
        if "is_active" in data:
            new_val = data.get("is_active")
            if instance.id == request.user.id and new_val in (False, 0, "false", "False", "0"):
                raise ValidationError({"is_active": "You cannot deactivate your own account."})

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        self._guard_self_deactivation(request, instance, request.data)
        return super().partial_update(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        self._guard_self_deactivation(request, instance, request.data)
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="set-password")
    def set_password(self, request, pk=None):
        user = self.get_object()
        new_password = request.data.get("new_password")
        if not new_password:
            raise ValidationError({"new_password": "This field is required."})
        validate_password(new_password, user)
        user.set_password(new_password)
        user.save()
        return Response({"detail": "Password updated."}, status=200)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        make_staff = not User.objects.exists()
        user = serializer.save()
        if make_staff:
            user.is_staff = True
            user.save(update_fields=["is_staff"])

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "is_staff": user.is_staff,
                    "is_superuser": user.is_superuser,
                },
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = ChangePasswordSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        user = request.user
        user.set_password(ser.validated_data["new_password"])
        user.save()
        return Response({"detail": "Password changed"}, status=status.HTTP_200_OK)


class OwnedQuerysetMixin:
    def get_queryset(self):
        base = super().get_queryset()
        u = getattr(self.request, "user", None)
        if not u or not u.is_authenticated:
            return base.none()
        return base.filter(user=u)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ProjectViewSet(OwnedQuerysetMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Project.objects.all().order_by("-id")
    serializer_class = ProjectSerializer
    parser_classes = [parsers.FormParser, parsers.MultiPartParser, parsers.JSONParser]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "notes"]


class YarnViewSet(OwnedQuerysetMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Yarn.objects.all().order_by("brand", "colour")
    serializer_class = YarnSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["brand", "weight", "material", "colour_name"]


class TagViewSet(OwnedQuerysetMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Tag.objects.all().order_by("name")
    serializer_class = TagSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]

    def get_queryset(self):
        qs = super().get_queryset()
        u = self.request.user
        return qs.annotate(project_count=Count("project", filter=Q(project__user=u), distinct=True))


class ProjectYarnViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ProjectYarnLinkSerializer
    queryset = ProjectYarn.objects.select_related("project", "yarn").order_by("-id")

    def get_queryset(self):
        u = self.request.user
        qs = super().get_queryset().filter(project__user=u, yarn__user=u)
        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs

    def perform_create(self, serializer):
        u = self.request.user
        project = serializer.validated_data.get("project")
        yarn = serializer.validated_data.get("yarn")
        if project.user_id != u.id or yarn.user_id != u.id:
            raise ValidationError("Project and yarn must belong to you.")
        serializer.save()


class ProjectProgressViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ProjectProgressSerializer
    queryset = ProjectProgress.objects.select_related("project").order_by("-date")
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "notes"]

    def get_queryset(self):
        u = self.request.user
        qs = super().get_queryset().filter(project__user=u)
        pid = self.request.query_params.get("project")
        return qs.filter(project_id=pid) if pid else qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    @transaction.atomic
    def perform_create(self, serializer):
        pid = self.request.data.get("project") or self.request.query_params.get("project")
        if not pid:
            raise ValidationError({"project": "This field is required."})

        try:
            project = Project.objects.get(pk=pid, user=self.request.user)
        except Project.DoesNotExist:
            raise ValidationError({"project": "Not your project."})

        progress = serializer.save(project=project)

        files = self.request.FILES.getlist("images")
        for f in files:
            ProgressImage.objects.create(progress=progress, image=f)

    @transaction.atomic
    def perform_update(self, serializer):
        progress = self.get_object()
        if progress.project.user_id != self.request.user.id:
            raise ValidationError("Not your project.")
        progress = serializer.save()

        files = self.request.FILES.getlist("images")
        for f in files:
            ProgressImage.objects.create(progress=progress, image=f)

def _guard_self_deactivation(self, request, instance, data):
    if not data:
        return

    def to_bool(v):
        if isinstance(v, bool):
            return v
        if isinstance(v, (int,)):
            return bool(v)
        if isinstance(v, str):
            return v.strip().lower() in ("true", "1", "yes", "on")
        return None

    if instance.id == request.user.id:
        if "is_active" in data:
            new_active = to_bool(data.get("is_active"))
            if new_active is False:
                raise ValidationError({"is_active": "You cannot deactivate your own account."})

        if "is_staff" in data:
            new_staff = to_bool(data.get("is_staff"))
            if new_staff is False:
                raise ValidationError({"is_staff": "You cannot remove your own staff status."})
