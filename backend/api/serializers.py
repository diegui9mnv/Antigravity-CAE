from rest_framework import serializers
from .models import (
    User, Company, CompanyContact, Contract, WorkCenter, 
    Project, ProjectDocument, Meeting, DocumentTemplate, MeetingDocument,
    FollowUpMeeting, FollowUpMeetingConfig
)

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'role', 'avatar', 'phone', 'cif', 'password']
        read_only_fields = ['id']

    def create(self, validated_data):
        password = validated_data.pop('password', 'admin') # Default to 'admin'
        user = User.objects.create_user(**validated_data, password=password)
        return user


class CompanyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyContact
        fields = '__all__'

class CompanySerializer(serializers.ModelSerializer):
    contacts = CompanyContactSerializer(many=True, read_only=True)
    
    class Meta:
        model = Company
        fields = '__all__'




class ContractSerializer(serializers.ModelSerializer):
    coordinator_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='coordinator', required=False, allow_null=True
    )
    
    class Meta:
        model = Contract
        fields = [
            'id', 'code', 'description', 'client_name', 'contact_name', 
            'contact_email', 'contact_phone', 'start_date', 'end_date', 
            'amount', 'coordinator_id'
        ]


class WorkCenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkCenter
        fields = '__all__'


class ProjectDocumentSerializer(serializers.ModelSerializer):
    project_id = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(), source='project'
    )
    uploaded_by_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='uploaded_by', required=False, allow_null=True
    )

    class Meta:
        model = ProjectDocument
        fields = ['id', 'name', 'url', 'status', 'category', 'uploaded_at', 'status_date', 'project_id', 'uploaded_by_id']


class MeetingDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeetingDocument
        fields = ['id', 'meeting', 'name', 'file_data', 'uploaded_at']

class MeetingSerializer(serializers.ModelSerializer):
    project_id = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(), source='project'
    )
    documents = MeetingDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Meeting
        fields = [
            'id', 'project_id', 'start_date', 'end_date', 'time', 
            'reason', 'location', 'type', 'teams_link', 'status', 'attendees', 
            'notification_contacts', 'minutes', 'minute_pdf_url', 'document_data', 'signatures', 'is_notified', 'documents'
        ]


class DocumentTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentTemplate
        fields = '__all__'


class FollowUpMeetingConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = FollowUpMeetingConfig
        fields = '__all__'

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Map snake_case to camelCase
        mapping = {
            'numero_reunion': 'numeroReunion',
            'revision_informacion': 'revisionInformacion',
            'observaciones_intercambio': 'observacionesIntercambio',
            'solapes_empresas': 'solapesEmpresas',
            'accidentes_trabajo': 'accidentesTrabajo',
            'ruegos_preguntas': 'ruegosPreguntas',
        }
        for snake, camel in mapping.items():
            if snake in ret:
                ret[camel] = ret.pop(snake)
        return ret

    def to_internal_value(self, data):
        # Map camelCase back to snake_case
        mapping = {
            'numeroReunion': 'numero_reunion',
            'revisionInformacion': 'revision_informacion',
            'observacionesIntercambio': 'observaciones_intercambio',
            'solapes_empresas': 'solapes_empresas',
            'accidentesTrabajo': 'accidentes_trabajo',
            'ruegosPreguntas': 'ruegos_preguntas',
        }
        for camel, snake in mapping.items():
            if camel in data:
                data[snake] = data.pop(camel)
        return super().to_internal_value(data)


class FollowUpMeetingSerializer(serializers.ModelSerializer):
    contract_id = serializers.PrimaryKeyRelatedField(
        queryset=Contract.objects.all(), source='contract'
    )
    work_center_ids = serializers.PrimaryKeyRelatedField(
        queryset=WorkCenter.objects.all(), source='work_centers', many=True
    )
    company_ids = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(), source='companies', many=True
    )
    notification_contacts = serializers.PrimaryKeyRelatedField(
        queryset=CompanyContact.objects.all(), many=True, required=False
    )
    config = FollowUpMeetingConfigSerializer(read_only=True)

    class Meta:
        model = FollowUpMeeting
        fields = [
            'id', 'contract_id', 'reason', 'date', 'time', 'type',
            'teams_link', 'location', 'status', 'provinces', 'work_center_ids',
            'company_ids', 'created_at', 'config', 'document_data',
            'notification_contacts', 'is_notified'
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Map document_data to documentData for the frontend
        if 'document_data' in ret:
            ret['documentData'] = ret.pop('document_data')
        if 'is_notified' in ret:
            ret['isNotified'] = ret.pop('is_notified')
        return ret

    def to_internal_value(self, data):
        if 'documentData' in data:
            data['document_data'] = data.pop('documentData')
        if 'isNotified' in data:
            data['is_notified'] = data.pop('isNotified')
        return super().to_internal_value(data)


class ProjectSerializer(serializers.ModelSerializer):
    # Nested representation for read operations to provide full objects
    contract = ContractSerializer(read_only=True)
    work_center = WorkCenterSerializer(read_only=True)
    manager = UserSerializer(read_only=True)
    companies = CompanySerializer(many=True, read_only=True)
    contacts = CompanyContactSerializer(many=True, read_only=True)
    
    # Include IDs in read/write operations
    contract_id = serializers.PrimaryKeyRelatedField(
        queryset=Contract.objects.all(), source='contract'
    )
    work_center_id = serializers.PrimaryKeyRelatedField(
        queryset=WorkCenter.objects.all(), source='work_center'
    )
    manager_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='manager'
    )
    company_ids = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(), source='companies', many=True
    )
    contact_ids = serializers.PrimaryKeyRelatedField(
        queryset=CompanyContact.objects.all(), source='contacts', many=True
    )
    main_contact_id = serializers.PrimaryKeyRelatedField(
        queryset=CompanyContact.objects.all(), source='main_contact', required=False, allow_null=True
    )
    contract_manager_id = serializers.PrimaryKeyRelatedField(
        queryset=CompanyContact.objects.all(), source='contract_manager', required=False, allow_null=True
    )

    class Meta:
        model = Project
        fields = [
            'id', 'code', 'description', 'start_date', 'end_date', 'fecha_solicitud',
            'created_at', 'company_status', 'documentation_status',
            'contract', 'work_center', 'manager', 'companies', 'contacts',
            'contract_id', 'work_center_id', 'manager_id', 'company_ids', 'contact_ids',
            'main_contact_id', 'contract_manager_id'
        ]
