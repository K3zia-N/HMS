import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  KeyRound,
  Wrench,
  MessageSquarePlus,
  QrCode,
  LogOut,
  Bell,
  Menu,
  ChevronLeft,
  ChevronRight,
  Settings,
  PhoneCall
} from 'lucide-react';
import api from '../api';

function DashboardLayout({ children, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop collapse
  const [studentProfile, setStudentProfile] = useState(null);
  const navigate = useNavigate();

  const closeSidebar = () => setSidebarOpen(false);

  const handleSidebarToggle = () => {
    if (window.innerWidth <= 900) {
      setSidebarOpen(prev => !prev);
    } else {
      setCollapsed(prev => !prev);
    }
  };

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      api.get('profile/')
        .then(res => setStudentProfile(res.data.profile))
        .catch(() => {});
    }
  }, [user]);

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
    <div className="app-shell">
      {/* Full-width Top Bar */}
      <header className="top-nav">
        <div className="top-nav-left">
          <button
            className="hamburger-btn always-visible"
            onClick={handleSidebarToggle}
            title="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="top-nav-logo">
            <div className="sidebar-logo-icon">H</div>
            <span className="top-nav-logo-text">HostelHome</span>
          </div>
          <nav className="top-nav-links">
            <NavLink to="/dashboard" className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}>
              Dashboard
            </NavLink>
          </nav>
        </div>

        <div className="top-nav-right">
          <button className="icon-btn" title="Notifications">
            <Bell size={18} />
          </button>
          <div className="top-nav-user">
            <div className="top-nav-user-text">
              <p className="user-profile-name">{getFullName()}</p>
              <p className="user-profile-role">{user?.role || 'STUDENT'}</p>
            </div>
            <div className="avatar-placeholder">{getInitials()}</div>
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        {/* Mobile Overlay */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
          onClick={closeSidebar}
        />

        {/* Sidebar Navigation */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
          <div>
            {user?.role === 'STUDENT' ? (
              <div className="welcome-resident-card">
                <button
                  className="sidebar-collapse-btn"
                  onClick={() => setCollapsed(!collapsed)}
                  title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
                <div className="welcome-resident-text">
                  <span className="welcome-resident-label">Welcome, Resident</span>
                  <span className="welcome-resident-room">
                    {studentProfile?.is_allocated
                      ? `${studentProfile.hostel_name}, Room ${studentProfile.room_number}`
                      : 'No room allocated yet'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="sidebar-logo">
                {!collapsed && <span className="sidebar-logo-label">Menu</span>}
                <button
                  className="sidebar-collapse-btn static"
                  onClick={() => setCollapsed(!collapsed)}
                  title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
              </div>
            )}

            <ul className="sidebar-menu">
              <li>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={closeSidebar}
                  title="Dashboard"
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
                  title="My Profile"
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
                  title="Room Allocation"
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
                  title="Complaints"
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
                  title="Gate Passes"
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
                  title="Feedback"
                >
                  <MessageSquarePlus size={20} />
                  <span>Feedback</span>
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Sidebar Footer */}
          <div className="sidebar-footer">
            <a href="mailto:warden@kabarak.ac.ke" className="btn-primary btn-emerald contact-warden-btn" title="Contact Warden">
              <PhoneCall size={16} />
              <span>Contact Warden</span>
            </a>
            <ul className="sidebar-menu sidebar-menu-secondary">
              <li>
                <NavLink
                  to="/profile"
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={closeSidebar}
                  title="Settings"
                >
                  <Settings size={20} />
                  <span>Settings</span>
                </NavLink>
              </li>
              <li>
                <button onClick={handleLogout} className="sidebar-item logout-item" title="Logout">
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;