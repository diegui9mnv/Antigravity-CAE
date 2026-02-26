from rest_framework import serializers
from .models import (
    User, CompanyContact, Contract, WorkCenter, 
    Project, ProjectDocument, Meeting, DocumentTemplate
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'role', 'avatar', 'phone', 'cif']
        read_only_fields = ['id']


class CompanyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyContact
        fields = '__all__'


class ContractSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contract
        fields = '__all__'


class WorkCenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkCenter
        fields = '__all__'


class ProjectDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectDocument
        fields = '__all__'


class MeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meeting
        fields = '__all__'


class DocumentTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentTemplate
        fields = '__all__'


class ProjectSerializer(serializers.ModelSerializer):
    # Nested representation for read operations to provide full objects
    contract = ContractSerializer(read_only=True)
    work_center = WorkCenterSerializer(read_only=True)
    manager = UserSerializer(read_only=True)
    companies = UserSerializer(many=True, read_only=True)
    contacts = CompanyContactSerializer(many=True, read_only=True)
    
    # Write operations require IDs
    contract_id = serializers.PrimaryKeyRelatedField(
        queryset=Contract.objects.all(), source='contract', write_only=True
    )
    work_center_id = serializers.PrimaryKeyRelatedField(
        queryset=WorkCenter.objects.all(), source='work_center', write_only=True
    )
    manager_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='manager', write_only=True
    )
    company_ids = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='companies', many=True, write_only=True
    )
    contact_ids = serializers.PrimaryKeyRelatedField(
        queryset=CompanyContact.objects.all(), source='contacts', many=True, write_only=True
    )

    class Meta:
        model = Project
        fields = [
            'id', 'code', 'description', 'start_date', 'end_date',
            'contract', 'work_center', 'manager', 'companies', 'contacts',
            'contract_id', 'work_center_id', 'manager_id', 'company_ids', 'contact_ids',
            'fecha_solicitud', 'created_at', 'main_contact', 'contract_manager',
            'company_status', 'documentation_status'
        ]
