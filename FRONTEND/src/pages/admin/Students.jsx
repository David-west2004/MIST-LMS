import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ShieldAlert, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [units, setUnits] = useState([]);

  const fetchData = async () => {
    try {
      const [studentsRes, curriculaRes] = await Promise.all([
        api.getAllStudents(),
        api.getCurricula()
      ]);
      setStudents(studentsRes.data.students);
      setUnits(curriculaRes.data.curricula.map(c => c.unit));
    } catch (err) {
      setError(err.message || 'Failed to fetch student and unit data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.getAllStudents();
      setStudents(res.data.students);
    } catch (err) {
      setError(err.message || 'Failed to fetch student logs.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleBlock = async (id, currentBlocked) => {
    try {
      const res = await api.toggleBlockStudent(id, !currentBlocked);
      setStudents(prev => prev.map(s => s._id === id ? { ...s, isBlocked: res.data.student.isBlocked } : s));
    } catch (err) {
      alert(err.message || 'Failed to update student state.');
    }
  };

  const handleUnitChange = async (id, newUnit) => {
    try {
      await api.updateStudentUnit(id, newUnit);
      fetchStudents();
    } catch (err) {
      alert(err.message || 'Failed to update student unit.');
    }
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="animate-slide-in">
      {error && (
        <div style={styles.errorAlert}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Unit</th>
              <th>Overall Progress</th>
              <th>Status</th>
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
                    <select
                      value={student.unit}
                      onChange={(e) => handleUnitChange(student._id, e.target.value)}
                      style={styles.select}
                    >
                      {(units.includes(student.unit) ? units : [...units, student.unit]).map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ width: '220px' }}>
                    <div style={styles.progressColumn}>
                      <span style={styles.progressText}>{student.progressPercentage}%</span>
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${student.progressPercentage}%` }} />
                      </div>
                    </div>
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
                <td colSpan="6" style={styles.emptyRow}>No students registered. Send invites to get started.</td>
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
    color: '#ffffff',
  },
  progressColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  progressText: {
    fontSize: '0.8125rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  select: {
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    padding: '6px 10px',
    color: '#ffffff',
    outline: 'none',
    cursor: 'pointer',
  },
  actionBtn: {
    gap: '6px',
    fontSize: '0.75rem',
    height: '32px',
  },
  emptyRow: {
    textAlign: 'center',
    color: 'var(--text-secondary)',
    padding: '32px',
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

export default Students;
