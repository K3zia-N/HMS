import React, { useState, useEffect } from 'react';
import { Home, Key, Layers, Users, CheckCircle2, AlertTriangle, Shuffle, Building2, BedDouble, DoorOpen, Sparkles } from 'lucide-react';
import api from '../api';

function RoomAllocation({ user }) {
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [profile, setProfile] = useState(null);

  const [selectedHostel, setSelectedHostel] = useState('');
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
      const hostelsRes = await api.get('hostels/');
      setHostels(hostelsRes.data);

      const roomsRes = await api.get('rooms/');
      setRooms(roomsRes.data);

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

  const handleBulkAllocation = async () => {
    setAllocating(true);
    setErrorMsg('');
    setSuccessMsg('');
    setBulkResult(null);
    try {
      const response = await api.post('allocation/allocate/');
      setBulkResult(response.data);
      setSuccessMsg(response.data.message);
      await fetchData();
    } catch (err) {
      setErrorMsg('Bulk allocation process failed.');
    } finally {
      setAllocating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: 'var(--text-secondary)', gap: '12px' }}>
        <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--emerald)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span>Loading Room Allocation...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Derived stats (used in both views, but especially admin)
  const totalBeds = hostels.reduce((sum, h) => sum + h.total_beds, 0);
  const totalAvailable = hostels.reduce((sum, h) => sum + h.available_beds, 0);
  const totalOccupied = totalBeds - totalAvailable;
  const occupancyPct = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0;

  // --- 1. STUDENT VIEW ---
  if (user?.role === 'STUDENT') {
    return (
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '8px 0 40px' }}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.9rem', fontWeight: '700', marginBottom: '8px' }}>Room Allocation Portal 🔑</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Manage your residency and apply for hostel rooms.</p>
        </div>

        {successMsg && (
          <div style={{ backgroundColor: '#EBF7F0', border: '1px solid #0A5C36', color: '#0A5C36', padding: '14px 18px', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <CheckCircle2 size={20} />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div style={{ backgroundColor: '#FBEFF2', border: '1px solid #580F22', color: '#580F22', padding: '14px 18px', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <AlertTriangle size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        {profile?.is_allocated ? (
          <div className="panel" style={{ padding: '36px', borderRadius: '18px', background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--secondary-bg) 100%)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Key size={28} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.3rem', margin: 0 }}>My Accommodation</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Room secured for this term</span>
              </div>
              <span className="status-pill approved" style={{ padding: '6px 14px' }}>Allocated</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '8px' }}>
              <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '6px' }}>Hostel Residence</div>
                <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{profile.hostel_name}</div>
              </div>
              <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '6px' }}>Room Number</div>
                <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{profile.room_number}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', padding: '12px 16px', backgroundColor: 'var(--secondary-bg)', borderRadius: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--emerald)' }} />
              <span style={{ fontWeight: '600', color: 'var(--emerald)', fontSize: '0.9rem' }}>Active Occupant</span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '24px', textAlign: 'center', fontStyle: 'italic' }}>
              For room changes or checks, please contact the hostel admin block.
            </p>
          </div>
        ) : (
          <div className="panel" style={{ padding: '36px', borderRadius: '18px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--burgundy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <DoorOpen size={28} color="#fff" />
              </div>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Request a Room</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '28px', lineHeight: '1.6' }}>
              The system will automatically allocate you a room that matches your gender profile.
              You can optionally select a preferred hostel below.
            </p>
            <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>Preferred Hostel (Optional)</label>
                <select
                  className="form-input"
                  style={{ padding: '12px 14px', borderRadius: '10px', width: '100%' }}
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
                style={{ marginTop: '8px', padding: '14px', borderRadius: '10px', fontSize: '1rem' }}
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
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.9rem', fontWeight: '700', marginBottom: '6px' }}>Hostel Resourcing & Allocation 🏢</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Review occupancy rates and trigger automated room placements.</p>
        </div>
        <button
          onClick={handleBulkAllocation}
          disabled={allocating}
          className="btn-primary btn-emerald"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 26px', borderRadius: '10px', fontSize: '0.95rem', whiteSpace: 'nowrap' }}
        >
          <Shuffle size={18} />
          {allocating ? 'Allocating...' : 'Run Auto-Allocation Rules'}
        </button>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: '#FBEFF2', border: '1px solid #580F22', color: '#580F22', padding: '14px 18px', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <AlertTriangle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Quick stats overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <StatCard icon={<Building2 size={22} />} label="Hostels" value={hostels.length} accent="var(--burgundy)" />
        <StatCard icon={<BedDouble size={22} />} label="Total Beds" value={totalBeds} accent="var(--emerald)" />
        <StatCard icon={<Users size={22} />} label="Occupied" value={`${totalOccupied} (${occupancyPct}%)`} accent="var(--burgundy)" />
        <StatCard icon={<Sparkles size={22} />} label="Beds Free" value={totalAvailable} accent="var(--emerald)" />
      </div>

      {successMsg && (
        <div style={{ backgroundColor: '#EBF7F0', border: '1px solid #0A5C36', color: '#0A5C36', padding: '14px 18px', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <CheckCircle2 size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {bulkResult && (
        <div className="panel" style={{ marginBottom: '32px', padding: '28px', borderRadius: '16px', borderLeft: '5px solid var(--emerald)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '14px' }}>Bulk Allocation Summary</h3>
          <p style={{ fontSize: '0.92rem', marginBottom: bulkResult.allocations.length > 0 ? '18px' : 0 }}>
            Successfully allocated <strong style={{ color: 'var(--emerald)' }}>{bulkResult.success_count}</strong> students.
            Failed to allocate <strong style={{ color: 'var(--burgundy)' }}>{bulkResult.fail_count}</strong> students due to capacity.
          </p>
          {bulkResult.allocations.length > 0 && (
            <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--secondary-bg)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '10px 16px' }}>Student</th>
                    <th style={{ padding: '10px 16px' }}>Roll</th>
                    <th style={{ padding: '10px 16px' }}>Hostel</th>
                    <th style={{ padding: '10px 16px' }}>Room</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkResult.allocations.map((a, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 16px' }}>{a.student}</td>
                      <td style={{ padding: '10px 16px' }}>{a.roll_number}</td>
                      <td style={{ padding: '10px 16px' }}>{a.hostel}</td>
                      <td style={{ padding: '10px 16px' }}>{a.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Hostel Grid */}
      <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', fontWeight: '700' }}>Hostel Occupancy Status</h2>
      <div className="hostel-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {hostels.map((hostel) => {
          const total = hostel.total_beds;
          const occupied = total - hostel.available_beds;
          const pct = total > 0 ? (occupied / total) * 100 : 0;
          const genderColor = hostel.gender_type === 'MALE' ? 'var(--emerald)' : hostel.gender_type === 'FEMALE' ? 'var(--burgundy)' : '#8a8a6a';

          return (
            <div
              key={hostel.id}
              className="hostel-card"
              style={{ padding: '24px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: genderColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Building2 size={20} color="#fff" />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>{hostel.name}</h3>
                  </div>
                  <span className={`hostel-tag ${hostel.gender_type.toLowerCase()}`} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.72rem' }}>
                    {hostel.gender_type}
                  </span>
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '20px', minHeight: '40px', lineHeight: '1.5' }}>
                  {hostel.description}
                </p>
              </div>
              <div>
                <div className="hostel-detail-row" style={{ marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Beds Occupied</span>
                  <span style={{ fontWeight: '700' }}>{occupied} / {total}</span>
                </div>
                <div className="progress-bar-container" style={{ height: '8px', borderRadius: '4px', marginBottom: '12px' }}>
                  <div
                    className={`progress-bar ${pct > 90 ? 'danger' : pct > 75 ? 'warning' : ''}`}
                    style={{ width: `${pct}%`, height: '100%', borderRadius: '4px' }}
                  />
                </div>
                <div className="hostel-detail-row" style={{ fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{hostel.rooms.length} rooms</span>
                  <span style={{ color: 'var(--emerald)', fontWeight: '700' }}>{hostel.available_beds} free</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Rooms List */}
      <div className="panel" style={{ borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <div className="panel-header" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.15rem' }}>Detailed Rooms Occupancy</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--secondary-bg)' }}>
                <th style={{ padding: '14px 16px' }}>Hostel</th>
                <th style={{ padding: '14px 16px' }}>Room Number</th>
                <th style={{ padding: '14px 16px' }}>Capacity</th>
                <th style={{ padding: '14px 16px' }}>Current Occupancy</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '500' }}>{room.hostel_name}</td>
                  <td style={{ padding: '14px 16px' }}>{room.room_number}</td>
                  <td style={{ padding: '14px 16px' }}>{room.capacity}</td>
                  <td style={{ padding: '14px 16px' }}>{room.occupancy}</td>
                  <td style={{ padding: '14px 16px' }}>
                    {room.is_full ? (
                      <span className="status-pill rejected" style={{ fontSize: '0.72rem', padding: '4px 10px' }}>Full</span>
                    ) : (
                      <span className="status-pill resolved" style={{ fontSize: '0.72rem', padding: '4px 10px' }}>{room.capacity - room.occupancy} available</span>
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

// Small reusable stat card for the admin overview row
function StatCard({ icon, label, value, accent }) {
  return (
    <div className="panel" style={{ padding: '20px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
      <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{label}</div>
        <div style={{ fontSize: '1.3rem', fontWeight: '700' }}>{value}</div>
      </div>
    </div>
  );
}

export default RoomAllocation;