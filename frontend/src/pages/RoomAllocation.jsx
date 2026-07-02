import React, { useState, useEffect } from 'react';
import { Home, Key, Layers, Users, CheckCircle2, AlertTriangle, Shuffle } from 'lucide-react';
import api from '../api';

function RoomAllocation({ user }) {
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [profile, setProfile] = useState(null);
  
  // Student selection
  const [selectedHostel, setSelectedHostel] = useState('');
  
  // Admin stats / allocation summaries
  const [bulkResult, setBulkResult] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      // Fetch hostels
      const hostelsRes = await api.get('hostels/');
      setHostels(hostelsRes.data);

      // Fetch rooms
      const roomsRes = await api.get('rooms/');
      setRooms(roomsRes.data);

      // If student, fetch profile to see allocation status
      if (user?.role === 'STUDENT') {
        const profileRes = await api.get('profile/');
        setProfile(profileRes.data.profile);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load room allocation details.');
    } finally {
      setLoading(false);
    }
  };

  // Student room application
  const handleApply = async (e) => {
    e.preventDefault();
    setAllocating(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await api.post('allocation/allocate/', {
        preferred_hostel: selectedHostel || null
      });
      setSuccessMsg(response.data.message);
      
      // Refresh page data
      await fetchData();
    } catch (err) {
      if (err.response && err.response.data) {
        setErrorMsg(err.response.data.error || 'Failed to allocate room.');
      } else {
        setErrorMsg('Error connecting to allocation server.');
      }
    } finally {
      setAllocating(false);
    }
  };

  // Admin bulk auto allocation
  const handleBulkAllocation = async () => {
    setAllocating(true);
    setErrorMsg('');
    setSuccessMsg('');
    setBulkResult(null);
    try {
      const response = await api.post('allocation/allocate/');
      setBulkResult(response.data);
      setSuccessMsg(response.data.message);
      
      // Refresh page data
      await fetchData();
    } catch (err) {
      setErrorMsg('Bulk allocation process failed.');
    } finally {
      setAllocating(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '50px', color: 'var(--text-secondary)' }}>Loading Room Allocation...</div>;
  }

  // --- 1. STUDENT VIEW ---
  if (user?.role === 'STUDENT') {
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Room Allocation Portal 🔑</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your residency and apply for hostel rooms.</p>
        </div>

        {successMsg && (
          <div style={{ backgroundColor: '#EBF7F0', border: '1px solid #0A5C36', color: '#0A5C36', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div style={{ backgroundColor: '#FBEFF2', border: '1px solid #580F22', color: '#580F22', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {profile?.is_allocated ? (
          <div className="panel" style={{ maxWidth: '600px', margin: '0 auto', background: 'radial-gradient(circle at 100% 0%, var(--secondary-bg) 0%, var(--card-bg) 100%)' }}>
            <div className="panel-header">
              <h2>My Accommodation</h2>
              <span className="status-pill approved">Allocated</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Hostel Residence:</span>
                <span style={{ fontWeight: '700' }}>{profile.hostel_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Room Number:</span>
                <span style={{ fontWeight: '700' }}>{profile.room_number}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                <span style={{ fontWeight: '600', color: 'var(--emerald)' }}>Active Occupant</span>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '16px', textAlign: 'center', fontStyle: 'italic' }}>
              For room changes or checks, please contact the hostel admin block.
            </p>
          </div>
        ) : (
          <div className="panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="panel-header">
              <h2>Request a Room</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
              The system will automatically allocate you a room that matches your gender profile. You can optionally select a preferred hostel below.
            </p>
            <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Preferred Hostel (Optional)</label>
                <select 
                  className="form-input" 
                  value={selectedHostel}
                  onChange={(e) => setSelectedHostel(e.target.value)}
                >
                  <option value="">No Preference (Auto-match any matching gender)</option>
                  {hostels
                    .filter(h => h.gender_type === profile?.gender.toUpperCase() || h.gender_type === 'COED')
                    .map(h => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.gender_type.toLowerCase()} - {h.available_beds} beds left)
                      </option>
                    ))
                  }
                </select>
              </div>

              <button 
                type="submit" 
                className="btn-primary btn-emerald" 
                disabled={allocating} 
                style={{ marginTop: '10px' }}
              >
                {allocating ? 'Running Allocation Rules...' : 'Submit Room Request'}
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  // --- 2. ADMIN VIEW ---
  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Hostel Resourcing & Allocation 🏢</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Review occupancy rates and trigger automated room placements.</p>
        </div>
        <button 
          onClick={handleBulkAllocation} 
          disabled={allocating} 
          className="btn-primary btn-emerald" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
        >
          <Shuffle size={18} />
          {allocating ? 'Allocating...' : 'Run Auto-Allocation Rules'}
        </button>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: '#EBF7F0', border: '1px solid #0A5C36', color: '#0A5C36', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '16px' }}>
          {successMsg}
        </div>
      )}

      {bulkResult && (
        <div className="panel" style={{ marginBottom: '24px', borderLeft: '4px solid var(--emerald)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '10px' }}>Bulk Allocation Summary</h3>
          <p style={{ fontSize: '0.88rem' }}>
            Successfully allocated <strong style={{ color: 'var(--emerald)' }}>{bulkResult.success_count}</strong> students. 
            Failed to allocate <strong style={{ color: 'var(--burgundy)' }}>{bulkResult.fail_count}</strong> students due to capacity.
          </p>
          {bulkResult.allocations.length > 0 && (
            <div style={{ marginTop: '12px', maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--secondary-bg)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '6px 12px' }}>Student</th>
                    <th style={{ padding: '6px 12px' }}>Roll</th>
                    <th style={{ padding: '6px 12px' }}>Hostel</th>
                    <th style={{ padding: '6px 12px' }}>Room</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkResult.allocations.map((a, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '6px 12px' }}>{a.student}</td>
                      <td style={{ padding: '6px 12px' }}>{a.roll_number}</td>
                      <td style={{ padding: '6px 12px' }}>{a.hostel}</td>
                      <td style={{ padding: '6px 12px' }}>{a.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Hostel Grid */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', fontWeight: '600' }}>Hostel Occupancy status</h2>
      <div className="hostel-grid" style={{ marginBottom: '30px' }}>
        {hostels.map((hostel) => {
          const totalBeds = hostel.total_beds;
          const occupiedBeds = totalBeds - hostel.available_beds;
          const pct = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
          
          return (
            <div key={hostel.id} className="hostel-card">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>{hostel.name}</h3>
                  <span className={`hostel-tag ${hostel.gender_type.toLowerCase()}`}>
                    {hostel.gender_type}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', minHeight: '36px' }}>
                  {hostel.description}
                </p>
              </div>
              <div>
                <div className="hostel-detail-row">
                  <span style={{ color: 'var(--text-secondary)' }}>Beds Occupied:</span>
                  <span style={{ fontWeight: '600' }}>{occupiedBeds} / {totalBeds}</span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className={`progress-bar ${pct > 90 ? 'danger' : pct > 75 ? 'warning' : ''}`} 
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="hostel-detail-row" style={{ fontSize: '0.8rem' }}>
                  <span>Rooms: {hostel.rooms.length}</span>
                  <span style={{ color: 'var(--emerald)', fontWeight: '600' }}>{hostel.available_beds} beds free</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Rooms List */}
      <div className="panel">
        <div className="panel-header">
          <h2>Detailed Rooms Occupancy</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--secondary-bg)' }}>
                <th style={{ padding: '12px' }}>Hostel</th>
                <th style={{ padding: '12px' }}>Room Number</th>
                <th style={{ padding: '12px' }}>Capacity</th>
                <th style={{ padding: '12px' }}>Current Occupancy</th>
                <th style={{ padding: '12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{room.hostel_name}</td>
                  <td style={{ padding: '12px' }}>{room.room_number}</td>
                  <td style={{ padding: '12px' }}>{room.capacity}</td>
                  <td style={{ padding: '12px' }}>{room.occupancy}</td>
                  <td style={{ padding: '12px' }}>
                    {room.is_full ? (
                      <span className="status-pill rejected" style={{ fontSize: '0.7rem' }}>Full</span>
                    ) : (
                      <span className="status-pill resolved" style={{ fontSize: '0.7rem' }}>{room.capacity - room.occupancy} available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RoomAllocation;
