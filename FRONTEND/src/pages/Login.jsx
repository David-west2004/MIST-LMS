import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { LogIn, Key, Mail, AlertCircle } from 'lucide-react';
import mistLogo from '../assets/MIST.webp';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login(email, password);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      if (res.data.user.role === 'admin') {
        navigate('/admin/students');
      } else {
        navigate('/student/curriculum');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass-card animate-slide-in" style={styles.card}>
        <div style={styles.header}>
          <img 
            src={mistLogo} 
            alt="Lagos State Ministry of Innovation, Science and Technology" 
            style={{ height: '76px', width: 'auto', margin: '0 auto 16px', display: 'block', objectFit: 'contain' }} 
          />
          <h1 style={styles.title}>Student IT Portal</h1>
          <p style={styles.subtitle}>Lagos State Ministry of Innovation, Science and Technology</p>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={styles.inputContainer}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                id="email"
                type="email"
                className="form-control"
                style={styles.input}
                placeholder="name@mist.gov.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={styles.inputContainer}>
              <Key size={18} style={styles.inputIcon} />
              <input
                id="password"
                type="password"
                className="form-control"
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Logging in...' : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>
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
    maxWidth: '420px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
    padding: '36px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
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
    lineHeight: '1.4',
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

export default Login;
