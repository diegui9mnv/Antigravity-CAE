import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Project, CompanyContact, Company
from api.serializers import MeetingSerializer

project = Project.objects.first()
contact = CompanyContact.objects.first()

if not project or not contact:
    print("Project or Contact not found for test.")
    exit()

parsed_data = {
    'project_id': project.id,
    'start_date': '2026-02-27',
    'end_date': '2026-02-27',
    'time': '12:00',
    'reason': 'Test Reason 2',
    'location': 'Test Location',
    'type': 'PRESENCIAL',
    'status': 'PROGRAMADA',
    'attendees': [],
    'notification_contacts': [contact.id],
    'minutes': ''
}

serializer = MeetingSerializer(data=parsed_data)
if not serializer.is_valid():
    print("ERRORS:", serializer.errors)
else:
    print("VALID:", serializer.validated_data)
    instance = serializer.save()
    print("SAVED M2M:", instance.notification_contacts.all())
