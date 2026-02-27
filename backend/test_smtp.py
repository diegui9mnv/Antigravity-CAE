import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

try:
    print(f"Testing SMTP connection with host: {settings.EMAIL_HOST}")
    send_mail(
        'Testing Antigravity SMTP',
        'If you receive this, SMTP is working.',
        settings.DEFAULT_FROM_EMAIL,
        [settings.DEFAULT_FROM_EMAIL],
        fail_silently=False,
    )
    print("Email sent successfully!")
except Exception as e:
    print(f"Failed to send email. Error: {e}")
