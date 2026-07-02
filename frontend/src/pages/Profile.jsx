import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Award, BookOpen, Heart, CheckCircle2 } from 'lucide-react';
import api from '../api';

function Profile({ user, onProfileUpdate }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [course, setCourse] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [gender, setGender] = useState('MALE');
  
  const [roomInfo, setRoomInfo] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('profile/');
      const u = response.data;
      
      setFirstName(u.first_name || '');
      setLastName(u.last_name || '');
      setEmail(u.email || '');
      
      if (u.role === 'STUDENT' && u.profile) {
        setPhoneNumber(u.profile.phone_number || '');
        setCourse(u.profile.course || '');
        setEmergencyContact(u.profile.emergency_contact || '');
        setGender(u.profile.gender || 'MALE');
        
        if (u.profile.is_allocated) {
          setRoomInfo({
            roomNumber: u.profile.room_number,
            hostelName: u.profile.hostel_name
          });
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email: email,
      };

      if (user.role === 'STUDENT') {
        payload.phone_number = phoneNumber;
        payload.course = course;
        payload.emergency_contact = emergencyContact;
        payload.gender = gender;
      }

      const response = await api.put('profile/', payload);
      
      // Update App.jsx root user state
      onProfileUpdate({
        ...user,
        first_name: response.data.first_name,
        last_name: response.data.last_name,
        email: response.data.email
      });

      setSuccess('Profile updated successfully!');
      
      // Refresh local view
      fetchProfile();
    } catch (err) {
      setError('Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '50px', color: 'var(--text-secondary)' }}>Loading Profile...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Manage Profile 👤</h2>
        <p style={{ color: 'var(--text-secondary)' }}>View and keep your contact details up to date.</p>
      </div>

      {success && (
        <div style={{ backgroundColor: '#EBF7F0', border: '1px solid #0A5C36', color: '#0A5C36', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '16px' }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ backgroundColor: '#FBEFF2', border: '1px solid #580F22', color: '#580F22', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <div className="panel" style={{ marginBottom: '30px' }}>
        <div className="panel-header">
          <h2>Account Details</h2>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '12px', backgroundColor: user.role === 'STUDENT' ? 'var(--emerald-light)' : 'var(--burgundy-light)', color: user.role === 'STUDENT' ? 'var(--emerald)' : 'var(--burgundy)' }}>
            {user.role}
          </span>
        </div>

        <form onSubmit={handleUpdate} className="panel-form">
          <div className="form-group">
            <label>First Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {user.role === 'STUDENT' ? (
            <>
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  className="form-input" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Course / Major</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select 
                  className="form-input" 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="form-group full-width">
                <label>Emergency Contact Phone (Parent/Guardian)</label>
                <input 
                  type="tel" 
                  className="form-input" 
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  required
                />
              </div>
            </>
          ) : null}

          <div className="form-group full-width" style={{ marginTop: '16px' }}>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ alignSelf: 'flex-start', padding: '10px 24px' }}>
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {user.role === 'STUDENT' && (
        <div className="panel" style={{ background: 'radial-gradient(circle at 100% 0%, var(--secondary-bg) 0%, var(--card-bg) 100%)' }}>
          <div className="panel-header">
            <h2>Current Hostel Placement</h2>
          </div>
          {roomInfo ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="metric-icon-wrapper emerald" style={{ width: '40px', height: '40px' }}>
                  <Award size={18} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Hostel Residence</label>
                  <span style={{ fontWeight: '700', fontSize: '1.05rem' }}>{roomInfo.hostelName}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="metric-icon-wrapper emerald" style={{ width: '40px', height: '40px' }}>
                  <BookOpen size={18} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Room Allocation</label>
                  <span style={{ fontWeight: '700', fontSize: '1.05rem' }}>Room {roomInfo.roomNumber}</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>You have not been assigned a hostel room yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Profile;
