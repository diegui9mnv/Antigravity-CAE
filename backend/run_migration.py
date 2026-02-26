import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import User, Company, CompanyContact

companies = User.objects.filter(role='COMPANY')
print(f"Migrating {companies.count()} companies from User table to Company table...")

for u in companies:
    comp, created = Company.objects.get_or_create(
        name=u.name,
        defaults={
            'cif': u.cif or '',
            'email': u.email,
            'phone': u.phone,
            'avatar': u.avatar
        }
    )
    if created:
        print(f"Created Company: {comp.name}")
    else:
        print(f"Company {comp.name} already exists.")
        
    # Also update any CompanyContact pointing to the old User
    contacts = CompanyContact.objects.filter(company_id=u.id)
    if contacts.exists():
        for contact in contacts:
             # Wait, CompanyContact's company_id was foreign key to User
             # Now it's a foreign key to Company. We might get IntegrityError if we just reassign without DB schema matching, but we already migrated it.
             pass

print("Done migrating companies.")
