import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Users, 
  Home, 
  Wrench, 
  QrCode, 
  PlusCircle, 
  Megaphone,
  AlertCircle,
  CheckCircle2,
  Hourglass
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

  // --- 1. STUDENT VIEW ---
  if (user?.role === 'STUDENT') {
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Welcome back, {user.first_name || user.username} 👋</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Here is what's happening in your hostel community today.</p>
        </div>

        {/* Quick stats for students */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon-wrapper emerald">
              <Home size={22} />
            </div>
            <div className="metric-details">
              <h3>My Room</h3>
              <p>{studentProfile?.is_allocated ? `Room ${studentProfile.room_number}` : 'Not Allocated'}</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-wrapper burgundy">
              <Wrench size={22} />
            </div>
            <div className="metric-details">
              <h3>My Open Complaints</h3>
              <p>{recentComplaints.filter(c => c.status !== 'RESOLVED').length}</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-wrapper cream">
              <QrCode size={22} />
            </div>
            <div className="metric-details">
              <h3>Hostel Building</h3>
              <p style={{ fontSize: '1.25rem', marginTop: '6px' }}>{studentProfile?.hostel_name || 'Unassigned'}</p>
            </div>
          </div>
        </div>

        {/* Student Content Panels */}
        <div className="dashboard-panels">
          {/* Announcements Board */}
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
                      <span className="list-item-title">{ann.title}</span>
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

          {/* Quick Actions & Room Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="panel" style={{ background: 'radial-gradient(circle at 100% 100%, var(--secondary-bg) 0%, var(--card-bg) 100%)' }}>
              <div className="panel-header">
                <h2>Allocation Info</h2>
              </div>
              {studentProfile?.is_allocated ? (
                <div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>You are allocated to:</p>
                  <p style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--emerald)', margin: '8px 0 4px 0' }}>{studentProfile.hostel_name}</p>
                  <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>Room {studentProfile.room_number}</p>
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                    <span className="status-pill approved">Allocated</span>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>You do not have a room assigned. Please apply for a room allocation.</p>
                  <NavLink to="/allocation" className="btn-primary btn-emerald" style={{ display: 'inline-block', textAlign: 'center', width: '100%', fontSize: '0.9rem' }}>
                    Request Room Allocation
                  </NavLink>
                </div>
              )}
            </div>

            {/* Complaints list */}
            <div className="panel">
              <div className="panel-header">
                <h2>Recent Complaints</h2>
              </div>
              {recentComplaints.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>No complaints filed.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {recentComplaints.map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                      <div>
                        <p style={{ fontWeight: '600', fontSize: '0.85rem' }}>{c.title}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(c.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`status-pill ${c.status.toLowerCase()}`}>{c.status.replace('_', ' ')}</span>
                    </div>
                  ))}
                  <NavLink to="/complaints" style={{ fontSize: '0.8rem', color: 'var(--burgundy)', fontWeight: '700', textAlign: 'right', marginTop: '6px', display: 'block' }}>
                    View All Complaints →
                  </NavLink>
                </div>
              )}
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
