import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import User
from django.core.management.color import no_style
from django.db import connection

username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin123')

if not User.objects.filter(email=email).exists():
    print(f'Creating superuser: {email}')
    User.objects.create_superuser(email=email, name=username, password=password, role='MANAGER')
    print('Superuser created successfully.')
else:
    print(f'Superuser {email} already exists.')
