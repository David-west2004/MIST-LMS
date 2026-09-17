import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Download, 
  Filter,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedSubmissionsId, setExpandedSubmissionsId] = useState(null);

  // Form State
  const [formUnit, setFormUnit] = useState('');
  const [formModule, setFormModule] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDeadline, setFormDeadline] = useState('');

  const fetchUnitsAndAssignments = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 1. Fetch available units from curricula
      const curriculaRes = await api.getCurricula();
      const curriculaList = curriculaRes.data?.curricula || [];
      const dbUnits = curriculaList.map(c => c.unit);
      
      const fallbackUnits = [
        'Software Development',
        'Cyber Security',
        'Hardware & Network Engineering',
        'Data & Systems Administration'
      ];
      const combinedUnits = Array.from(new Set([...dbUnits, ...fallbackUnits]));
      setUnits(combinedUnits);
      if (!formUnit && combinedUnits.length > 0) {
        setFormUnit(combinedUnits[0]);
      }

      // 2. Fetch all assignments
      const res = await api.getAllAdminAssignments();
      setAssignments(res.data?.assignments || []);
    } catch (err) {
      setError(err.message || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnitsAndAssignments();
  }, []);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!formUnit || !formModule || !formTitle || !formDesc || !formDeadline) {
      setError('Please fill in all assignment fields.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      await api.createAssignment({
        unit: formUnit,
        module: formModule,
        title: formTitle,
        description: formDesc,
        deadline: new Date(formDeadline).toISOString()
      });

      setSuccessMsg('New assignment created successfully!');
      setShowCreateModal(false);
      setFormTitle('');
      setFormDesc('');
      setFormModule('');
      setFormDeadline('');
      await fetchUnitsAndAssignments();
    } catch (err) {
      setError(err.message || 'Failed to create assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete assignment "${title}"?`)) {
      return;
    }

    try {
      await api.deleteAssignment(id);
      setSuccessMsg(`Assignment "${title}" removed.`);
      setAssignments(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete assignment.');
    }
  };

  const filteredAssignments = selectedUnitFilter === 'ALL'
    ? assignments
    : assignments.filter(a => a.unit?.toLowerCase() === selectedUnitFilter.toLowerCase());

  return (
    <div className="animate-slide-in" style={styles.page}>
      {/* Header Bar */}
      <div style={styles.topBanner}>
        <div>
          <h1 style={styles.title}>Assignment & Coursework Control</h1>
          <p style={styles.subtitle}>
            Deploy hands-on tasks, set module deadlines, and monitor student file submissions.
          </p>
        </div>
        <button 
          onClick={() => { setError(''); setSuccessMsg(''); setShowCreateModal(true); }}
          className="btn btn-primary"
          style={styles.createBtn}
        >
          <Plus size={18} />
          Create Assignment
        </button>
      </div>

      {/* Alerts */}
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

      {/* Unit Filter Bar */}
      <div style={styles.filterRow}>
        <div style={styles.filterGroup}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <span style={styles.filterLabel}>Filter by Track:</span>
          <select 
            value={selectedUnitFilter} 
            onChange={(e) => setSelectedUnitFilter(e.target.value)}
            style={styles.selectFilter}
          >
            <option value="ALL">All Department Tracks ({assignments.length})</option>
            {units.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={styles.loaderContainer}>
          <div className="spinner" />
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div style={styles.emptyState}>
          <FileText size={48} style={{ color: '#1A365D', opacity: 0.5, marginBottom: '16px' }} />
          <h3 style={styles.emptyTitle}>No Assignments Found</h3>
          <p style={styles.emptySubtitle}>
            {selectedUnitFilter === 'ALL' 
              ? 'No coursework assignments have been created yet. Click "Create Assignment" to deploy one.' 
              : `No assignments registered for the "${selectedUnitFilter}" track.`}
          </p>
        </div>
      ) : (
        <div style={styles.assignmentGrid}>
          {filteredAssignments.map((a) => {
            const isExpanded = expandedSubmissionsId === a._id;
            const submissionsCount = a.submissions?.length || 0;
            const deadlineDate = new Date(a.deadline);
            const isExpired = deadlineDate < new Date();

            return (
              <div key={a._id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={{ flex: 1 }}>
                    <div style={styles.tagRow}>
                      <span style={styles.unitBadge}>{a.unit}</span>
                      <span style={styles.moduleTag}>{a.module}</span>
                    </div>
                    <h3 style={styles.assignmentTitle}>{a.title}</h3>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => handleDeleteAssignment(a._id, a.title)}
                    style={styles.deleteBtn}
                    title="Delete assignment"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <p style={styles.assignmentDesc}>{a.description}</p>

                <div style={styles.metaFooter}>
                  <div style={styles.metaItem}>
                    <Calendar size={14} style={{ color: '#1A365D' }} />
                    <span style={{ color: isExpired ? '#C53030' : '#4A5568', fontWeight: isExpired ? '600' : '400' }}>
                      Due: {deadlineDate.toLocaleDateString(undefined, { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                      {isExpired && ' (Past Deadline)'}
                    </span>
                  </div>

                  <div style={styles.metaItem}>
                    <Users size={14} style={{ color: '#006633' }} />
                    <span style={{ fontWeight: '600', color: '#006633' }}>
                      {submissionsCount} {submissionsCount === 1 ? 'Submission' : 'Submissions'}
                    </span>
                  </div>
                </div>

                {/* Submissions Toggle */}
                <div style={styles.submissionsSection}>
                  <button 
                    type="button" 
                    onClick={() => setExpandedSubmissionsId(isExpanded ? null : a._id)}
                    style={styles.toggleSubmissionsBtn}
                  >
                    <span>Student Submissions ({submissionsCount})</span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isExpanded && (
                    <div style={styles.submissionsDropdown}>
                      {submissionsCount === 0 ? (
                        <p style={styles.noSubmissionsText}>No student has submitted work for this task yet.</p>
                      ) : (
                        <table style={styles.subTable}>
                          <thead>
                            <tr style={styles.subHeaderRow}>
                              <th style={styles.subTh}>Student Name</th>
                              <th style={styles.subTh}>Email</th>
                              <th style={styles.subTh}>Submitted Date</th>
                              <th style={styles.subTh}>Uploaded File</th>
                            </tr>
                          </thead>
                          <tbody>
                            {a.submissions.map((sub, idx) => {
                              const studentObj = sub.student || {};
                              const fileUrl = sub.fileUrl?.startsWith('http') 
                                ? sub.fileUrl 
                                : `http://localhost:5000${sub.fileUrl}`;

                              return (
                                <tr key={sub._id || idx} style={styles.subRow}>
                                  <td style={styles.subTd}>{studentObj.name || 'Unknown Student'}</td>
                                  <td style={styles.subTd}>{studentObj.email || '—'}</td>
                                  <td style={styles.subTd}>
                                    {sub.submittedAt 
                                      ? new Date(sub.submittedAt).toLocaleString() 
                                      : 'Recently'}
                                  </td>
                                  <td style={styles.subTd}>
                                    <a 
                                      href={fileUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      style={styles.downloadLink}
                                    >
                                      <Download size={14} />
                                      View Work
                                    </a>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card" style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Set New Coursework Assignment</h2>
              <button 
                type="button" 
                onClick={() => setShowCreateModal(false)}
                style={styles.closeBtn}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment}>
              <div style={styles.formGrid}>
                <div className="form-group">
                  <label className="form-label">Assigned Department / Unit</label>
                  <select 
                    value={formUnit} 
                    onChange={(e) => setFormUnit(e.target.value)} 
                    className="form-control"
                    required
                  >
                    {units.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Module Reference / Tag</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="e.g. Module 1: Network Cabling" 
                    value={formModule} 
                    onChange={(e) => setFormModule(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assignment Title</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. Fiber Optic Termination Practical Report" 
                  value={formTitle} 
                  onChange={(e) => setFormTitle(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Instructions & Requirements</label>
                <textarea 
                  className="form-control"
                  rows={4}
                  placeholder="Provide comprehensive assignment guidelines, expected file format (PDF, DOCX, or video), and grading criteria..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Submission Deadline</label>
                <input 
                  type="datetime-local" 
                  className="form-control"
                  value={formDeadline} 
                  onChange={(e) => setFormDeadline(e.target.value)} 
                  required 
                />
              </div>

              <div style={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Publishing...' : 'Deploy Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: {
    padding: '4px 0',
  },
  topBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
  },
  createBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    height: '42px',
    padding: '0 18px',
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
    fontSize: '0.875rem',
    border: '1px solid var(--color-danger-border)',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'var(--color-success-light)',
    color: 'var(--color-success)',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    marginBottom: '20px',
    fontSize: '0.875rem',
    border: '1px solid var(--color-success-border)',
  },
  filterRow: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  filterLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  selectFilter: {
    padding: '6px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
  },
  loaderContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '64px 0',
  },
  emptyState: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px dashed var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: '64px 24px',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: '1.2rem',
    color: 'var(--text-primary)',
    fontWeight: '700',
    marginBottom: '6px',
  },
  emptySubtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
    maxWidth: '460px',
    margin: '0 auto',
  },
  assignmentGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  card: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '20px 24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '8px',
  },
  tagRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  unitBadge: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: '#1A365D',
    padding: '2px 8px',
    borderRadius: '3px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  moduleTag: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#D69E2E',
    backgroundColor: 'rgba(214, 158, 46, 0.12)',
    padding: '2px 8px',
    borderRadius: '3px',
    border: '1px solid rgba(214, 158, 46, 0.3)',
  },
  assignmentTitle: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--color-danger)',
    padding: '6px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  assignmentDesc: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    margin: '10px 0 16px',
    whiteSpace: 'pre-wrap',
  },
  metaFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--border-color)',
    fontSize: '0.8125rem',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  submissionsSection: {
    marginTop: '12px',
  },
  toggleSubmissionsBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '8px 12px',
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: '0.8125rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  submissionsDropdown: {
    marginTop: '10px',
    overflowX: 'auto',
  },
  noSubmissionsText: {
    fontSize: '0.8125rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    padding: '8px 0',
  },
  subTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.8125rem',
  },
  subHeaderRow: {
    backgroundColor: 'var(--bg-primary)',
    textAlign: 'left',
    borderBottom: '1px solid var(--border-color)',
  },
  subTh: {
    padding: '8px 12px',
    color: 'var(--text-muted)',
    fontWeight: '600',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
  },
  subRow: {
    borderBottom: '1px solid var(--border-color)',
  },
  subTd: {
    padding: '8px 12px',
    color: 'var(--text-primary)',
  },
  downloadLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: '#1A365D',
    fontWeight: '600',
    textDecoration: 'none',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    width: '100%',
    maxWidth: '560px',
    padding: '28px',
    boxShadow: 'var(--shadow-lg)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  modalTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  modalActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
  }
};

export default Assignments;
