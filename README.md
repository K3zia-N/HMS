 - Hostel Management System

A full-stack, functional, and beautiful Hostel Management System designed with **React.js** for the frontend and **Django** for the backend. 

---

## 🎨 Theme and Design
- **Primary Color**: Cream White (`#FCFBF7` / `#FAF6ED`)
- **Accent 1 (Burgundy)**: `#580F22` (Headers, admin highlights, select buttons)
- **Accent 2 (Emerald)**: `#0A5C36` (Student actions, success tabs, navigation links)
- **Aesthetic**: Dutch Golden Age oil paintings, glassmorphic card shadows, clean modern typography (Google Outfit & Inter), and dynamic state transitions.

---

## 🚀 How to Run the Application Locally

Follow these quick commands to spin up the local development servers.

### 1. Backend (Django REST API)
Open your terminal inside the `backend` folder:
```bash
# 1. Navigate to the backend directory
cd backend

# 2. Run migrations (already done, but run to verify)
python manage.py migrate

# 3. Start the Django API server
python manage.py runserver
```
*The backend runs at `http://127.0.0.1:8000/`. Default Admin credentials are **admin** / **admin123**.*

---

### 2. Frontend (React + Vite)
Open a separate terminal inside the `frontend` folder:
```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Start the Vite React development server
npm run dev
```
*The React UI runs at `http://localhost:5173/`.*

---

## 📁 Project Structure

```text
hostel_management_system/
├── backend/
│   ├── db.sqlite3                 # Local database instance
│   ├── seed_data.py               # Database seeder (admin/hostels/rooms/announcements)
│   ├── manage.py                  # Django CLI manager
│   ├── hostel_project/            # Global settings & CORS setup
│   └── hostel_app/                # Models, Serializers, & API Viewsets
└── frontend/
    ├── public/
    │   └── still_life_floral.png  # Generated sign-in artwork
    ├── src/
    │   ├── api.js                 # Axios API configuration & JWT Interceptors
    │   ├── App.jsx                # Router & Protected route controls
    │   ├── index.css              # Styling sheet
    │   ├── layouts/
    │   │   └── DashboardLayout.jsx# Navigation sidebar frame (matches Pic 2)
    │   └── pages/
    │       ├── AuthPage.jsx       # Login/Register split-panel (matches Pic 1)
    │       ├── Dashboard.jsx      # Role-based student/admin widget screens
    │       ├── Profile.jsx        # Profile viewer & editor
    │       ├── RoomAllocation.jsx # Room placements & bulk allocation rules
    │       ├── Complaints.jsx     # Tickets filing & real-time tracker lines
    │       └── Suggestions.jsx    # Suggestions star rating forms
```

---

## 🔐 Seeded Accounts for Testing
- **Administrator**:
  - **Username**: `admin`
  - **Password**: `admin123`
- **Student**:
  - Open the website, click **Sign up now** on the Student Portal, complete the profile details, and log in with your custom credentials!
