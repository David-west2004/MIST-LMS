import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { LogOut, BookOpen, ExternalLink, CheckCircle, FileText, Video, Link, HelpCircle } from 'lucide-react';

const StudentDashboard = () => {
  const [curriculum, setCurriculum] = useState(null);
  const [completedMaterials, setCompletedMaterials] = useState([]);
  const [percentage, setPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [currRes, progRes] = await Promise.all([
        api.getMyCurriculum(),
        api.getMyProgress()
      ]);
      setCurriculum(currRes.data.curriculum);
      setCompletedMaterials(progRes.data.completedMaterials);
      setPercentage(progRes.data.percentage);
    } catch (err) {
      setError(err.message || 'Failed to retrieve curriculum data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleMaterial = async (materialId) => {
    try {
      const res = await api.toggleMaterialStatus(materialId);
      setCompletedMaterials(res.data.completedMaterials);
      setPercentage(res.data.percentage);
    } catch (err) {
      console.error('Error toggling progress:', err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText size={18} style={{ color: '#ef4444' }} />;
      case 'video': return <Video size={18} style={{ color: '#3b82f6' }} />;
      case 'link': return <Link size={18} style={{ color: '#10b981' }} />;
      case 'doc': return <FileText size={18} style={{ color: '#f59e0b' }} />;
      default: return <HelpCircle size={18} />;
    }
  };

  const countTotalMaterials = () => {
    if (!curriculum) return 0;
    return curriculum.modules.reduce((sum, mod) => sum + mod.materials.length, 0);
  };

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div className="spinner" />
      </div>
    );
  }

  const totalMaterials = countTotalMaterials();
  const completedCount = completedMaterials.length;

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.logoBadge}>MIST</div>
          <div>
            <h1 style={styles.headerTitle}>IT Intern Portal</h1>
            <p style={styles.headerSubtitle}>{user.unit} Unit</p>
          </div>
        </div>

        <div style={styles.userSection}>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user.name}</span>
            <span style={styles.userEmail}>{user.email}</span>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={styles.logoutBtn}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.mainContent}>
        {error ? (
          <div className="glass-card animate-slide-in" style={styles.errorCard}>
            <h2 style={{ color: 'var(--color-danger)' }}>Curriculum Missing</h2>
            <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>{error}</p>
            <p style={{ fontSize: '0.875rem', marginTop: '16px', color: 'var(--text-muted)' }}>
              Please request your supervisor to configure a learning path for the <strong>{user.unit}</strong> unit.
            </p>
          </div>
        ) : (
          <div className="student-dashboard-layout" style={styles.layoutGrid}>
            {/* Left: Curriculum modules */}
            <div style={styles.curriculumSection}>
              <h2 style={styles.sectionTitle}>
                <BookOpen size={22} style={{ color: 'var(--color-primary)' }} />
                Learning Curriculum
              </h2>

              <div style={styles.modulesContainer}>
                {curriculum?.modules.map((module, index) => (
                  <div key={module._id} className="glass-card" style={styles.moduleCard}>
                    <div style={styles.moduleHeader}>
                      <span style={styles.moduleNumber}>Module {index + 1}</span>
                      <h3 style={styles.moduleTitle}>{module.title}</h3>
                      {module.description && <p style={styles.moduleDesc}>{module.description}</p>}
                    </div>

                    <div style={styles.materialsList}>
                      {module.materials.map((material) => {
                        const isCompleted = completedMaterials.includes(material._id);
                        return (
                          <div key={material._id} style={styles.materialRow(isCompleted)}>
                            <label style={styles.checkboxLabel}>
                              <input
                                type="checkbox"
                                style={styles.checkbox}
                                checked={isCompleted}
                                onChange={() => handleToggleMaterial(material._id)}
                              />
                              <div style={styles.materialIcon}>
                                {getMaterialIcon(material.type)}
                              </div>
                              <div style={styles.materialDetails}>
                                <a 
                                  href={material.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  style={styles.materialLink(isCompleted)}
                                >
                                  {material.title}
                                  <ExternalLink size={12} style={styles.extIcon} />
                                </a>
                                <span style={styles.materialType}>{material.type.toUpperCase()}</span>
                              </div>
                            </label>
                            {isCompleted && (
                              <CheckCircle size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Progress Stat Panel */}
            <div style={styles.statsSection}>
              <div className="glass-card" style={styles.statsCard}>
                <h3 style={styles.statsCardTitle}>Your Progress</h3>
                
                <div style={styles.percentageDisplay}>
                  <span style={styles.percentageVal}>{percentage}%</span>
                  <span style={styles.percentageLabel}>Complete</span>
                </div>

                <div style={styles.barWrapper}>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
                  </div>
                </div>

                <div style={styles.statsBreakdown}>
                  <div style={styles.breakdownItem}>
                    <span style={styles.breakdownLabel}>Completed Items</span>
                    <span style={styles.breakdownValue}>{completedCount} of {totalMaterials}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  loaderContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)',
  },
  container: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    height: '72px',
    backgroundColor: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoBadge: {
    backgroundColor: 'var(--color-primary-light)',
    color: 'var(--color-primary)',
    fontWeight: '800',
    fontSize: '0.85rem',
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid rgba(99, 102, 241, 0.2)',
  },
  headerTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'var(--font-display)',
  },
  headerSubtitle: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'right',
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#ffffff',
  },
  userEmail: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  logoutBtn: {
    height: '36px',
  },
  mainContent: {
    flex: 1,
    padding: '24px',
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
  },
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '24px',
    alignItems: 'start',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  modulesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  moduleCard: {
    padding: '20px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
  },
  moduleHeader: {
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '16px',
    marginBottom: '16px',
  },
  moduleNumber: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--color-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  moduleTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#ffffff',
    marginTop: '4px',
  },
  moduleDesc: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginTop: '6px',
  },
  materialsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  materialRow: (isCompleted) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.02)' : 'var(--bg-secondary)',
    border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'var(--border-color)'}`,
    borderRadius: 'var(--radius-md)',
    transition: 'all var(--transition-fast)',
  }),
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flex: 1,
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    borderRadius: '4px',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    accentColor: 'var(--color-success)',
  },
  materialIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  materialLink: (isCompleted) => ({
    fontSize: '0.9375rem',
    fontWeight: '500',
    color: isCompleted ? 'var(--text-secondary)' : '#ffffff',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    textDecoration: isCompleted ? 'line-through' : 'none',
  }),
  extIcon: {
    opacity: 0.5,
  },
  materialType: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
    letterSpacing: '0.5px',
  },
  statsCard: {
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '24px',
    position: 'sticky',
    top: '96px',
  },
  statsCardTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'var(--font-display)',
    marginBottom: '20px',
  },
  percentageDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '20px 0',
  },
  percentageVal: {
    fontSize: '3.5rem',
    fontWeight: '800',
    color: 'var(--color-success)',
    fontFamily: 'var(--font-display)',
    lineHeight: 1,
  },
  percentageLabel: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginTop: '6px',
  },
  barWrapper: {
    margin: '20px 0',
  },
  statsBreakdown: {
    borderTop: '1px solid var(--border-color)',
    paddingTop: '16px',
    marginTop: '16px',
  },
  breakdownItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
  },
  breakdownLabel: {
    color: 'var(--text-secondary)',
  },
  breakdownValue: {
    color: '#ffffff',
    fontWeight: '600',
  },
  errorCard: {
    textAlign: 'center',
    padding: '48px 32px',
    maxWidth: '560px',
    margin: '40px auto 0',
    border: '1px solid rgba(239, 68, 68, 0.1)',
  }
};

const styleTag = document.createElement('style');
styleTag.textContent = `
  @media (min-width: 900px) {
    .student-dashboard-layout {
      display: grid;
      grid-template-columns: 1fr 340px !important;
      gap: 24px;
    }
  }
`;
document.head.appendChild(styleTag);

export default StudentDashboard;
