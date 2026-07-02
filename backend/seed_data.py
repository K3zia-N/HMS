import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hostel_project.settings')
django.setup()

from hostel_app.models import Hostel, Room, User, Announcement

def seed():
    print("Seeding database...")
    
    # Clean up existing data to prevent duplicate keys
    Hostel.objects.all().delete()
    # Delete non-superusers to avoid conflict, keeping admin if needed or recreating it
    User.objects.all().delete()
    
    # 1. Create Default Admin User
    admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    admin_user.role = 'ADMIN'
    admin_user.first_name = "Hostel"
    admin_user.last_name = "Admin"
    admin_user.save()
    print("-> Created Admin Account:")
    print("   Username: admin")
    print("   Password: admin123")
    print("   Role: ADMIN")

    # 2. Create Hostels
    h1 = Hostel.objects.create(
        name="Emerald Hall", 
        gender_type="MALE", 
        total_rooms=5, 
        description="Premium male residence with study lounges, a games room, and high-speed Wi-Fi."
    )
    h2 = Hostel.objects.create(
        name="Burgundy Tower", 
        gender_type="FEMALE", 
        total_rooms=5, 
        description="Beautifully designed female residence featuring secure gardens and modern amenities."
    )
    h3 = Hostel.objects.create(
        name="Cream Oasis", 
        gender_type="COED", 
        total_rooms=3, 
        description="Modern co-living space with shared common kitchens and active social community."
    )
    print("-> Created Hostels: Emerald Hall (Male), Burgundy Tower (Female), Cream Oasis (Co-Ed)")

    # 3. Create Rooms
    # Emerald Hall Rooms (Capacity 2)
    for i in range(101, 106):
        Room.objects.create(hostel=h1, room_number=str(i), capacity=2, occupancy=0)
        
    # Burgundy Tower Rooms (Capacity 2)
    for i in range(201, 206):
        Room.objects.create(hostel=h2, room_number=str(i), capacity=2, occupancy=0)
        
    # Cream Oasis Rooms (Capacity 4)
    for i in range(301, 304):
        Room.objects.create(hostel=h3, room_number=str(i), capacity=4, occupancy=0)
        
    print("-> Created 13 Rooms across hostels.")

    # 4. Create Initial Announcements
    Announcement.objects.create(
        created_by=admin_user,
        title="Welcome to the New Academic Year!",
        content="Welcome to your new home! Please ensure your hostel profile is completed. Automated room allocation is now active. If you face any issues, please submit a maintenance complaint through the tracking portal.",
        target_audience="ALL"
    )
    
    Announcement.objects.create(
        created_by=admin_user,
        title="Emerald Hall Elevator Maintenance",
        content="Please note that the main elevator in Emerald Hall will be offline for maintenance on Friday, July 3rd from 9:00 AM to 1:00 PM. Please use the stairs.",
        target_audience="MALE"
    )
    
    Announcement.objects.create(
        created_by=admin_user,
        title="Burgundy Tower Yoga Session",
        content="A weekend relaxation yoga session is organized in the Burgundy Tower garden this Saturday at 7:00 AM. Bring your own mat!",
        target_audience="FEMALE"
    )
    
    print("-> Posted initial announcements.")
    print("Seeding completed successfully!")

if __name__ == '__main__':
    seed()
