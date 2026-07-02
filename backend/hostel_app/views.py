from rest_framework import status, permissions, generics, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Hostel, Room, StudentProfile, Complaint, Feedback, GatePass, Announcement
from .serializers import (
    UserSerializer, StudentProfileSerializer, RegisterSerializer,
    HostelSerializer, RoomSerializer, ComplaintSerializer,
    FeedbackSerializer, GatePassSerializer, AnnouncementSerializer
)

User = get_user_model()

# Custom Token Serializer to return user details on login
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['username'] = user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.role
        }
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# Registration View
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            "user": UserSerializer(user).data,
            "message": "User registered successfully."
        }, status=status.HTTP_201_CREATED)


# Profile View
class ProfileView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        user_data = UserSerializer(user).data
        
        if user.role == 'STUDENT':
            try:
                profile = StudentProfile.objects.get(user=user)
                profile_data = StudentProfileSerializer(profile).data
                user_data['profile'] = profile_data
            except StudentProfile.DoesNotExist:
                user_data['profile'] = None
                
        return Response(user_data)

    def put(self, request):
        user = request.user
        
        # Update user fields
        user.first_name = request.data.get('first_name', user.first_name)
        user.last_name = request.data.get('last_name', user.last_name)
        user.email = request.data.get('email', user.email)
        user.save()
        
        if user.role == 'STUDENT':
            try:
                profile = StudentProfile.objects.get(user=user)
                profile.phone_number = request.data.get('phone_number', profile.phone_number)
                profile.emergency_contact = request.data.get('emergency_contact', profile.emergency_contact)
                profile.course = request.data.get('course', profile.course)
                profile.gender = request.data.get('gender', profile.gender)
                profile.save()
            except StudentProfile.DoesNotExist:
                pass
                
        return self.get(request)


# Hostel ViewSet
class HostelViewSet(viewsets.ModelViewSet):
    queryset = Hostel.objects.all().prefetch_related('rooms')
    serializer_class = HostelSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]


# Room ViewSet
class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]


# Automated Room Allocation View
class AutoAllocateView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @transaction.atomic
    def post(self, request):
        user = request.user
        
        # 1. Student self-allocation request
        if user.role == 'STUDENT':
            try:
                profile = StudentProfile.objects.get(user=user)
            except StudentProfile.DoesNotExist:
                return Response({"error": "Student profile not found."}, status=status.HTTP_404_NOT_FOUND)
            
            if profile.is_allocated:
                return Response({
                    "error": f"You are already allocated to Room {profile.room.room_number} in {profile.room.hostel.name}."
                }, status=status.HTTP_400_BAD_REQUEST)
                
            # Preferred hostel (optional)
            preferred_hostel_id = request.data.get('preferred_hostel')
            
            # Allocation rule logic
            # Search for available rooms in hostels matching student's gender (or COED)
            student_gender = profile.gender.upper() # MALE, FEMALE
            
            hostels = Hostel.objects.all()
            if preferred_hostel_id:
                hostels = hostels.filter(id=preferred_hostel_id)
            else:
                hostels = hostels.filter(gender_type__in=[student_gender, 'COED'])
                
            available_room = None
            for hostel in hostels:
                # Double check hostel matches gender if no preference was set
                if not preferred_hostel_id and hostel.gender_type not in [student_gender, 'COED']:
                    continue
                # Find first room in this hostel that is not full
                room = hostel.rooms.filter(is_full=False).first()
                if room:
                    available_room = room
                    break
                    
            if not available_room:
                return Response({
                    "error": "No available rooms found matching your gender criteria."
                }, status=status.HTTP_400_BAD_REQUEST)
                
            # Allocate
            profile.room = available_room
            profile.is_allocated = True
            profile.save()
            
            available_room.occupancy += 1
            available_room.save()
            
            return Response({
                "message": "Room allocated successfully!",
                "room": RoomSerializer(available_room).data
            })
            
        # 2. Admin bulk auto-allocation request
        elif user.role == 'ADMIN' or user.is_superuser:
            unallocated_students = StudentProfile.objects.filter(is_allocated=False)
            success_count = 0
            fail_count = 0
            allocations = []
            
            for profile in unallocated_students:
                student_gender = profile.gender.upper()
                hostels = Hostel.objects.filter(gender_type__in=[student_gender, 'COED'])
                
                allocated = False
                for hostel in hostels:
                    room = hostel.rooms.filter(is_full=False).first()
                    if room:
                        # Allocate student to room
                        profile.room = room
                        profile.is_allocated = True
                        profile.save()
                        
                        room.occupancy += 1
                        room.save()
                        
                        success_count += 1
                        allocations.append({
                            "student": profile.user.get_full_name(),
                            "roll_number": profile.roll_number,
                            "room": room.room_number,
                            "hostel": hostel.name
                        })
                        allocated = True
                        break
                if not allocated:
                    fail_count += 1
                    
            return Response({
                "message": "Bulk auto-allocation complete.",
                "success_count": success_count,
                "fail_count": fail_count,
                "allocations": allocations
            })


# Complaint ViewSet
class ComplaintViewSet(viewsets.ModelViewSet):
    serializer_class = ComplaintSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN' or user.is_superuser:
            return Complaint.objects.all().order_by('-created_at')
        return Complaint.objects.filter(student=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        if not (request.user.role == 'ADMIN' or request.user.is_superuser):
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
            
        complaint = self.get_object()
        new_status = request.data.get('status')
        remarks = request.data.get('admin_remarks', '')
        
        if new_status not in ['PENDING', 'IN_PROGRESS', 'RESOLVED']:
            return Response({"error": "Invalid status value."}, status=status.HTTP_400_BAD_REQUEST)
            
        complaint.status = new_status
        complaint.admin_remarks = remarks
        complaint.save()
        
        return Response({
            "message": "Complaint status updated.",
            "complaint": ComplaintSerializer(complaint).data
        })


# Feedback ViewSet
class FeedbackViewSet(viewsets.ModelViewSet):
    serializer_class = FeedbackSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN' or user.is_superuser:
            return Feedback.objects.all().order_by('-created_at')
        return Feedback.objects.filter(student=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]


# GatePass ViewSet
class GatePassViewSet(viewsets.ModelViewSet):
    serializer_class = GatePassSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN' or user.is_superuser:
            return GatePass.objects.all().order_by('-created_at')
        return GatePass.objects.filter(student=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        if not (request.user.role == 'ADMIN' or request.user.is_superuser):
            return Response({"error": "Permission denied."}, status=status.HTTP_430_FORBIDDEN)
            
        gate_pass = self.get_object()
        action_val = request.data.get('action') # APPROVED or REJECTED
        
        if action_val not in ['APPROVED', 'REJECTED']:
            return Response({"error": "Invalid action value. Must be APPROVED or REJECTED."}, status=status.HTTP_400_BAD_REQUEST)
            
        with transaction.atomic():
            gate_pass.status = action_val
            gate_pass.approved_by = request.user
            gate_pass.save()
            
            # If it's a checkout pass and gets approved, checkout the student from room
            if action_val == 'APPROVED' and gate_pass.pass_type == 'CHECKOUT':
                student_user = gate_pass.student
                try:
                    profile = StudentProfile.objects.get(user=student_user)
                    if profile.room:
                        room = profile.room
                        room.occupancy = max(0, room.occupancy - 1)
                        room.save()
                        
                        profile.room = None
                        profile.is_allocated = False
                        profile.save()
                except StudentProfile.DoesNotExist:
                    pass
                
        return Response({
            "message": f"Gate pass {action_val.lower()}.",
            "gate_pass": GatePassSerializer(gate_pass).data
        })


# Announcement ViewSet
class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN' or user.is_superuser:
            return Announcement.objects.all().order_by('-created_at')
            
        # For students, only show announcements for ALL or matching their gender
        try:
            profile = StudentProfile.objects.get(user=user)
            student_gender = profile.gender.upper()
            return Announcement.objects.filter(target_audience__in=['ALL', student_gender]).order_by('-created_at')
        except StudentProfile.DoesNotExist:
            return Announcement.objects.filter(target_audience='ALL').order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]


# Admin Statistics View
class AdminStatsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if not (request.user.role == 'ADMIN' or request.user.is_superuser):
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
            
        total_students = StudentProfile.objects.count()
        allocated_students = StudentProfile.objects.filter(is_allocated=True).count()
        unallocated_students = StudentProfile.objects.filter(is_allocated=False).count()
        
        total_hostels = Hostel.objects.count()
        total_rooms = Room.objects.count()
        
        pending_complaints = Complaint.objects.filter(status='PENDING').count()
        in_progress_complaints = Complaint.objects.filter(status='IN_PROGRESS').count()
        resolved_complaints = Complaint.objects.filter(status='RESOLVED').count()
        
        pending_gate_passes = GatePass.objects.filter(status='PENDING').count()
        
        total_capacity = sum(r.capacity for r in Room.objects.all())
        total_occupancy = sum(r.occupancy for r in Room.objects.all())
        
        return Response({
            "total_students": total_students,
            "allocated_students": allocated_students,
            "unallocated_students": unallocated_students,
            "total_hostels": total_hostels,
            "total_rooms": total_rooms,
            "total_capacity": total_capacity,
            "total_occupancy": total_occupancy,
            "available_beds": total_capacity - total_occupancy,
            "pending_complaints": pending_complaints,
            "in_progress_complaints": in_progress_complaints,
            "resolved_complaints": resolved_complaints,
            "pending_gate_passes": pending_gate_passes
        })
