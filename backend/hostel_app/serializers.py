from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import Hostel, Room, StudentProfile, Complaint, Feedback, GatePass, Announcement

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role')
        read_only_fields = ('id', 'role')


class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    hostel_name = serializers.CharField(source='room.hostel.name', read_only=True)
    hostel_id = serializers.IntegerField(source='room.hostel.id', read_only=True)

    class Meta:
        model = StudentProfile
        fields = ('id', 'user', 'roll_number', 'phone_number', 'gender', 'course', 'emergency_contact', 'room', 'room_number', 'hostel_name', 'hostel_id', 'is_allocated')
        read_only_fields = ('id', 'is_allocated', 'room')


class RegisterSerializer(serializers.ModelSerializer):
    # Student profile fields (only required if role is STUDENT)
    roll_number = serializers.CharField(required=False, write_only=True)
    phone_number = serializers.CharField(required=False, write_only=True)
    gender = serializers.CharField(required=False, write_only=True)
    course = serializers.CharField(required=False, write_only=True)
    emergency_contact = serializers.CharField(required=False, write_only=True)

    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 'role', 
                  'roll_number', 'phone_number', 'gender', 'course', 'emergency_contact')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True},
        }

    def validate(self, attrs):
        role = attrs.get('role', 'STUDENT')
        if role == 'STUDENT':
            student_fields = ['roll_number', 'phone_number', 'gender', 'course', 'emergency_contact']
            for field in student_fields:
                if not attrs.get(field):
                    raise serializers.ValidationError({field: f"This field is required for students."})
            
            # Check roll number uniqueness
            if StudentProfile.objects.filter(roll_number=attrs.get('roll_number')).exists():
                raise serializers.ValidationError({"roll_number": "Student with this Roll Number already exists."})
                
        return attrs

    def create(self, validated_data):
        role = validated_data.get('role', 'STUDENT')
        password = validated_data.pop('password')
        
        # Pop student-specific fields to handle separately
        roll_number = validated_data.pop('roll_number', None)
        phone_number = validated_data.pop('phone_number', None)
        gender = validated_data.pop('gender', None)
        course = validated_data.pop('course', None)
        emergency_contact = validated_data.pop('emergency_contact', None)

        with transaction.atomic():
            # Create user
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=password,
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                role=role
            )
            
            # If student, create student profile
            if role == 'STUDENT':
                StudentProfile.objects.create(
                    user=user,
                    roll_number=roll_number,
                    phone_number=phone_number,
                    gender=gender,
                    course=course,
                    emergency_contact=emergency_contact
                )
                
        return user


class RoomSerializer(serializers.ModelSerializer):
    hostel_name = serializers.CharField(source='hostel.name', read_only=True)
    hostel_gender = serializers.CharField(source='hostel.gender_type', read_only=True)

    class Meta:
        model = Room
        fields = ('id', 'hostel', 'hostel_name', 'hostel_gender', 'room_number', 'capacity', 'occupancy', 'is_full')
        read_only_fields = ('id', 'is_full', 'occupancy')


class HostelSerializer(serializers.ModelSerializer):
    rooms = RoomSerializer(many=True, read_only=True)
    available_beds = serializers.SerializerMethodField()
    total_beds = serializers.SerializerMethodField()

    class Meta:
        model = Hostel
        fields = ('id', 'name', 'gender_type', 'total_rooms', 'description', 'rooms', 'available_beds', 'total_beds')
        read_only_fields = ('id',)

    def get_available_beds(self, obj):
        total_capacity = sum(r.capacity for r in obj.rooms.all())
        total_occupancy = sum(r.occupancy for r in obj.rooms.all())
        return total_capacity - total_occupancy

    def get_total_beds(self, obj):
        return sum(r.capacity for r in obj.rooms.all())


class ComplaintSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_roll = serializers.SerializerMethodField()
    room_number = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = ('id', 'student', 'student_name', 'student_roll', 'room_number', 'title', 'description', 'category', 'status', 'admin_remarks', 'created_at', 'updated_at')
        read_only_fields = ('id', 'student', 'created_at', 'updated_at')

    def get_student_name(self, obj):
        return obj.student.get_full_name()

    def get_student_roll(self, obj):
        if hasattr(obj.student, 'student_profile'):
            return obj.student.student_profile.roll_number
        return 'N/A'

    def get_room_number(self, obj):
        if hasattr(obj.student, 'student_profile') and obj.student.student_profile.room:
            return obj.student.student_profile.room.room_number
        return 'Not Assigned'


class FeedbackSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = Feedback
        fields = ('id', 'student', 'student_name', 'subject', 'message', 'rating', 'created_at')
        read_only_fields = ('id', 'student', 'created_at')

    def get_student_name(self, obj):
        return obj.student.get_full_name()


class GatePassSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_roll = serializers.SerializerMethodField()
    room_number = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = GatePass
        fields = ('id', 'student', 'student_name', 'student_roll', 'room_number', 'reason', 'departure_time', 'return_time', 'status', 'pass_type', 'qr_code_data', 'created_at', 'approved_by', 'approved_by_name')
        read_only_fields = ('id', 'student', 'status', 'qr_code_data', 'created_at', 'approved_by', 'approved_by_name')

    def get_student_name(self, obj):
        return obj.student.get_full_name()

    def get_student_roll(self, obj):
        if hasattr(obj.student, 'student_profile'):
            return obj.student.student_profile.roll_number
        return 'N/A'

    def get_room_number(self, obj):
        if hasattr(obj.student, 'student_profile') and obj.student.student_profile.room:
            return obj.student.student_profile.room.room_number
        return 'Not Assigned'

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return obj.approved_by.get_full_name()
        return 'Pending Approval'


class AnnouncementSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Announcement
        fields = ('id', 'created_by', 'author_name', 'title', 'content', 'target_audience', 'created_at')
        read_only_fields = ('id', 'created_by', 'created_at')
