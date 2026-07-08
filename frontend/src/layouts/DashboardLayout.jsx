import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  KeyRound, 
  Wrench, 
  MessageSquarePlus, 
  QrCode, 
  LogOut, 
  Search,
  Bell,
  Menu,
  X
} from 'lucide-react';

function DashboardLayout({ children, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getInitials = () => {
    if (!user) return 'U';
    const first = user.first_name ? user.first_name[0] : '';
    const last = user.last_name ? user.last_name[0] : '';
    return (first + last).toUpperCase() || user.username[0].toUpperCase();
  };

  const getFullName = () => {
    if (!user) return 'Guest User';
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username;
  };

  return (
    <div className="dashboard-container">
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} 
        onClick={closeSidebar}
      />

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div>
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">H</div>
            <span className="sidebar-logo-text">Hostel</span>
          </div>

          <ul className="sidebar-menu">
            <li>
              <NavLink 
                to="/dashboard" 
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/profile" 
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <User size={20} />
                <span>My Profile</span>
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/allocation" 
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <KeyRound size={20} />
                <span>Room Allocation</span>
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/complaints" 
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <Wrench size={20} />
                <span>Complaints</span>
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/gatepasses" 
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <QrCode size={20} />
                <span>Gate Passes</span>
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/feedback" 
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <MessageSquarePlus size={20} />
                <span>Feedback</span>
              </NavLink>
            </li>
          </ul>
        </div>

        {/* Sidebar Footer User Details */}
        <div className="sidebar-footer">
          <div className="user-profile-summary">
            <div className="avatar-placeholder">
              {getInitials()}
            </div>
            <div className="user-profile-details">
              <p className="user-profile-name">{getFullName()}</p>
              <p className="user-profile-role">{user?.role || 'STUDENT'}</p>
            </div>
            <button 
              onClick={handleLogout} 
              className="btn-logout" 
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Header Bar */}
        <div className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className="hamburger-btn" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle Menu"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="top-bar-title">
              <h1>Hostel Management</h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="top-bar-search">
              <Search size={18} />
              <input type="text" placeholder="Search anything..." />
            </div>
            <button 
              style={{ 
                background: '#FFFFFF', 
                border: '1px solid #E6E1DC', 
                borderRadius: '8px', 
                padding: '10px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#706B67'
              }}
              title="Notifications"
            >
              <Bell size={18} />
            </button>
          </div>
        </div>

        {/* Nested Page Content */}
        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;
