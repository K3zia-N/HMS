import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  Home,
  Wrench,
  QrCode,
  Megaphone,
  CheckCircle2,
  Building2,
  ShieldCheck,
  CalendarPlus
} from 'lucide-react';
import api from '../api';

function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin announcement form state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annAudience, setAnnAudience] = useState('ALL');
  const [annSuccess, setAnnSuccess] = useState('');
  const [annError, setAnnError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch announcements (both student and admin see this, backend filters automatically)
      const annRes = await api.get('announcements/');
      setAnnouncements(annRes.data);

      if (user?.role === 'ADMIN') {
        // Fetch Admin Statistics
        const statsRes = await api.get('admin/stats/');
        setStats(statsRes.data);
      } else {
        // Fetch Student Profile & Personal Complaints
        const profileRes = await api.get('profile/');
        setStudentProfile(profileRes.data.profile);
        
        const complaintsRes = await api.get('complaints/');
        setRecentComplaints(complaintsRes.data.slice(0, 3)); // show top 3
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    setAnnSuccess('');
    setAnnError('');
    try {
      const response = await api.post('announcements/', {
        title: annTitle,
        content: annContent,
        target_audience: annAudience
      });
      setAnnouncements([response.data, ...announcements]);
      setAnnTitle('');
      setAnnContent('');
      setAnnSuccess('Announcement posted successfully!');
      
      // Refresh stats if admin
      if (user?.role === 'ADMIN') {
        const statsRes = await api.get('admin/stats/');
        setStats(statsRes.data);
      }
    } catch (err) {
      setAnnError('Failed to post announcement.');
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '50px', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Loading Dashboard...</div>;
  }

  // Static sample data for sections with no backend model yet (see note below)
  const sampleMaintenanceItems = [
    { label: 'General Plumbing Check', percent: 100, status: 'Completed' },
    { label: 'Wi-Fi Router Upgrade (Block A)', percent: 65, status: 'In Progress' },
  ];
  const sampleUpcomingEvents = [
    { date: 'OCT 15', title: 'Community Dinner', time: '7:00 PM • Main Mess Hall' },
    { date: 'OCT 18', title: 'Dorm Movie Night', time: '8:30 PM • TV Lounge' },
  ];

  // --- 1. STUDENT VIEW ---
  if (user?.role === 'STUDENT') {
    const openComplaints = recentComplaints.filter(c => c.status !== 'RESOLVED').length;

    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Welcome home, {user.first_name || user.username} 👋</h2>
          
        </div>

        {/* Quick stats for students */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon-wrapper burgundy">
              <Home size={22} />
            </div>
            <div className="metric-details">
              <h3>MY ROOM</h3>
              <p>{studentProfile?.is_allocated ? `Room ${studentProfile.room_number}` : 'Not Allocated'}</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-wrapper emerald">
              <CheckCircle2 size={22} />
            </div>
            <div className="metric-details">
              <h3>OPEN COMPLAINTS</h3>
              <p>{openComplaints}</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-wrapper lavender">
              <Building2 size={22} />
            </div>
            <div className="metric-details">
              <h3>CURRENT BUILDING</h3>
              <p style={{ fontSize: '1.25rem', marginTop: '6px' }}>{studentProfile?.hostel_name || 'Unassigned'}</p>
            </div>
          </div>
        </div>

        {/* Student Content Panels */}
        <div className="dashboard-panels">
          {/* Left column: Bulletin + Maintenance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="panel">
              <div className="panel-header">
                <h2>Bulletin & Announcements</h2>
                <Megaphone size={18} color="var(--emerald)" />
              </div>
              {announcements.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>No new announcements at this time.</p>
              ) : (
                <div className="custom-list">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="list-item" style={{ borderLeft: '4px solid var(--emerald)' }}>
                      <div className="list-item-main">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <span className="list-item-title">{ann.title}</span>
                          <span className="hostel-tag" style={{ fontSize: '0.68rem', flexShrink: 0 }}>{ann.target_audience}</span>
                        </div>
                        <span className="list-item-subtitle" style={{ marginTop: '4px', lineHeight: '1.4', color: 'var(--text-primary)' }}>{ann.content}</span>
                        <span className="list-item-subtitle" style={{ fontSize: '0.75rem', marginTop: '8px' }}>
                          Posted on {new Date(ann.created_at).toLocaleDateString()} by {ann.author_name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Maintenance Status - sample data, see note in code comments */}
            <div className="panel">
              <div className="panel-header">
                <h2>Maintenance Status</h2>
                <span className="status-pill approved" style={{ fontSize: '0.7rem' }}>ALL CLEAR</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {sampleMaintenanceItems.map((item, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: '600' }}>{item.label}</span>
                      <span style={{ color: item.percent === 100 ? 'var(--emerald)' : 'var(--text-secondary)', fontWeight: '600' }}>
                        {item.status} {item.percent}%
                      </span>
                    </div>
                    <div className="progress-bar-container" style={{ height: '8px', borderRadius: '4px' }}>
                      <div
                        className="progress-bar"
                        style={{ width: `${item.percent}%`, height: '100%', borderRadius: '4px' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: Allocation Info + Upcoming Events */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="panel" style={{ background: 'linear-gradient(160deg, var(--burgundy) 0%, var(--burgundy-hover) 100%)', color: '#FFFFFF', border: 'none' }}>
              <div className="panel-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                <h2 style={{ color: '#FFFFFF' }}>Allocation Info</h2>
                <ShieldCheck size={18} color="rgba(255,255,255,0.7)" />
              </div>
              {studentProfile?.is_allocated ? (
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)' }}>Allocated:</p>
                  <p style={{ fontSize: '1.15rem', fontWeight: '700', margin: '6px 0 4px 0' }}>{studentProfile.hostel_name}</p>
                  <p style={{ fontWeight: '600', fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)' }}>Room {studentProfile.room_number}</p>
                  <div style={{ margin: '16px 0', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>Status</span>
                    <span style={{ fontWeight: '700', color: '#8FE3B8' }}>Active</span>
                  </div>
                  <NavLink to="/allocation" className="btn-primary" style={{ display: 'block', textAlign: 'center', width: '100%', fontSize: '0.85rem', backgroundColor: 'rgba(255,255,255,0.12)' }}>
                    View Allocation Details
                  </NavLink>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', marginBottom: '16px' }}>You do not have a room assigned. Please apply for a room allocation.</p>
                  <NavLink to="/allocation" className="btn-primary" style={{ display: 'inline-block', textAlign: 'center', width: '100%', fontSize: '0.9rem', backgroundColor: 'rgba(255,255,255,0.12)' }}>
                    Request Room Allocation
                  </NavLink>
                </div>
              )}
            </div>

            {/* Upcoming House Events - sample data, see note in code comments */}
            <div className="panel">
              <div className="panel-header">
                <h2>Upcoming House Events</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {sampleUpcomingEvents.map((event, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ backgroundColor: 'var(--secondary-bg)', borderRadius: '8px', padding: '6px 10px', textAlign: 'center', minWidth: '52px' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--burgundy)' }}>{event.date.split(' ')[0]}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '700' }}>{event.date.split(' ')[1]}</div>
                    </div>
                    <div>
                      <p style={{ fontWeight: '600', fontSize: '0.88rem' }}>{event.title}</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CalendarPlus size={14} /> Sync with my Google Calendar
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. ADMIN VIEW ---
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Admin Control Center 🔑</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Real-time statistics and administrative actions.</p>
      </div>

      {/* Admin stats grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-wrapper burgundy">
            <Users size={22} />
          </div>
          <div className="metric-details">
            <h3>Registered Students</h3>
            <p>{stats?.total_students || 0}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper emerald">
            <Home size={22} />
          </div>
          <div className="metric-details">
            <h3>Beds Occupancy</h3>
            <p>{stats?.total_occupancy || 0} / {stats?.total_capacity || 0}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper cream">
            <Wrench size={22} />
          </div>
          <div className="metric-details">
            <h3>Pending Complaints</h3>
            <p>{stats?.pending_complaints || 0}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper burgundy">
            <QrCode size={22} />
          </div>
          <div className="metric-details">
            <h3>Pending Gate Passes</h3>
            <p>{stats?.pending_gate_passes || 0}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-panels">
        {/* Post Announcement Panel */}
        <div className="panel">
          <div className="panel-header">
            <h2>Publish Announcement</h2>
            <Megaphone size={18} color="var(--burgundy)" />
          </div>
          {annSuccess && (
            <div style={{ backgroundColor: '#EBF7F0', border: '1px solid #0A5C36', color: '#0A5C36', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
              {annSuccess}
            </div>
          )}
          {annError && (
            <div style={{ backgroundColor: '#FBEFF2', border: '1px solid #580F22', color: '#580F22', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
              {annError}
            </div>
          )}
          <form onSubmit={handlePostAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Announcement Title</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Electrical Power Outage Maintenance" 
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Target Audience</label>
              <select 
                className="form-input"
                value={annAudience}
                onChange={(e) => setAnnAudience(e.target.value)}
              >
                <option value="ALL">All Hostels</option>
                <option value="MALE">Male Hostels Only</option>
                <option value="FEMALE">Female Hostels Only</option>
              </select>
            </div>

            <div className="form-group">
              <label>Message Content</label>
              <textarea 
                className="form-input" 
                rows="4" 
                placeholder="Write your announcement details here..."
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                required
                style={{ resize: 'vertical' }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 24px' }}>
              Publish Announcement
            </button>
          </form>
        </div>

        {/* Live Announcements Bulletin */}
        <div className="panel">
          <div className="panel-header">
            <h2>Bulletin Board</h2>
          </div>
          {announcements.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>No announcements published.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {announcements.map((ann) => (
                <div key={ann.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>{ann.title}</h4>
                    <span className="hostel-tag" style={{ fontSize: '0.7rem' }}>{ann.target_audience}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '6px' }}>{ann.content}</p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{new Date(ann.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
