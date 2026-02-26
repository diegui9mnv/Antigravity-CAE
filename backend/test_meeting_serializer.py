import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.serializers import MeetingSerializer

data = {
    'projectId': 1,
    'startDate': '2026-02-26',
    'endDate': '2026-02-26',
    'time': '10:00',
    'reason': 'Test Reason',
    'location': 'Test Location',
    'type': 'PRESENCIAL',
    'status': 'PROGRAMADA',
    'attendees': [],
    'minutes': ''
}

# The camel case parser converts projectId to project_id in validated_data theoretically, 
# but let's just pass what the serializer expects normally (already parsed to snake_case equivalent or what camel case parser yields).
# In DRF, camelcase parser converts all keys to snake_case before passing to serializer.
parsed_data = {
    'project_id': 1,
    'start_date': '2026-02-26',
    'end_date': '2026-02-26',
    'time': '10:00',
    'reason': 'Test Reason',
    'location': 'Test Location',
    'type': 'PRESENCIAL',
    'status': 'PROGRAMADA',
    'attendees': [],
    'minutes': ''
}

serializer = MeetingSerializer(data=parsed_data)
if not serializer.is_valid():
    print("ERRORS:", serializer.errors)
else:
    print("SUCCESS")
