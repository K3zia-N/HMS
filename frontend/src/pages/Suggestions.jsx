import React, { useState, useEffect } from 'react';
import { MessageSquarePlus, Star, CheckCircle2, Award } from 'lucide-react';
import api from '../api';

function Suggestions({ user }) {
  const [feedbacks, setFeedbacks] = useState([]);
  
  // Student submission form state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5); // Default 5 stars
  const [hoverRating, setHoverRating] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchFeedbacks();
  }, [user]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await api.get('feedback/');
      setFeedbacks(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Student submit feedback
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const response = await api.post('feedback/', {
        subject,
        message,
        rating
      });
      setFeedbacks([response.data, ...feedbacks]);
      setSubject('');
      setMessage('');
      setRating(5);
      setSuccessMsg('Thank you! Your feedback and suggestions have been recorded.');
    } catch (err) {
      setErrorMsg('Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate average rating for admin
  const getAverageRating = () => {
    if (feedbacks.length === 0) return 0;
    const sum = feedbacks.reduce((acc, f) => acc + f.rating, 0);
    return (sum / feedbacks.length).toFixed(1);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '50px', color: 'var(--text-secondary)' }}>Loading Feedback...</div>;
  }

  // --- 1. STUDENT VIEW ---
  if (user?.role === 'STUDENT') {
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Suggestion & Feedback Module 💬</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Help improve hostel services by sharing your comments, ratings, and ideas.</p>
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
          {/* Submit Suggestion */}
          <div className="panel">
            <div className="panel-header">
              <h2>Submit Suggestion</h2>
              <MessageSquarePlus size={18} color="var(--emerald)" />
            </div>
            <form onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Subject / Topic</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Quality of dinners or laundry speed" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              {/* Interactive Rating stars */}
              <div className="form-group">
                <label>Service Rating</label>
                <div className="star-selector">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${star <= (hoverRating || rating) ? 'selected' : ''}`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    >
                      <Star size={28} fill={star <= (hoverRating || rating) ? '#FFB300' : 'none'} strokeWidth={2} />
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  ({rating} out of 5 stars)
                </span>
              </div>

              <div className="form-group">
                <label>Feedback Message / Suggestion</label>
                <textarea 
                  className="form-input" 
                  placeholder="Tell us what we can do better or highlight what is working well..." 
                  rows="4" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button type="submit" className="btn-primary btn-emerald" disabled={submitting} style={{ alignSelf: 'flex-start', padding: '10px 24px' }}>
                {submitting ? 'Submitting...' : 'Post Feedback'}
              </button>
            </form>
          </div>

          {/* Previous Submissions */}
          <div className="panel">
            <div className="panel-header">
              <h2>My Feedback History</h2>
            </div>
            {feedbacks.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem', padding: '30px' }}>No feedback posted yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '450px', overflowY: 'auto' }}>
                {feedbacks.map(f => (
                  <div key={f.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', backgroundColor: 'var(--card-bg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ fontWeight: '700', fontSize: '0.95rem' }}>{f.subject}</h4>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={14} fill={s <= f.rating ? '#FFB300' : 'none'} color={s <= f.rating ? '#FFB300' : 'var(--border-color)'} />
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', lineHeight: '1.4', marginBottom: '8px', color: 'var(--text-primary)' }}>{f.message}</p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Submitted on {new Date(f.created_at).toLocaleDateString()}</span>
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
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Student Feedback Analysis 💬</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Review comments and ratings submitted by residents to evaluate student satisfaction.</p>
      </div>

      {/* Aggregate Rating Stat Card */}
      <div className="metrics-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '360px', marginBottom: '24px' }}>
        <div className="metric-card">
          <div className="metric-icon-wrapper cream">
            <Award size={22} color="#FFB300" />
          </div>
          <div className="metric-details">
            <h3>Average Satisfaction</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <p>{getAverageRating()} / 5.0</p>
              <div style={{ display: 'flex', gap: '1px', alignSelf: 'center' }}>
                {[1, 2, 3, 4, 5].map((s) => {
                  const avg = parseFloat(getAverageRating());
                  return (
                    <Star key={s} size={14} fill={s <= Math.round(avg) ? '#FFB300' : 'none'} color={s <= Math.round(avg) ? '#FFB300' : 'var(--border-color)'} />
                  );
                })}
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Based on {feedbacks.length} submissions</span>
          </div>
        </div>
      </div>

      {/* Feedback List for Admin */}
      <div className="panel">
        <div className="panel-header">
          <h2>All Feedback Submissions</h2>
        </div>
        {feedbacks.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px' }}>No feedbacks recorded in system.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {feedbacks.map((f) => (
              <div key={f.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>{f.subject}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Submitted by: <strong>{f.student_name}</strong> | Date: {new Date(f.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} fill={s <= f.rating ? '#FFB300' : 'none'} color={s <= f.rating ? '#FFB300' : 'var(--border-color)'} />
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: '1.4', marginTop: '8px' }}>
                  {f.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Suggestions;
