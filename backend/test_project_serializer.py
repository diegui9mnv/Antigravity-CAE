import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Project
from api.serializers import ProjectSerializer
from djangorestframework_camel_case.render import CamelCaseJSONRenderer

project = Project.objects.first()
if project:
    serializer = ProjectSerializer(project)
    # Render with CamelCase to see exactly what React gets
    rendered = CamelCaseJSONRenderer().render(serializer.data)
    print(rendered.decode('utf-8'))
else:
    print("No project")
