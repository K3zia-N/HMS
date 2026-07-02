import React, { useState, useEffect } from 'react';
import { PlusCircle, Clock, Check, X } from 'lucide-react';
import api from '../api';

function GatePasses({ user }) {
  const [passes, setPasses] = useState([]);
  
  // Student form state
  const [reason, setReason] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [passType, setPassType] = useState('TEMPORARY');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchPasses();
  }, [user]);

  const fetchPasses = async () => {
    setLoading(true);
    try {
      const response = await api.get('gatepasses/');
      setPasses(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Student request pass
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const payload = {
        reason,
        departure_time: departureTime,
        pass_type: passType
      };
      if (passType === 'TEMPORARY' && returnTime) {
        payload.return_time = returnTime;
      }

      const response = await api.post('gatepasses/', payload);
      setPasses([response.data, ...passes]);
      setReason('');
      setDepartureTime('');
      setReturnTime('');
      setSuccessMsg('Gate pass request submitted successfully! Pending admin approval.');
    } catch (err) {
      setErrorMsg('Failed to submit gate pass request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Admin approval/rejection
  const handleAdminAction = async (id, actionVal) => {
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const response = await api.post(`gatepasses/${id}/approve/`, {
        action: actionVal
      });
      setPasses(passes.map(p => p.id === id ? response.data.gate_pass : p));
      setSuccessMsg(`Gate pass successfully ${actionVal.toLowerCase()}!`);
    } catch (err) {
      setErrorMsg('Failed to update gate pass status.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '50px', color: 'var(--text-secondary)' }}>Loading Gate Passes...</div>;
  }

  // --- 1. STUDENT VIEW ---
  if (user?.role === 'STUDENT') {
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Gate Pass Management 🎫</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Generate digital gate passes for outings and permanent checkout clearances.</p>
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
          {/* Request Gate Pass */}
          <div className="panel">
            <div className="panel-header">
              <h2>Request New Pass</h2>
              <PlusCircle size={18} color="var(--emerald)" />
            </div>
            <form onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Pass Type</label>
                <select 
                  className="form-input" 
                  value={passType} 
                  onChange={(e) => setPassType(e.target.value)}
                >
                  <option value="TEMPORARY">Temporary Outing (Weekend / Day Out)</option>
                  <option value="CHECKOUT">Permanent Room / Hostel Checkout</option>
                </select>
              </div>

              <div className="form-group">
                <label>Departure Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  required
                />
              </div>

              {passType === 'TEMPORARY' && (
                <div className="form-group">
                  <label>Estimated Return Date & Time</label>
                  <input 
                    type="datetime-local" 
                    className="form-input" 
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Reason for Outing / Checkout</label>
                <textarea 
                  className="form-input" 
                  placeholder="Provide brief details..." 
                  rows="3" 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button type="submit" className="btn-primary btn-emerald" disabled={submitting} style={{ alignSelf: 'flex-start', padding: '10px 24px' }}>
                {submitting ? 'Submitting...' : 'Request Pass'}
              </button>
            </form>
          </div>

          {/* Passes List & Visual Tickets */}
          <div className="panel">
            <div className="panel-header">
              <h2>My Passes</h2>
            </div>
            {passes.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem', padding: '30px' }}>No passes requested yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
                {passes.map(p => (
                  <div key={p.id} className={`gatepass-card ${p.status === 'APPROVED' ? 'approved' : ''}`}>
                    <div className={`gatepass-header ${p.status === 'APPROVED' ? 'approved' : ''}`}>
                      <h3>E-GATE PASS</h3>
                      <span className="status-pill" style={{ display: 'inline-block', marginTop: '4px', backgroundColor: p.status === 'APPROVED' ? 'var(--emerald-light)' : p.status === 'PENDING' ? '#FFF8E1' : '#FBEFF2', color: p.status === 'APPROVED' ? 'var(--emerald)' : p.status === 'PENDING' ? '#B78103' : '#580F22' }}>
                        {p.status}
                      </span>
                    </div>

                    <div className="gatepass-body">
                      <div className="gatepass-info">
                        <div className="gatepass-field">
                          <label>Student Name</label>
                          <p>{p.student_name}</p>
                        </div>
                        <div className="gatepass-field">
                          <label>Roll & Room</label>
                          <p>{p.student_roll} | Room {p.room_number}</p>
                        </div>
                        <div className="gatepass-field">
                          <label>Pass Type</label>
                          <p>{p.pass_type === 'TEMPORARY' ? 'Temporary Outing' : 'Permanent Checkout'}</p>
                        </div>
                        <div className="gatepass-field">
                          <label>Departure</label>
                          <p style={{ fontSize: '0.8rem' }}>{new Date(p.departure_time).toLocaleString()}</p>
                        </div>
                        {p.pass_type === 'TEMPORARY' && p.return_time && (
                          <div className="gatepass-field">
                            <label>Return</label>
                            <p style={{ fontSize: '0.8rem' }}>{new Date(p.return_time).toLocaleString()}</p>
                          </div>
                        )}
                        <div className="gatepass-field">
                          <label>Reason</label>
                          <p style={{ fontWeight: 'normal', fontSize: '0.85rem' }}>{p.reason}</p>
                        </div>
                      </div>

                      <div className="gatepass-qr-side">
                        {p.status === 'APPROVED' ? (
                          <div className="qr-code-placeholder" title={p.qr_code_data}>
                            {/* Visual QR Code Mockup in CSS */}
                            <div className="qr-bars">
                              <div className="qr-bar" style={{ gridColumn: 'span 2' }}></div>
                              <div className="qr-bar" style={{ gridColumn: 'span 1' }}></div>
                              <div className="qr-bar" style={{ gridColumn: 'span 3' }}></div>
                              <div className="qr-bar" style={{ gridColumn: 'span 1' }}></div>
                              <div className="qr-bar" style={{ gridColumn: 'span 2' }}></div>
                              <div className="qr-bar" style={{ gridColumn: 'span 3' }}></div>
                              <div className="qr-bar" style={{ gridColumn: 'span 1' }}></div>
                              <div className="qr-bar" style={{ gridColumn: 'span 2' }}></div>
                              <div className="qr-bar" style={{ gridColumn: 'span 1' }}></div>
                              <div className="qr-bar" style={{ gridColumn: 'span 3' }}></div>
                              <div className="qr-bar" style={{ gridColumn: 'span 2' }}></div>
                              <div className="qr-bar" style={{ gridColumn: 'span 2' }}></div>
                              <div className="qr-bar" style={{ gridColumn: 'span 1' }}></div>
                              <div className="qr-bar" style={{ gridColumn: 'span 3' }}></div>
                              <div className="qr-bar" style={{ gridColumn: 'span 2' }}></div>
                            </div>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 'bold' }}>SCAN PASS</span>
                          </div>
                        ) : (
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textAlign: 'center', opacity: '0.7' }}>
                            <Clock size={32} style={{ marginBottom: '6px' }} />
                            QR code locks until approved
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Ref: {p.qr_code_data}</span>
                      <span>Approved: {p.approved_by_name}</span>
                    </div>
                  </div>
                ))}
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
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Gate Pass Clearance Portal 🎫</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Review and approve student day outings and room checkout clearances.</p>
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

      <div className="panel">
        <div className="panel-header">
          <h2>Active Gate Pass Requests</h2>
        </div>
        {passes.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px' }}>No gate pass requests in system.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--secondary-bg)' }}>
                  <th style={{ padding: '12px' }}>Student</th>
                  <th style={{ padding: '12px' }}>Roll / Room</th>
                  <th style={{ padding: '12px' }}>Pass Type</th>
                  <th style={{ padding: '12px' }}>Departure Time</th>
                  <th style={{ padding: '12px' }}>Reason</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {passes.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px', fontWeight: '600' }}>{p.student_name}</td>
                    <td style={{ padding: '12px' }}>{p.student_roll} | Room {p.room_number}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontWeight: '500', color: p.pass_type === 'CHECKOUT' ? 'var(--burgundy)' : 'var(--text-primary)' }}>
                        {p.pass_type === 'CHECKOUT' ? 'Permanent Checkout' : 'Outing'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{new Date(p.departure_time).toLocaleString()}</td>
                    <td style={{ padding: '12px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.reason}>{p.reason}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`status-pill ${p.status.toLowerCase()}`}>{p.status}</span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {p.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            onClick={() => handleAdminAction(p.id, 'APPROVED')} 
                            className="btn-primary btn-emerald"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Approve"
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button 
                            onClick={() => handleAdminAction(p.id, 'REJECTED')} 
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Reject"
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Cleared by {p.approved_by_name}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        
              )}</div>
              
    </div>
  );
}

export default GatePasses;
