import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { useUnits } from '../../hooks/useUnits';
import { Send, CheckCircle, Clipboard, AlertCircle, Calendar, Building, Hash, Phone, Clock } from 'lucide-react';

const DURATION_OPTIONS = [
  { value: '3_months', label: '3 Months (12 Weeks)', weeks: 12 },
  { value: '6_months', label: '6 Months (24 Weeks)', weeks: 24 },
  { value: '1_year', label: '1 Year (52 Weeks)', weeks: 52 }
];

const Invites = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [unit, setUnit] = useState('');
  const { units, loading: loadingUnits, error: unitsError } = useUnits();

  // Default unit when loaded
  useEffect(() => {
    if (!unit && units.length > 0) {
      setUnit(units[0]);
    }
  }, [units, unit]);

  // SIWES Internship Metadata
  const [siwesDuration, setSiwesDuration] = useState('6_months');
  const [siwesStartDate, setSiwesStartDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [institution, setInstitution] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Compute duration weeks and end date
  const selectedDurationMeta = useMemo(() => {
    return DURATION_OPTIONS.find(d => d.value === siwesDuration) || DURATION_OPTIONS[1];
  }, [siwesDuration]);

  const computedEndDate = useMemo(() => {
    if (!siwesStartDate) return '';
    const start = new Date(siwesStartDate);
    if (isNaN(start.getTime())) return '';
    const end = new Date(start.getTime() + (selectedDurationMeta.weeks * 7 * 24 * 60 * 60 * 1000));
    return end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [siwesStartDate, selectedDurationMeta]);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!unit) {
      setError('Please select a valid department/unit.');
      return;
    }
    if (!siwesStartDate) {
      setError('Please provide a valid SIWES start date.');
      return;
    }

    setError('');
    setSuccessData(null);
    setLoading(true);

    try {
      const payload = {
        name,
        email,
        unit,
        siwesDuration,
        siwesStartDate,
        institution,
        matricNumber,
        phoneNumber
      };

      const res = await api.inviteStudent(payload);
      setSuccessData(res.data);
      setName('');
      setEmail('');
      setInstitution('');
      setMatricNumber('');
      setPhoneNumber('');
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
        <p style={styles.subtitle}>Send a registration invitation link with variable SIWES tenure configuration.</p>

        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSendInvite}>
          {/* Intern Name & Email */}
          <div style={styles.twoColumnGrid}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name *</label>
              <input
                id="name"
                type="text"
                className="form-control"
                placeholder="e.g. Adeola Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address *</label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="e.g. adeola.johnson@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Assigned Unit */}
          <div className="form-group">
            <label className="form-label" htmlFor="unit">Assigned Department / Unit *</label>
            {loadingUnits ? (
              <div style={{ fontSize: '0.875rem', color: '#718096', padding: '8px 0' }}>Loading departments...</div>
            ) : units.length === 0 ? (
              <div style={{ fontSize: '0.875rem', color: '#C53030', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 0' }}>
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
                {(units || []).map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            )}
          </div>

          {/* SIWES Duration & Start Date */}
          <div style={styles.twoColumnGrid}>
            <div className="form-group">
              <label className="form-label" htmlFor="siwesDuration">SIWES Duration *</label>
              <select
                id="siwesDuration"
                className="form-control"
                style={styles.select}
                value={siwesDuration}
                onChange={(e) => setSiwesDuration(e.target.value)}
                required
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="siwesStartDate">SIWES Start Date *</label>
              <input
                id="siwesStartDate"
                type="date"
                className="form-control"
                value={siwesStartDate}
                onChange={(e) => setSiwesStartDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Computed Tenure Preview Box */}
          {computedEndDate && (
            <div style={styles.tenurePreviewBox}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1A365D' }}>
                <Clock size={16} color="#008751" />
                <span style={{ fontSize: '0.8125rem', fontWeight: '600' }}>
                  Calculated SIWES Tenure: {selectedDurationMeta.weeks} Weeks
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#4A5568' }}>
                Start Date: <strong>{new Date(siwesStartDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong> • Estimated Completion: <strong>{computedEndDate}</strong>
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#718096' }}>
                Minimum Attendance Target: <strong>{selectedDurationMeta.weeks * 3} days</strong> (3 daily check-ins per week inside Alausa Secretariat).
              </p>
            </div>
          )}

          {/* Tertiary Institution & Matric Number */}
          <div style={styles.twoColumnGrid}>
            <div className="form-group">
              <label className="form-label" htmlFor="institution">Tertiary Institution</label>
              <input
                id="institution"
                type="text"
                className="form-control"
                placeholder="e.g. University of Lagos (UNILAG)"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="matricNumber">Matriculation / Student ID</label>
              <input
                id="matricNumber"
                type="text"
                className="form-control"
                placeholder="e.g. 190408044"
                value={matricNumber}
                onChange={(e) => setMatricNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label className="form-label" htmlFor="phoneNumber">Phone Number</label>
            <input
              id="phoneNumber"
              type="tel"
              className="form-control"
              placeholder="e.g. +234 801 234 5678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={styles.btn} 
            disabled={loading || units.length === 0}
          >
            <Send size={16} />
            {loading ? 'Sending Invitation...' : 'Generate & Send Invitation'}
          </button>
        </form>
      </div>

      {/* Local Testing / Immediate Confirmation Card */}
      {successData && (
        <div className="glass-card animate-slide-in" style={styles.successCard}>
          <div style={styles.successHeader}>
            <CheckCircle size={24} style={{ color: '#008751' }} />
            <h4 style={styles.successTitle}>Invitation Link Generated!</h4>
          </div>
          
          <p style={styles.successText}>
            The invitation has been logged and queued for email dispatch. For local development, copy the registration token URL below:
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
    maxWidth: '720px',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '28px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1A365D',
    fontFamily: 'var(--font-display)',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#64748B',
    marginBottom: '24px',
  },
  twoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  select: {
    cursor: 'pointer',
  },
  tenurePreviewBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderLeft: '4px solid #008751',
    borderRadius: '6px',
    padding: '12px 16px',
    marginBottom: '18px',
  },
  btn: {
    width: '100%',
    height: '44px',
    marginTop: '16px',
    backgroundColor: '#1A365D',
    color: '#FFFFFF',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(0, 135, 81, 0.3)',
    borderRadius: '10px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0, 135, 81, 0.08)',
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
    color: '#1A365D',
    margin: 0,
  },
  successText: {
    fontSize: '0.85rem',
    color: '#4A5568',
    lineHeight: '1.5',
    marginBottom: '16px',
  },
  linkDisplay: {
    display: 'flex',
    gap: '10px',
  },
  linkInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    fontSize: '0.8125rem',
    color: '#334155',
    textOverflow: 'ellipsis',
    fontFamily: 'monospace',
  },
  copyBtn: {
    height: '40px',
    padding: '0 16px',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#FFF5F5',
    color: '#C53030',
    padding: '12px 16px',
    borderRadius: '6px',
    marginBottom: '20px',
    border: '1px solid rgba(197, 48, 48, 0.2)',
  }
};

export default Invites;
