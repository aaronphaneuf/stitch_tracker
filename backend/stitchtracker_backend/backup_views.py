from datetime import datetime
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from api.models import (
    Tag, Yarn, Project, ProjectYarn, ProjectProgress, ProgressImage
)

import json

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def backup_all(request):
    data = {
        "meta": {
            "exported_at": datetime.utcnow().isoformat() + "Z",
            "version": 1,
        },
        "tags": list(Tag.objects.all().values()),
        "yarn": list(Yarn.objects.all().values()),
        "projects": list(Project.objects.all().values()),
        "project_yarns": list(ProjectYarn.objects.all().values()),
        "progress": list(ProjectProgress.objects.all().values()),
        "progress_images": list(ProgressImage.objects.all().values()),
    }
    return Response(data, status=status.HTTP_200_OK)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@csrf_exempt  
def restore_local_state(request):
    """
    This endpoint is only for restoring local-only things (e.g., shelf layout, theme).
    If you later want to support DB import, do it carefully & authenticated.
    """
    try:
        payload = request.data if isinstance(request.data, dict) else json.loads(request.body.decode("utf-8"))
    except Exception:
        return Response({"detail": "Invalid JSON"}, status=400)

    return Response({"ok": True, "received_keys": list(payload.keys())}, status=200)

