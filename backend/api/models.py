from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        
        if 'username' not in extra_fields:
            extra_fields['username'] = email
        if 'name' not in extra_fields:
            extra_fields['name'] = email

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    ROLE_CHOICES = [
        ('MANAGER', 'MANAGER'),
        ('COORDINATOR', 'COORDINATOR'),
    ]

    name = models.CharField("Nombre / Razón Social", max_length=255)
    role = models.CharField("Rol", max_length=20, choices=ROLE_CHOICES, default='COORDINATOR')
    avatar = models.ImageField("Avatar", upload_to='avatars/', null=True, blank=True)
    phone = models.CharField("Teléfono", max_length=20, null=True, blank=True)
    cif = models.CharField("CIF", max_length=20, null=True, blank=True)
    email = models.EmailField("Correo electrónico", unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"{self.name} ({self.get_role_display()})"


class Company(models.Model):
    name = models.CharField("Razón Social", max_length=255)
    cif = models.CharField("CIF", max_length=20, null=True, blank=True)
    email = models.EmailField("Correo electrónico", null=True, blank=True)
    phone = models.CharField("Teléfono", max_length=20, null=True, blank=True)
    avatar = models.ImageField("Logo", upload_to='company_logos/', null=True, blank=True)

    class Meta:
        verbose_name = "Empresa"
        verbose_name_plural = "Empresas"

    def __str__(self):
        return self.name

class CompanyContact(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='contacts', verbose_name="Empresa")
    first_name = models.CharField("Nombre", max_length=150)
    last_name = models.CharField("Apellidos", max_length=150, null=True, blank=True)
    email = models.EmailField("Correo electrónico")
    position = models.CharField("Cargo", max_length=100, null=True, blank=True)
    phone = models.CharField("Teléfono", max_length=20, null=True, blank=True)

    class Meta:
        verbose_name = "Contacto de Empresa"
        verbose_name_plural = "Contactos de Empresa"


class Contract(models.Model):
    code = models.CharField("Código", max_length=50, unique=True)
    description = models.TextField("Descripción")
    start_date = models.DateField("Fecha de inicio")
    end_date = models.DateField("Fecha de fin")
    client_name = models.CharField("Nombre del cliente", max_length=255)
    contact_name = models.CharField("Nombre de contacto", max_length=255, null=True, blank=True)
    contact_email = models.EmailField("Email de contacto", null=True, blank=True)
    contact_phone = models.CharField("Teléfono de contacto", max_length=20, null=True, blank=True)
    amount = models.DecimalField("Importe", max_digits=12, decimal_places=2)
    coordinator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='coordinated_contracts')

    class Meta:
        verbose_name = "Contrato"
        verbose_name_plural = "Contratos"


class WorkCenter(models.Model):
    TYPE_CHOICES = [
        ('EMBALSE', 'EMBALSE'),
        ('OFICINA', 'OFICINA'),
    ]
    PROVINCE_CHOICES = [
        ('MÁLAGA', 'MÁLAGA'), ('SEVILLA', 'SEVILLA'), ('JAÉN', 'JAÉN'),
        ('CÓRDOBA', 'CÓRDOBA'), ('CEUTA', 'CEUTA'), ('MELILLA', 'MELILLA'),
        ('GRANADA', 'GRANADA')
    ]

    name = models.CharField("Nombre", max_length=200)
    type = models.CharField("Tipo", max_length=20, choices=TYPE_CHOICES)
    address = models.TextField("Dirección")
    zip_code = models.CharField("Código Postal", max_length=10)
    phone = models.CharField("Teléfono", max_length=20)
    province = models.CharField("Provincia", max_length=50, choices=PROVINCE_CHOICES)
    risk_info_url = models.TextField("URL/Base64 de Riesgos", null=True, blank=True)
    risk_info_file_name = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        verbose_name = "Centro de Trabajo"
        verbose_name_plural = "Centros de Trabajo"


class Project(models.Model):
    COMPANY_STATUS_CHOICES = [
        ('INACTIVA', 'INACTIVA'), ('ACTIVA', 'ACTIVA'), ('TERMINADO', 'TERMINADO')
    ]
    DOC_STATUS_CHOICES = [
        ('NO_VERIFICADA', 'NO_VERIFICADA'), ('VERIFICADA', 'VERIFICADA')
    ]

    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='projects')
    code = models.CharField("Código", max_length=50, unique=True)
    description = models.TextField("Descripción")
    start_date = models.DateField("Fecha de inicio")
    end_date = models.DateField("Fecha de fin")
    work_center = models.ForeignKey(WorkCenter, on_delete=models.SET_NULL, null=True, blank=True)
    manager = models.ForeignKey(User, on_delete=models.PROTECT, related_name='managed_projects')
    companies = models.ManyToManyField(Company, related_name='projects')
    fecha_solicitud = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    contacts = models.ManyToManyField(CompanyContact, related_name='projects')
    main_contact = models.ForeignKey(CompanyContact, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    contract_manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='project_contract_managers')
    company_status = models.CharField(max_length=20, choices=COMPANY_STATUS_CHOICES, default='INACTIVA')
    documentation_status = models.CharField(max_length=20, choices=DOC_STATUS_CHOICES, default='NO_VERIFICADA')

    class Meta:
        verbose_name = "Proyecto"
        verbose_name_plural = "Proyectos"


class ProjectDocument(models.Model):
    STATUS_CHOICES = [
        ('BORRADOR', 'BORRADOR'), ('PRESENTADO', 'PRESENTADO'),
        ('ACEPTADO', 'ACEPTADO'), ('RECHAZADO', 'RECHAZADO')
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='documents')
    name = models.CharField(max_length=255)
    url = models.TextField("URL/Base64 del documento")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='BORRADOR')
    category = models.CharField(max_length=100, null=True, blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status_date = models.DateTimeField(null=True, blank=True)
    signatures = models.JSONField(default=list, blank=True)

    class Meta:
        verbose_name = "Documento de Proyecto"
        verbose_name_plural = "Documentos de Proyecto"


class Meeting(models.Model):
    STATUS_CHOICES = [
        ('PROGRAMADA', 'PROGRAMADA'), ('EN_CURSO', 'EN_CURSO'),
        ('REALIZADA', 'REALIZADA'), ('CANCELADA', 'CANCELADA')
    ]
    TYPE_CHOICES = [
        ('PRESENCIAL', 'PRESENCIAL'), ('ONLINE', 'ONLINE')
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='meetings')
    start_date = models.DateField()
    end_date = models.DateField()
    time = models.TimeField()
    reason = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    teams_link = models.URLField(max_length=500, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PROGRAMADA')
    attendees = models.ManyToManyField(User, blank=True, related_name='meetings')
    notification_contacts = models.ManyToManyField(CompanyContact, blank=True, related_name='meeting_notifications')
    minutes = models.TextField(null=True, blank=True)
    minute_pdf_url = models.URLField(max_length=500, null=True, blank=True)
    signatures = models.JSONField(default=list, blank=True)
    is_notified = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Reunión"
        verbose_name_plural = "Reuniones"


class DocumentTemplate(models.Model):
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    file_data = models.TextField(help_text="Base64 encoded data")
    file_name = models.CharField(max_length=255)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Plantilla de Documento"
        verbose_name_plural = "Plantillas de Documentos"
