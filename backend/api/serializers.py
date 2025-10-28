from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
import bleach
from bs4 import BeautifulSoup

from .models import (
    Project, Tag, Yarn, ProjectYarn, ProjectProgress, ProgressImage
)

User = get_user_model()

def _abs_url(request, path_or_url: str) -> str:
    if path_or_url.startswith("http://") or path_or_url.startswith("https://"):
        return path_or_url
    scheme = "https" if request.is_secure() else "http"
    host = request.get_host()
    return f"{scheme}://{host}{path_or_url}"

class AdminUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        min_length=8,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "is_staff",
            "is_superuser",
            "is_active",
            "date_joined",
            "last_login",
            "password",
        ]
        read_only_fields = ["date_joined", "last_login"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)

        user = User.objects.create_user(**validated_data, password=password)

        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)
    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["old_password"]):
            raise ValidationError({"old_password": "Incorrect password"})
        validate_password(attrs["new_password"], user)
        return attrs


BASE_TAGS = set(bleach.sanitizer.ALLOWED_TAGS)
ALLOWED_TAGS = BASE_TAGS.union({
    "p", "span", "pre", "code", "blockquote", "h2", "h3", "ul", "ol", "li", "strong", "em", "a"
})
BASE_ATTRS = dict(bleach.sanitizer.ALLOWED_ATTRIBUTES)
ALLOWED_ATTRS = {
    **BASE_ATTRS,
    "a": ["href", "title", "target", "rel"],
    "code": ["class"],
}
ALLOWED_PROTOCOLS = bleach.sanitizer.ALLOWED_PROTOCOLS.union({"http", "https", "mailto"})

def _enforce_link_attrs(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for a in soup.find_all("a", href=True):
        a["target"] = "_blank"
        rel_parts = set(a.get("rel", []))
        rel_parts.update(["noopener", "nofollow"])
        a["rel"] = list(rel_parts)
    return str(soup)

cleaner = bleach.Cleaner(
    tags=ALLOWED_TAGS,
    attributes=ALLOWED_ATTRS,
    protocols=ALLOWED_PROTOCOLS,
    strip=True,
)


class TagSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    project_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tag
        fields = ["id", "user", "name", "project_count"]


class YarnSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Yarn
        fields = [
            "id",
            "user",
            "weight",
            "brand",
            "colour_name",
            "colour",
            "material",
            "amount_per_skein",
            "product_link",
            "quantity_owned_skeins",
        ]


class ProjectYarnSerializer(serializers.ModelSerializer):
    yarn = YarnSerializer()

    class Meta:
        model = ProjectYarn
        fields = ["id", "yarn", "quantity_used_skeins"]


class ProjectYarnLinkSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())
    yarn = serializers.PrimaryKeyRelatedField(queryset=Yarn.objects.all())

    class Meta:
        model = ProjectYarn
        fields = ["id", "project", "yarn", "quantity_used_skeins"]

    def validate(self, attrs):
        u = self.context["request"].user
        project = attrs.get("project") or getattr(self.instance, "project", None)
        yarn = attrs.get("yarn") or getattr(self.instance, "yarn", None)
        if not project or not yarn:
            return attrs
        if project.user_id != u.id or yarn.user_id != u.id:
            raise ValidationError("Project and yarn must belong to you.")
        return attrs


class ProgressImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True) 

    class Meta:
        model = ProgressImage
        fields = ["id", "image", "caption", "created"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if request and instance.image:
            data["image"] = request.build_absolute_uri(instance.image.url)
        return data

class ProjectProgressSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all(), required=True)
    images = ProgressImageSerializer(many=True, read_only=True)

    class Meta:
        model = ProjectProgress
        fields = ["id", "project", "date", "rows_completed", "stitches_completed", "notes", "images"]


class ProjectSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    main_image = serializers.ImageField(required=False, allow_null=True)
    tags = TagSerializer(many=True, read_only=True)

    tag_names = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True,
        required=False
    )

    yarns = ProjectYarnSerializer(many=True, read_only=True)
    progress_updates = ProjectProgressSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            "id", "user", "name", "type", "tags", "tag_names",
            "start_date", "expected_end_date",
            "needle_or_hook_size",
            "yarns",
            "pattern_link", "pattern_text", "notes",
            "main_image",
            "progress_updates",
        ]

    def validate(self, attrs):
        html = attrs.get("pattern_text")
        if html is not None:
            cleaned = cleaner.clean(html)
            cleaned = _enforce_link_attrs(cleaned)
            attrs["pattern_text"] = cleaned
        return super().validate(attrs)

    def validate_tag_names(self, names):
        if names is None:
            return names
        cleaned = []
        seen = set()
        for n in names:
            s = (n or "").strip()
            if not s:
                continue
            low = s.lower()
            if low in seen:
                continue
            seen.add(low)
            cleaned.append(s)
        return cleaned

    def _apply_tag_names(self, project: Project, names):
        if not names:
            return
        user = self.context["request"].user
        for n in names:
            tag, _ = Tag.objects.get_or_create(user=user, name=n)
            project.tags.add(tag)

    def create(self, validated_data):
        tag_names = validated_data.pop("tag_names", [])
        project = super().create(validated_data) 
        self._apply_tag_names(project, tag_names)
        return project

    def update(self, instance, validated_data):
        tag_names = validated_data.pop("tag_names", None)
        project = super().update(instance, validated_data)
        if tag_names is not None:
            project.tags.clear()
            self._apply_tag_names(project, tag_names)
        return project

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        img = data.get("main_image")
        if request and img:
            data["main_image"] = request.build_absolute_uri(img)
        return data
