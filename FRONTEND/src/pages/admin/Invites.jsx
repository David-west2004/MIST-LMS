import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Send, CheckCircle, Clipboard, AlertCircle } from 'lucide-react';

const Invites = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [unit, setUnit] = useState('');
  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await api.getCurricula();
        const dbUnits = res.data.curricula.map(c => c.unit);
        setUnits(dbUnits);
        if (dbUnits.length > 0) {
          setUnit(dbUnits[0]);
        }
      } catch (err) {
        setError('Failed to fetch departments/units. Please check backend connection.');
      } finally {
        setLoadingUnits(false);
      }
    };
    fetchUnits();
  }, []);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!unit) {
      setError('Please select a valid department/unit.');
      return;
    }
    setError('');
    setSuccessData(null);
    setLoading(true);

    try {
      const res = await api.inviteStudent(name, email, unit);
      setSuccessData(res.data);
      setName('');
      setEmail('');
    } catch (err) {
      setError(err.message || 'Failed to send invitation.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!successData) return;
    navigator.clipboard.writeText(successData.inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-slide-in" style={styles.container}>
      <div className="glass-card" style={styles.formCard}>
        <h3 style={styles.title}>Invite New IT Intern</h3>
        <p style={styles.subtitle}>Send a registration invitation link valid for 48 hours.</p>

        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSendInvite}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              className="form-control"
              placeholder="e.g. Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="e.g. jane.doe@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="unit">Assigned Department / Unit</label>
            {loadingUnits ? (
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', padding: '10px 0' }}>Loading departments...</div>
            ) : units.length === 0 ? (
              <div style={{ fontSize: '0.875rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 0' }}>
                <AlertCircle size={16} />
                No departments available. Create one first on the Curriculums page!
              </div>
            ) : (
              <select
                id="unit"
                className="form-control"
                style={styles.select}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
              >
                {units.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={styles.btn} 
            disabled={loading || units.length === 0}
          >
            <Send size={16} />
            {loading ? 'Sending invitation...' : 'Generate Invitation'}
          </button>
        </form>
      </div>

      {/* Local testing helper */}
      {successData && (
        <div className="glass-card animate-slide-in" style={styles.successCard}>
          <div style={styles.successHeader}>
            <CheckCircle size={24} style={{ color: 'var(--color-success)' }} />
            <h4 style={styles.successTitle}>Invitation Link Generated!</h4>
          </div>
          
          <p style={styles.successText}>
            For local testing and verification, copy the generated invite link below. In production, this link is emailed automatically.
          </p>

          <div style={styles.linkDisplay}>
            <input
              type="text"
              readOnly
              className="form-control"
              style={styles.linkInput}
              value={successData.inviteLink}
            />
            <button onClick={handleCopyToClipboard} className="btn btn-secondary" style={styles.copyBtn}>
              <Clipboard size={16} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '560px',
  },
  formCard: {
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'var(--font-display)',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginBottom: '24px',
    marginTop: '4px',
  },
  select: {
    cursor: 'pointer',
  },
  btn: {
    width: '100%',
    height: '42px',
    marginTop: '10px',
  },
  successCard: {
    border: '1px solid rgba(16, 185, 129, 0.2)',
    backgroundColor: 'rgba(16, 185, 129, 0.02)',
  },
  successHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '10px',
  },
  successTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  successText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    marginBottom: '16px',
  },
  linkDisplay: {
    display: 'flex',
    gap: '10px',
  },
  linkInput: {
    flex: 1,
    backgroundColor: 'var(--bg-primary)',
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
    textOverflow: 'ellipsis',
  },
  copyBtn: {
    height: '40px',
    padding: '0 16px',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'var(--color-danger-light)',
    color: 'var(--color-danger)',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    marginBottom: '20px',
    border: '1px solid rgba(239, 68, 68, 0.2)',
  }
};

export default Invites;
