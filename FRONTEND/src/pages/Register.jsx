import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { CheckCircle, AlertCircle, Key, User, ShieldCheck } from 'lucide-react';

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

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
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
          <div style={styles.logoBadge}>MIST Registration</div>
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
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
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
    background: 'radial-gradient(circle at top, #111827 0%, #0b0f19 100%)',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  logoBadge: {
    display: 'inline-block',
    backgroundColor: 'var(--color-success-light)',
    color: 'var(--color-success)',
    fontWeight: '700',
    padding: '4px 12px',
    borderRadius: '8px',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '12px',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
  },
  infoBox: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
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
    color: '#ffffff',
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
    border: '1px solid rgba(239, 68, 68, 0.2)',
  }
};

export default Register;
