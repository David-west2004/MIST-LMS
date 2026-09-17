import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut } from 'lucide-react';

const Blocked = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <div className="glass-card animate-slide-in" style={styles.card}>
        <div style={styles.iconContainer}>
          <ShieldAlert size={64} style={styles.icon} />
        </div>
        
        <h1 style={styles.title}>Access Suspended</h1>
        <p style={styles.message}>
          Your student account has been blocked or suspended by the MIST Administrator for non-performance or security compliance guidelines.
        </p>

        <div style={styles.instructions}>
          <h2 style={styles.instructionTitle}>How to resolve this:</h2>
          <ul style={styles.list}>
            <li>Contact your department / unit supervisor at Alausa Secretariat.</li>
            <li>Verify you have submitted your daily/weekly training logs.</li>
            <li>Ensure compliance with Ministry workspace guidelines.</li>
          </ul>
        </div>

        <button onClick={handleLogout} className="btn btn-secondary" style={styles.btn}>
          <LogOut size={18} />
          Return to Sign In
        </button>
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
    background: 'radial-gradient(circle at top, var(--color-danger-light) 0%, var(--bg-primary) 100%)',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    border: '1px solid var(--color-danger-border)',
    textAlign: 'center',
  },
  iconContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-danger-light)',
    padding: '16px',
    borderRadius: '50%',
    marginBottom: '24px',
    border: '1px solid var(--color-danger-border)',
  },
  icon: {
    color: 'var(--color-danger)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem',
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: '12px',
  },
  message: {
    color: 'var(--text-secondary)',
    fontSize: '0.975rem',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  instructions: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '20px',
    textAlign: 'left',
    marginBottom: '24px',
  },
  instructionTitle: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '10px',
  },
  list: {
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    lineHeight: '1.5',
    paddingLeft: '20px',
  },
  btn: {
    width: '100%',
    height: '44px',
  }
};

export default Blocked;
