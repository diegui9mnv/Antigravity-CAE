from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    UserViewSet, CompanyContactViewSet, ContractViewSet, 
    WorkCenterViewSet, ProjectViewSet, ProjectDocumentViewSet, 
    MeetingViewSet, DocumentTemplateViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'contacts', CompanyContactViewSet)
router.register(r'contracts', ContractViewSet)
router.register(r'workcenters', WorkCenterViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'documents', ProjectDocumentViewSet)
router.register(r'meetings', MeetingViewSet)
router.register(r'templates', DocumentTemplateViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
