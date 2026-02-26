from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
from .models import (
    User, Company, CompanyContact, Contract, WorkCenter, 
    Project, ProjectDocument, Meeting, DocumentTemplate
)
from .serializers import (
    UserSerializer, CompanySerializer, CompanyContactSerializer, ContractSerializer, 
    WorkCenterSerializer, ProjectSerializer, ProjectDocumentSerializer, 
    MeetingSerializer, DocumentTemplateSerializer
)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer

class CompanyContactViewSet(viewsets.ModelViewSet):
    queryset = CompanyContact.objects.all()
    serializer_class = CompanyContactSerializer

class ContractViewSet(viewsets.ModelViewSet):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer

class WorkCenterViewSet(viewsets.ModelViewSet):
    queryset = WorkCenter.objects.all()
    serializer_class = WorkCenterSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

class ProjectDocumentViewSet(viewsets.ModelViewSet):
    queryset = ProjectDocument.objects.all()
    serializer_class = ProjectDocumentSerializer

class MeetingViewSet(viewsets.ModelViewSet):
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer

    @action(detail=True, methods=['post'])
    def notify(self, request, pk=None):
        meeting = self.get_object()
        contacts = list(meeting.notification_contacts.all())

        if not contacts:
            if meeting.project.main_contact:
                contacts = [meeting.project.main_contact]
            else:
                return Response({"error": "No hay destinatarios configurados."}, status=status.HTTP_400_BAD_REQUEST)

        emails = [contact.email for contact in contacts if contact.email]
        if not emails:
            return Response({"error": "Los contactos seleccionados no tienen correo electrónico."}, status=status.HTTP_400_BAD_REQUEST)

        subject = f"Convocatoria de Reunión: {meeting.reason}"
        message = (
            f"Se ha programado una nueva reunión para el proyecto: {meeting.project.description}\n\n"
            f"Motivo: {meeting.reason}\n"
            f"Fecha de inicio: {meeting.start_date}\n"
            f"Hora: {meeting.time}\n"
            f"Tipo: {meeting.type}\n"
            f"Lugar/Enlace: {meeting.teams_link if meeting.type == 'ONLINE' else meeting.location}\n\n"
            f"Por favor, revisa la plataforma para más detalles.\n"
        )

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=emails,
                fail_silently=False,
            )
            return Response({"message": "Notificación enviada con éxito."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DocumentTemplateViewSet(viewsets.ModelViewSet):
    queryset = DocumentTemplate.objects.all()
    serializer_class = DocumentTemplateSerializer
