import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { CheckCircle, AlertCircle, Key, User, ShieldCheck } from 'lucide-react';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import { validatePasswordCriteria } from '../utils/passwordValidator';
import mistLogo from '../assets/MIST.webp';

const Register = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setError('No registration token provided. Please check your invitation email.');
        setLoading(false);
        return;
      }
      try {
        const res = await api.verifyInviteToken(token);
        setStudentInfo(res.data);
      } catch (err) {
        setError(err.message || 'Invitation link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };
    checkToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const criteria = validatePasswordCriteria(password);
    if (!criteria.isValid) {
      setError('Password does not meet all required complexity criteria. Please check the rules below.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.completeRegistration(token, password);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/student/curriculum');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div className="glass-card animate-slide-in" style={styles.card}>
        <div style={styles.header}>
          <img 
            src={mistLogo} 
            alt="MIST Logo" 
            style={{ height: '72px', width: 'auto', margin: '0 auto 16px', display: 'block', objectFit: 'contain' }} 
          />
          <h1 style={styles.title}>Create Password</h1>
          <p style={styles.subtitle}>Complete your IT intern profile registration</p>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {studentInfo ? (
          <form onSubmit={handleSubmit}>
            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <User size={16} style={styles.infoIcon} />
                <div>
                  <span style={styles.infoLabel}>Name: </span>
                  <span style={styles.infoValue}>{studentInfo.name}</span>
                </div>
              </div>
              <div style={styles.infoRow}>
                <ShieldCheck size={16} style={styles.infoIcon} />
                <div>
                  <span style={styles.infoLabel}>Assigned Unit: </span>
                  <span style={styles.infoValue}>{studentInfo.unit}</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">New Password</label>
              <div style={styles.inputContainer}>
                <Key size={18} style={styles.inputIcon} />
                <input
                  id="password"
                  type="password"
                  className="form-control"
                  style={styles.input}
                  placeholder="Min. 8 chars with Aa, 1, & symbols"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <PasswordStrengthIndicator password={password} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <div style={styles.inputContainer}>
                <Key size={18} style={styles.inputIcon} />
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-control"
                  style={styles.input}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={styles.submitBtn}
              disabled={submitting}
            >
              {submitting ? 'Registering...' : (
                <>
                  <CheckCircle size={18} />
                  Complete Registration
                </>
              )}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/login')}>
              Go to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#F7FAFC',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
    padding: '36px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#1A365D',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#4A5568',
  },
  infoBox: {
    backgroundColor: '#F7FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  infoIcon: {
    color: 'var(--color-primary)',
  },
  infoLabel: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
  },
  infoValue: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1A365D',
  },
  inputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: 'var(--text-muted)',
  },
  input: {
    paddingLeft: '44px',
  },
  submitBtn: {
    width: '100%',
    marginTop: '10px',
    height: '46px',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'var(--color-danger-light)',
    color: 'var(--color-danger)',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    marginBottom: '24px',
    fontSize: '0.875rem',
    border: '1px solid var(--color-danger-border)',
  }
};

export default Register;
