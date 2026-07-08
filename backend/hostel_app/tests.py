from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Hostel, Room, StudentProfile

User = get_user_model()


class RoomChangeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='password123',
            role='ADMIN',
        )
        self.student_user = User.objects.create_user(
            username='student',
            email='student@example.com',
            password='password123',
            role='STUDENT',
            first_name='Jane',
            last_name='Doe',
        )

        self.hostel = Hostel.objects.create(
            name='Block A',
            gender_type='FEMALE',
            total_rooms=2,
            description='Test hostel',
        )
        self.old_room = Room.objects.create(
            hostel=self.hostel,
            room_number='101',
            capacity=2,
            occupancy=1,
        )
        self.new_room = Room.objects.create(
            hostel=self.hostel,
            room_number='102',
            capacity=2,
            occupancy=0,
        )
        self.profile = StudentProfile.objects.create(
            user=self.student_user,
            roll_number='R001',
            phone_number='1234567890',
            gender='FEMALE',
            course='CS',
            emergency_contact='0987654321',
            room=self.old_room,
            is_allocated=True,
        )

    def test_admin_can_change_student_room_and_update_occupancy(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            '/api/allocation/change-room/',
            {
                'student_profile_id': self.profile.id,
                'room_id': self.new_room.id,
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.profile.refresh_from_db()
        self.old_room.refresh_from_db()
        self.new_room.refresh_from_db()

        self.assertEqual(self.profile.room_id, self.new_room.id)
        self.assertTrue(self.profile.is_allocated)
        self.assertEqual(self.old_room.occupancy, 0)
        self.assertEqual(self.new_room.occupancy, 1)
