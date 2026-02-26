from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, Company, CompanyContact, Contract, WorkCenter, 
    Project, ProjectDocument, Meeting, DocumentTemplate
)

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Información de Perfil', {'fields': ('role', 'name', 'avatar', 'phone', 'cif')}),
    )
    list_display = ('email', 'name', 'role', 'is_staff')
    search_fields = ('email', 'name', 'cif')

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'cif', 'email', 'phone')
    search_fields = ('name', 'cif', 'email')

@admin.register(CompanyContact)
class CompanyContactAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'company', 'email', 'position')
    list_filter = ('company',)
    search_fields = ('first_name', 'last_name', 'email')

@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ('code', 'client_name', 'start_date', 'end_date', 'coordinator')
    search_fields = ('code', 'client_name')

@admin.register(WorkCenter)
class WorkCenterAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'province', 'phone')
    list_filter = ('type', 'province')

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('code', 'contract', 'manager', 'company_status', 'documentation_status')
    list_filter = ('company_status', 'documentation_status')
    search_fields = ('code', 'description')

@admin.register(ProjectDocument)
class ProjectDocumentAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'status', 'category', 'uploaded_at')
    list_filter = ('status', 'category')

@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ('reason', 'project', 'start_date', 'time', 'type', 'status')
    list_filter = ('type', 'status')

@admin.register(DocumentTemplate)
class DocumentTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'updated_at')
    list_filter = ('category',)
