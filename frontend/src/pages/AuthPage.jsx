import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Phone, FileText, ShieldAlert } from 'lucide-react';
import api from '../api';

function AuthPage({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('STUDENT'); // STUDENT or ADMIN
  
  // Form fields state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Student Profile specific fields
  const [rollNumber, setRollNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('MALE');
  const [course, setCourse] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setError('');
    setSuccess('');
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login API Call
        const response = await api.post('auth/login/', {
          username: username,
          password: password,
        });

        // Store JWT token and user info
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Trigger App.jsx state binding
        onAuthSuccess(response.data.user);
        
        // Go to dashboard
        navigate('/dashboard');
      } else {
        // Signup payload assembly
        const payload = {
          username,
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          role,
        };

        if (role === 'STUDENT') {
          payload.roll_number = rollNumber;
          payload.phone_number = phoneNumber;
          payload.gender = gender;
          payload.course = course;
          payload.emergency_contact = emergencyContact;
        }

        // Registration API Call
        await api.post('auth/register/', payload);

        setSuccess('Registration successful! Please sign in with your credentials.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        // Handle validation errors returned by Django
        const errors = err.response.data;
        if (typeof errors === 'object') {
          const firstKey = Object.keys(errors)[0];
          const val = errors[firstKey];
          setError(`${firstKey}: ${Array.isArray(val) ? val[0] : val}`);
        } else {
          setError(errors.error || 'Authentication failed. Please verify your fields.');
        }
      } else {
        setError('Connection error. Is the server running?');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Forms Side */}
        <div className="auth-form-side">
          <div className="auth-header">
            <h2>{isLogin ? 'Welcome Back! ' : 'Create Account'}</h2>
            <p>
              {isLogin
                ? 'Sign in to start managing your profile.'
                : 'Fill in your details below to register on the hostel portal.'}
            </p>
          </div>

          {/* Role Tabs Selector */}
          <div className="role-tabs">
            <button
              type="button"
              className={`role-tab ${role === 'STUDENT' ? 'active' : ''}`}
              onClick={() => handleRoleChange('STUDENT')}
            >
              Student Portal
            </button>
            <button
              type="button"
              className={`role-tab ${role === 'ADMIN' ? 'active' : ''}`}
              onClick={() => handleRoleChange('ADMIN')}
            >
              Admin Portal
            </button>
          </div>

          {/* Error and Success Notifications */}
          {error && (
            <div style={{ backgroundColor: '#FBEFF2', border: '1px solid #580F22', color: '#580F22', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div style={{ backgroundColor: '#EBF7F0', border: '1px solid #0A5C36', color: '#0A5C36', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Common fields */}
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. jdoe123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {!isLogin && (
              <>
                <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="John"
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
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="john.doe@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Student specific fields (Only shown during Sign Up for Students) */}
            {!isLogin && role === 'STUDENT' && (
              <>
                <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Registration Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. CS/MK/****/**/**"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
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
                </div>

                <div className="form-group">
                  <label>Course</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Computer Science"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    required
                  />
                </div>

                <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+254 741936677"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Emergency Contact Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Parent/Guardian phone"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {isLogin && <div className="forgot-password">Forgot Password?</div>}

            <button
              type="submit"
              disabled={loading}
              className={`btn-primary ${role === 'STUDENT' ? 'btn-emerald' : ''}`}
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          {/* Social Sign-In (Visual Placeholder matching picture 1) */}
          {isLogin && (
            <>
              <div className="auth-divider">Or sign in with</div>
              <div className="social-buttons">
                <button type="button" className="btn-social">
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="16" height="16" />
                  Google
                </button>
              </div>
            </>
          )}

          <div className="auth-footer">
            {isLogin ? (
              <>
                Don't have an account?{' '}
                <span onClick={handleToggleMode}>Sign up now</span>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <span onClick={handleToggleMode}>Sign in now</span>
              </>
            )}
          </div>

          <p className="auth-copyright">© {new Date().getFullYear()} ALL RIGHTS RESERVED</p>
        </div>

        {/* Artwork Panel (Still Life Painting) */}
        <div className="auth-image-side">
          <img
            src="/bed.png"
            alt="Dutch Golden Age Still Life Painting"
            className="auth-painting"
          />
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
