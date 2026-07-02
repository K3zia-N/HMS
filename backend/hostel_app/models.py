import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('STUDENT', 'Student'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='STUDENT')
    
    # Simple helpers to check roles
    def is_admin_user(self):
        return self.role == 'ADMIN' or self.is_superuser
        
    def is_student_user(self):
        return self.role == 'STUDENT'


class Hostel(models.Model):
    GENDER_CHOICES = (
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('COED', 'Co-Ed'),
    )
    name = models.CharField(max_length=100)
    gender_type = models.CharField(max_length=10, choices=GENDER_CHOICES)
    total_rooms = models.IntegerField()
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Room(models.Model):
    hostel = models.ForeignKey(Hostel, on_delete=models.CASCADE, related_name='rooms')
    room_number = models.CharField(max_length=20)
    capacity = models.IntegerField()
    occupancy = models.IntegerField(default=0)
    is_full = models.BooleanField(default=False)

    class Meta:
        unique_together = ('hostel', 'room_number')

    def __str__(self):
        return f"{self.hostel.name} - Room {self.room_number}"

    def save(self, *args, **kwargs):
        self.is_full = self.occupancy >= self.capacity
        super().save(*args, **kwargs)


class StudentProfile(models.Model):
    GENDER_CHOICES = (
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('OTHER', 'Other'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    roll_number = models.CharField(max_length=50, unique=True)
    phone_number = models.CharField(max_length=20)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    course = models.CharField(max_length=100)
    emergency_contact = models.CharField(max_length=20)
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    is_allocated = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.roll_number})"


class Complaint(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
    )
    CATEGORY_CHOICES = (
        ('ELECTRICAL', 'Electrical'),
        ('PLUMBING', 'Plumbing'),
        ('CLEANING', 'Cleaning'),
        ('OTHER', 'Other'),
    )
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='complaints')
    title = models.CharField(max_length=100)
    description = models.TextField()
    category = models.CharField(max_length=15, choices=CATEGORY_CHOICES, default='OTHER')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    admin_remarks = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.student.username} ({self.status})"


class Feedback(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedbacks')
    subject = models.CharField(max_length=100)
    message = models.TextField()
    rating = models.IntegerField(default=5)  # 1 to 5 stars
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.subject} - {self.student.username}"


class GatePass(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    PASS_CHOICES = (
        ('TEMPORARY', 'Temporary Outing'),
        ('CHECKOUT', 'Permanent Checkout'),
    )
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='gate_passes')
    reason = models.TextField()
    departure_time = models.DateTimeField()
    return_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    pass_type = models.CharField(max_length=15, choices=PASS_CHOICES, default='TEMPORARY')
    qr_code_data = models.CharField(max_length=100, blank=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_passes')

    def __str__(self):
        return f"Pass {self.pass_type} - {self.student.username} ({self.status})"

    def save(self, *args, **kwargs):
        if not self.qr_code_data:
            self.qr_code_data = f"GP-{uuid.uuid4().hex[:12].upper()}"
        super().save(*args, **kwargs)


class Announcement(models.Model):
    AUDIENCE_CHOICES = (
        ('ALL', 'All Hostels'),
        ('MALE', 'Male Hostels'),
        ('FEMALE', 'Female Hostels'),
    )
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='announcements')
    title = models.CharField(max_length=155)
    content = models.TextField()
    target_audience = models.CharField(max_length=10, choices=AUDIENCE_CHOICES, default='ALL')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
