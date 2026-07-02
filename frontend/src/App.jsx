import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import RoomAllocation from './pages/RoomAllocation';
import Complaints from './pages/Complaints';
import GatePasses from './pages/GatePasses';
import Suggestions from './pages/Suggestions';

// Protected Route Wrapper Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  const location = useLocation();

  if (!token) {
    // Redirect to login but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  const [user, setUser] = useState(null);

  // Load user data from localStorage on start
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public auth route */}
        <Route path="/login" element={<AuthPage onAuthSuccess={(userData) => setUser(userData)} />} />

        {/* Protected app routes inside Dashboard layout */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardLayout user={user}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard user={user} />} />
                  <Route path="/profile" element={<Profile user={user} onProfileUpdate={(u) => setUser(u)} />} />
                  <Route path="/allocation" element={<RoomAllocation user={user} />} />
                  <Route path="/complaints" element={<Complaints user={user} />} />
                  <Route path="/gatepasses" element={<GatePasses user={user} />} />
                  <Route path="/feedback" element={<Suggestions user={user} />} />
                  {/* Fallback route */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
