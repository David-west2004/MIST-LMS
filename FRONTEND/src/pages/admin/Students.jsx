import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ShieldAlert, ShieldCheck, AlertTriangle, RotateCw } from 'lucide-react';
import { isRecentlyActive, formatRelativeActivity } from '../../utils/timeAgo';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const studentsRes = await api.getAllStudents();
      setStudents(studentsRes.data.students);
    } catch (err) {
      setError(err.message || 'Failed to fetch student data.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
    // Periodically refresh relative activity
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleBlock = async (id, currentBlocked) => {
    try {
      const res = await api.toggleBlockStudent(id, !currentBlocked);
      setStudents(prev => prev.map(s => s._id === id ? { ...s, isBlocked: res.data.student.isBlocked } : s));
    } catch (err) {
      alert(err.message || 'Failed to update student state.');
    }
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <div className="spinner" />
      </div>
    );
  }

  const activeNowCount = students.filter(s => isRecentlyActive(s.lastActive)).length;

  return (
    <div className="animate-slide-in">
      {error && (
        <div style={styles.errorAlert}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: '12px 18px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1A365D' }}>
            Registered Interns: <strong>{students.length}</strong>
          </span>
          <span style={{ fontSize: '0.8125rem', color: '#006633', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#006633' }} />
            Active Online Now: <strong>{activeNowCount}</strong>
          </span>
        </div>

        <button 
          onClick={handleRefresh} 
          disabled={refreshing}
          type="button"
          className="btn btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8125rem',
            padding: '6px 12px',
            height: '32px'
          }}
          title="Refresh real-time activity status"
        >
          <RotateCw size={14} className={refreshing ? 'spinner' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Status'}
        </button>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Assigned Unit</th>
              <th>Overall Progress</th>
              <th>Activity Status</th>
              <th>Account</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? (
              students.map((student) => (
                <tr key={student._id}>
                  <td style={styles.boldText}>{student.name}</td>
                  <td>{student.email}</td>
                  <td>
                    {/* Read-only static badge for locked unit */}
                    <span style={styles.unitBadge}>
                      {student.unit}
                    </span>
                  </td>
                  <td style={{ width: '200px' }}>
                    <div style={styles.progressColumn}>
                      <span style={styles.progressText}>{student.progressPercentage}%</span>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar-fill" 
                          style={{ 
                            width: `${student.progressPercentage}%`,
                            backgroundColor: '#006633' 
                          }} 
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    {/* Real-Time Activity Monitoring */}
                    {isRecentlyActive(student.lastActive) ? (
                      <div style={styles.activityContainer}>
                        <span style={styles.pulseContainer}>
                          <span style={styles.pulsePing} />
                          <span style={styles.pulseDot} />
                        </span>
                        <span style={styles.activeText}>Active now</span>
                      </div>
                    ) : (
                      <span style={styles.inactiveText}>
                        {formatRelativeActivity(student.lastActive)}
                      </span>
                    )}
                  </td>
                  <td>
                    {student.isBlocked ? (
                      <span className="badge badge-danger">
                        Blocked
                      </span>
                    ) : (
                      <span className="badge badge-success">
                        Active
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleToggleBlock(student._id, student.isBlocked)}
                      className={`btn btn-sm ${student.isBlocked ? 'btn-secondary' : 'btn-danger'}`}
                      style={styles.actionBtn}
                    >
                      {student.isBlocked ? (
                        <>
                          <ShieldCheck size={14} />
                          Unblock
                        </>
                      ) : (
                        <>
                          <ShieldAlert size={14} />
                          Block Access
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={styles.emptyRow}>No students registered. Send invites to get started.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  center: {
    display: 'flex',
    justifyContent: 'center',
    padding: '48px 0',
  },
  boldText: {
    fontWeight: '600',
    color: '#1A365D',
  },
  unitBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#EDF2F7',
    color: '#1A365D',
    borderRadius: '4px',
    fontSize: '0.8125rem',
    fontWeight: '600',
    border: '1px solid #CBD5E0',
    letterSpacing: '0.3px',
  },
  activityContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  pulseContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '10px',
    height: '10px',
  },
  pulsePing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    backgroundColor: '#006633',
    opacity: 0.75,
    animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
  },
  pulseDot: {
    position: 'relative',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#006633',
  },
  activeText: {
    color: '#006633',
    fontWeight: '600',
    fontSize: '0.8125rem',
  },
  inactiveText: {
    color: '#718096',
    fontSize: '0.8125rem',
  },
  progressColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  progressText: {
    fontSize: '0.8125rem',
    fontWeight: '600',
    color: '#4A5568',
  },
  actionBtn: {
    gap: '6px',
    fontSize: '0.75rem',
    height: '32px',
  },
  emptyRow: {
    textAlign: 'center',
    color: '#718096',
    padding: '32px',
  },
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
  }
};

export default Students;
