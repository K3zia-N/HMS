from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, RegisterView, ProfileView,
    HostelViewSet, RoomViewSet, AutoAllocateView,
    ComplaintViewSet, FeedbackViewSet, GatePassViewSet,
    AnnouncementViewSet, AdminStatsView
)

router = DefaultRouter()
router.register(r'hostels', HostelViewSet, basename='hostel')
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'complaints', ComplaintViewSet, basename='complaint')
router.register(r'feedback', FeedbackViewSet, basename='feedback')
router.register(r'gatepasses', GatePassViewSet, basename='gatepass')
router.register(r'announcements', AnnouncementViewSet, basename='announcement')

urlpatterns = [
    # Auth endpoints
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Profile endpoint
    path('profile/', ProfileView.as_view(), name='profile'),
    
    # Room allocation endpoint
    path('allocation/allocate/', AutoAllocateView.as_view(), name='room_allocate'),
    
    # Admin stats endpoint
    path('admin/stats/', AdminStatsView.as_view(), name='admin_stats'),
    
    # Viewset routers
    path('', include(router.urls)),
]
