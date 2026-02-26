from rest_framework import serializers
from .models import (
    User, Company, CompanyContact, Contract, WorkCenter, 
    Project, ProjectDocument, Meeting, DocumentTemplate
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
        queryset=User.objects.all(), source='coordinator', write_only=True, required=False, allow_null=True
    )
    
    class Meta:
        model = Contract
        fields = '__all__'


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

    class Meta:
        model = Project
        fields = [
            'id', 'code', 'description', 'start_date', 'end_date',
            'contract', 'work_center', 'manager', 'companies', 'contacts',
            'contract_id', 'work_center_id', 'manager_id', 'company_ids', 'contact_ids',
            'fecha_solicitud', 'created_at', 'main_contact', 'contract_manager',
            'company_status', 'documentation_status'
        ]
