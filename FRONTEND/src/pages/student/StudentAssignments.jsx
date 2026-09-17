import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ArrowLeft, 
  AlertCircle,
  FolderOpen,
  LogOut
} from 'lucide-react';
import mistLogo from '../../assets/MIST.webp';

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittingId, setSubmittingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchAssignments = async () => {
    try {
      const res = await api.getMyAssignments();
      setAssignments(res.data.assignments || []);
    } catch (err) {
      setError(err.message || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleFileUpload = async (assignmentId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccessMsg('');
    setSubmittingId(assignmentId);

    try {
      const formData = new FormData();
      formData.append('file', file);

      await api.submitAssignmentFile(assignmentId, formData);
      setSuccessMsg('Assignment submitted successfully!');
      await fetchAssignments();
    } catch (err) {
      setError(err.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err.message);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const total = assignments.length;
  const submittedCount = assignments.filter(a => a.isSubmitted).length;
  const pendingCount = total - submittedCount;

  return (
    <div style={styles.page}>
      {/* Top Header */}
      <header style={styles.header}>
        <div style={styles.brandCluster}>
          <button 
            type="button" 
            onClick={() => navigate('/student/curriculum')} 
            style={styles.backBtn}
            title="Return to Curriculum"
          >
            <ArrowLeft size={16} />
            Curriculum
          </button>

          <div style={styles.divider} />

          <div style={styles.badge}>
            <img 
              src={mistLogo} 
              alt="Lagos State Coat of Arms" 
              style={{ height: '28px', width: 'auto', objectFit: 'contain' }} 
            />
            <span style={styles.badgeLabel}>LAGOS STATE // MIST</span>
          </div>

          <div style={styles.titleGroup}>
            <h1 style={styles.title}>Student IT Portal</h1>
            <span style={styles.subtitle}>ASSIGNMENTS & CLASSWORK // UNIT: {user.unit?.toUpperCase()}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={styles.statsCluster}>
            <div style={styles.statBox}>
              <span style={styles.statNum}>{submittedCount}/{total}</span>
              <span style={styles.statLabel}>SUBMITTED</span>
            </div>
            <div style={styles.statBox}>
              <span style={{ ...styles.statNum, color: pendingCount > 0 ? '#D69E2E' : '#006633' }}>
                {pendingCount}
              </span>
              <span style={styles.statLabel}>PENDING</span>
            </div>
          </div>

          <button 
            onClick={handleLogout} 
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#141c2e',
              border: '1px solid #25334c',
              borderRadius: '4px',
              color: '#cbd5e1',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
            title="Terminate session"
          >
            <LogOut size={14} />
            EXIT
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={styles.container}>
        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={styles.successAlert}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div style={styles.loaderContainer}>
            <div className="spinner" />
          </div>
        ) : assignments.length === 0 ? (
          <div style={styles.emptyCard}>
            <FolderOpen size={48} style={{ color: '#1A365D', marginBottom: '16px', opacity: 0.6 }} />
            <h3 style={{ fontSize: '1.2rem', color: '#1A365D', marginBottom: '8px', fontWeight: '700' }}>
              No Assignments Assigned Yet
            </h3>
            <p style={{ color: '#718096', fontSize: '0.875rem', maxWidth: '440px', margin: '0 auto 20px', lineHeight: '1.5' }}>
              There are currently no active assignments for the <strong>{user.unit}</strong> track. Please check back later or review your curriculum materials.
            </p>
            <button 
              type="button" 
              onClick={() => navigate('/student/curriculum')} 
              className="btn btn-primary"
              style={{ padding: '8px 20px', fontSize: '0.875rem' }}
            >
              Go to Curriculum
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {assignments.map((assignment) => {
              const isSubmitted = assignment.isSubmitted;
              const deadlineDate = new Date(assignment.deadline);
              const isOverdue = !isSubmitted && deadlineDate.getTime() < Date.now();
              const isSubmitting = submittingId === assignment._id;

              return (
                <div key={assignment._id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <div>
                      <span style={styles.moduleTag}>{assignment.module}</span>
                      <h3 style={styles.cardTitle}>{assignment.title}</h3>
                    </div>
                    <div>
                      {isSubmitted ? (
                        <span style={styles.statusBadgeSuccess}>
                          <CheckCircle2 size={13} />
                          Submitted
                        </span>
                      ) : isOverdue ? (
                        <span style={styles.statusBadgeOverdue}>
                          <AlertCircle size={13} />
                          Overdue
                        </span>
                      ) : (
                        <span style={styles.statusBadgePending}>
                          <Clock size={13} />
                          Due Soon
                        </span>
                      )}
                    </div>
                  </div>

                  <p style={styles.cardDesc}>{assignment.description}</p>

                  <div style={styles.metaRow}>
                    <div style={styles.metaItem}>
                      <Calendar size={14} style={{ color: '#718096' }} />
                      <span>
                        Due: {deadlineDate.toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {isSubmitted && assignment.mySubmission && (
                      <div style={styles.metaItem}>
                        <CheckCircle2 size={14} style={{ color: '#006633' }} />
                        <span>
                          Submitted: {new Date(assignment.mySubmission.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Submission Control Deck */}
                  <div style={styles.submissionDeck}>
                    {isSubmitted && assignment.mySubmission && (
                      <div style={{ marginBottom: '10px' }}>
                        <a 
                          href={assignment.mySubmission.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={styles.viewFileLink}
                        >
                          <FileText size={14} />
                          View Submitted File ({assignment.mySubmission.fileUrl.split('/').pop()})
                        </a>
                      </div>
                    )}

                    <label style={styles.uploadBtn(isSubmitting)}>
                      <Upload size={14} />
                      {isSubmitting 
                        ? 'Uploading Submission...' 
                        : isSubmitted 
                          ? 'Re-upload Completed Task' 
                          : 'Upload & Submit Task (.pdf, .doc, .mp4)'
                      }
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx,.mp4" 
                        style={{ display: 'none' }}
                        disabled={isSubmitting}
                        onChange={(e) => handleFileUpload(assignment._id, e)}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F7FAFC',
    color: '#2D3748',
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '64px',
    padding: '0 28px',
    backgroundColor: '#1A365D',
    borderBottom: '1px solid #132742',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  brandCluster: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  divider: {
    width: '1px',
    height: '24px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 10px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
  },
  badgeLabel: {
    fontFamily: 'ui-monospace, monospace',
    fontSize: '0.6875rem',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: '0.08em',
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontSize: '0.9375rem',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
    lineHeight: 1.2,
  },
  subtitle: {
    fontFamily: 'ui-monospace, monospace',
    fontSize: '0.6875rem',
    color: '#E2E8F0',
    letterSpacing: '0.04em',
  },
  statsCluster: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  statNum: {
    fontSize: '0.9375rem',
    fontWeight: '700',
    color: '#006633',
    fontFamily: 'ui-monospace, monospace',
  },
  statLabel: {
    fontSize: '0.625rem',
    color: '#CBD5E0',
    letterSpacing: '0.05em',
    fontWeight: '600',
  },
  container: {
    maxWidth: '1080px',
    margin: '32px auto',
    padding: '0 24px',
  },
  loaderContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '64px 0',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '56px 32px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
    transition: 'border-color 0.15s ease',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  moduleTag: {
    display: 'inline-block',
    fontSize: '0.6875rem',
    fontFamily: 'ui-monospace, monospace',
    color: '#1A365D',
    backgroundColor: '#EDF2F7',
    padding: '2px 8px',
    borderRadius: '3px',
    fontWeight: '700',
    marginBottom: '6px',
    letterSpacing: '0.5px',
  },
  cardTitle: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: '#1A365D',
    margin: 0,
  },
  cardDesc: {
    fontSize: '0.875rem',
    color: '#4A5568',
    lineHeight: 1.6,
    marginBottom: '16px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #EDF2F7',
    marginBottom: '16px',
    fontSize: '0.8125rem',
    color: '#718096',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  statusBadgeSuccess: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(0, 102, 51, 0.1)',
    color: '#006633',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600',
    border: '1px solid rgba(0, 102, 51, 0.25)',
  },
  statusBadgePending: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(214, 158, 46, 0.1)',
    color: '#D69E2E',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600',
    border: '1px solid rgba(214, 158, 46, 0.25)',
  },
  statusBadgeOverdue: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(197, 48, 48, 0.1)',
    color: '#C53030',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600',
    border: '1px solid rgba(197, 48, 48, 0.25)',
  },
  submissionDeck: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  viewFileLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: '#006633',
    fontSize: '0.8125rem',
    fontWeight: '600',
    textDecoration: 'underline',
  },
  uploadBtn: (disabled) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: disabled ? '#A0AEC0' : '#1A365D',
    color: '#ffffff',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'background-color 0.15s ease',
  }),
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(197, 48, 48, 0.1)',
    color: '#C53030',
    padding: '12px 16px',
    borderRadius: '6px',
    marginBottom: '20px',
    border: '1px solid rgba(197, 48, 48, 0.2)',
    fontSize: '0.875rem',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(0, 102, 51, 0.1)',
    color: '#006633',
    padding: '12px 16px',
    borderRadius: '6px',
    marginBottom: '20px',
    border: '1px solid rgba(0, 102, 51, 0.2)',
    fontSize: '0.875rem',
  }
};

export default StudentAssignments;
