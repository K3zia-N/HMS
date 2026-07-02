import React, { useState, useEffect } from 'react';
import { Wrench, PlusCircle, Clock, CheckCircle2, ChevronRight, MessageSquare, AlertCircle } from 'lucide-react';
import api from '../api';

function Complaints({ user }) {
  const [complaints, setComplaints] = useState([]);
  
  // Student submission form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('OTHER');
  const [description, setDescription] = useState('');
  
  // Admin update state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('PENDING');
  const [adminRemarks, setAdminRemarks] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, [user]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await api.get('complaints/');
      setComplaints(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Student submit complaint
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const response = await api.post('complaints/', {
        title,
        category,
        description
      });
      setComplaints([response.data, ...complaints]);
      setTitle('');
      setDescription('');
      setSuccessMsg('Complaint submitted successfully! You can track its status below.');
    } catch (err) {
      setErrorMsg('Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  // Admin select complaint to update
  const handleAdminSelect = (c) => {
    setSelectedComplaint(c);
    setUpdateStatus(c.status);
    setAdminRemarks(c.admin_remarks || '');
    setSuccessMsg('');
    setErrorMsg('');
  };

  // Admin update complaint
  const handleAdminUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const response = await api.post(`complaints/${selectedComplaint.id}/update-status/`, {
        status: updateStatus,
        admin_remarks: adminRemarks
      });
      
      // Update list
      setComplaints(complaints.map(c => c.id === selectedComplaint.id ? response.data.complaint : c));
      
      setSuccessMsg('Complaint status updated successfully!');
      setSelectedComplaint(null);
    } catch (err) {
      setErrorMsg('Failed to update complaint status.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for tracking bar math
  const getStatusStep = (statusStr) => {
    if (statusStr === 'PENDING') return 1;
    if (statusStr === 'IN_PROGRESS') return 2;
    if (statusStr === 'RESOLVED') return 3;
    return 1;
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '50px', color: 'var(--text-secondary)' }}>Loading Complaints...</div>;
  }

  // --- 1. STUDENT VIEW ---
  if (user?.role === 'STUDENT') {
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Maintenance complaints & Status Tracker 🔧</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Submit maintenance requests and track resolution progress in real time.</p>
        </div>

        {successMsg && (
          <div style={{ backgroundColor: '#EBF7F0', border: '1px solid #0A5C36', color: '#0A5C36', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '16px' }}>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ backgroundColor: '#FBEFF2', border: '1px solid #580F22', color: '#580F22', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '16px' }}>
            {errorMsg}
          </div>
        )}

        <div className="dashboard-panels">
          {/* File a Complaint */}
          <div className="panel">
            <div className="panel-header">
              <h2>File a Maintenance Request</h2>
              <PlusCircle size={18} color="var(--emerald)" />
            </div>
            <form onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Issue Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Broken hot water tap in shower" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select 
                  className="form-input" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="ELECTRICAL">Electrical</option>
                  <option value="PLUMBING">Plumbing</option>
                  <option value="CLEANING">Cleaning</option>
                  <option value="OTHER">Other Issues</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description of Issue</label>
                <textarea 
                  className="form-input" 
                  placeholder="Provide details of the room number, specific location, and symptoms..." 
                  rows="4" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>
              <button type="submit" className="btn-primary btn-emerald" disabled={submitting} style={{ alignSelf: 'flex-start', padding: '10px 24px' }}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>

          {/* List and Tracker */}
          <div className="panel">
            <div className="panel-header">
              <h2>My Submitted Requests</h2>
            </div>
            {complaints.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem', padding: '30px' }}>No maintenance requests filed yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {complaints.map(c => {
                  const step = getStatusStep(c.status);
                  const fillPct = step === 1 ? 0 : step === 2 ? 50 : 100;
                  
                  return (
                    <div key={c.id} style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '18px', backgroundColor: 'var(--card-bg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: '700' }}>{c.title}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Category: {c.category.toLowerCase()} | Filed on {new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                        <span className={`status-pill ${c.status.toLowerCase()}`}>{c.status.replace('_', ' ')}</span>
                      </div>
                      
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: '12px 0', lineHeight: '1.4' }}>{c.description}</p>
                      
                      {/* Real-time Status Progress Bar */}
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '12px' }}>
                        <div className="tracker-container">
                          <div className="tracker-line-fill" style={{ width: `${fillPct}%` }} />
                          
                          <div className={`tracker-step ${step >= 1 ? (step === 1 ? 'active' : 'completed') : ''}`}>
                            <div className="tracker-node">1</div>
                            <span className="tracker-label">Pending</span>
                          </div>
                          
                          <div className={`tracker-step ${step >= 2 ? (step === 2 ? 'active' : 'completed') : ''}`}>
                            <div className="tracker-node">2</div>
                            <span className="tracker-label">In Progress</span>
                          </div>
                          
                          <div className={`tracker-step ${step >= 3 ? 'active' : ''}`}>
                            <div className="tracker-node">3</div>
                            <span className="tracker-label">Resolved</span>
                          </div>
                        </div>
                      </div>

                      {c.admin_remarks && (
                        <div style={{ marginTop: '16px', backgroundColor: 'var(--secondary-bg)', padding: '12px', borderRadius: '6px', fontSize: '0.8rem', borderLeft: '3px solid var(--burgundy)' }}>
                          <strong>Admin Feedback:</strong>
                          <p style={{ marginTop: '4px', fontStyle: 'italic' }}>"{c.admin_remarks}"</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- 2. ADMIN VIEW ---
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Maintenance Operations center 🔧</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Review complaints from student blocks and post progress updates.</p>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: '#EBF7F0', border: '1px solid #0A5C36', color: '#0A5C36', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '16px' }}>
          {successMsg}
        </div>
      )}

      <div className="dashboard-panels" style={{ gridTemplateColumns: selectedComplaint ? '1fr 1fr' : '1fr' }}>
        {/* Complaints Listing Panel */}
        <div className="panel">
          <div className="panel-header">
            <h2>Active Maintenance Requests</h2>
          </div>
          {complaints.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px' }}>No maintenance requests in database.</p>
          ) : (
            <div className="custom-list">
              {complaints.map(c => (
                <div 
                  key={c.id} 
                  className="list-item" 
                  onClick={() => handleAdminSelect(c)} 
                  style={{ cursor: 'pointer', borderLeft: selectedComplaint?.id === c.id ? '4px solid var(--burgundy)' : '1px solid var(--border-color)' }}
                >
                  <div className="list-item-main">
                    <span className="list-item-title">{c.title}</span>
                    <span className="list-item-subtitle">
                      Student: {c.student_name} ({c.student_roll}) | Room: {c.room_number}
                    </span>
                    <span className="list-item-subtitle" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                      Category: {c.category} | Date: {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`status-pill ${c.status.toLowerCase()}`}>{c.status.replace('_', ' ')}</span>
                    <ChevronRight size={18} color="var(--text-secondary)" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin Detail/Update Panel */}
        {selectedComplaint && (
          <div className="panel">
            <div className="panel-header">
              <h2>Resolve Maintenance Request</h2>
              <button 
                onClick={() => setSelectedComplaint(null)} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)' }}
              >
                Close
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>{selectedComplaint.title}</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Filed by: <strong>{selectedComplaint.student_name}</strong> | Room: <strong>{selectedComplaint.room_number}</strong>
              </p>
              <div style={{ backgroundColor: 'var(--secondary-bg)', padding: '14px', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid var(--border-color)', lineHeight: '1.4' }}>
                {selectedComplaint.description}
              </div>
            </div>

            <form onSubmit={handleAdminUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <div className="form-group">
                <label>Update Status</label>
                <select 
                  className="form-input" 
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                >
                  <option value="PENDING">Pending (Received)</option>
                  <option value="IN_PROGRESS">In Progress (Assigned)</option>
                  <option value="RESOLVED">Resolved (Completed)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Admin Remarks / Resolution Details</label>
                <textarea 
                  className="form-input" 
                  rows="4" 
                  placeholder="e.g. Electrician has replaced the heating element. Issue resolved."
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Updating...' : 'Post Status Update'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default Complaints;
