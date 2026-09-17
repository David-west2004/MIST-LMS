import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  LogOut, 
  ExternalLink, 
  Check, 
  Search, 
  ChevronRight, 
  ShieldCheck, 
  Clock, 
  AlertTriangle,
  FileCode,
  Compass
} from 'lucide-react';
import './StudentDashboard.css';
import mistLogo from '../../assets/MIST.webp';

const StudentDashboard = () => {
  const [curriculum, setCurriculum] = useState(null);
  const [completedMaterials, setCompletedMaterials] = useState([]);
  const [percentage, setPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Navigation & Workspace State
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [currRes, progRes] = await Promise.all([
        api.getMyCurriculum(),
        api.getMyProgress()
      ]);
      const curr = currRes.data?.curriculum || null;
      setCurriculum(curr);
      const completed = progRes.data?.completedMaterials || [];
      setCompletedMaterials(completed);
      setPercentage(progRes.data?.percentage || 0);

      // Default selected material to first incomplete or first available
      if (curr?.modules?.length > 0) {
        const firstModule = curr.modules[0];
        const initialMat = firstModule.materials?.find(m => !completed.includes(m._id)) || firstModule.materials?.[0];
        setSelectedMaterial(initialMat || null);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve curriculum trajectory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleMaterial = async (materialId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.toggleMaterialStatus(materialId);
      setCompletedMaterials(res.data.completedMaterials);
      setPercentage(res.data.percentage);
    } catch (err) {
      console.error('Error toggling verification state:', err.message);
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

  // Aggregated calculations
  const modules = curriculum?.modules || [];
  const currentModule = modules[activeModuleIndex] || modules[0] || null;

  const totalMaterialsCount = useMemo(() => {
    return modules.reduce((sum, mod) => sum + (mod.materials?.length || 0), 0);
  }, [modules]);

  const completedCount = completedMaterials.length;
  const remainingCount = Math.max(0, totalMaterialsCount - completedCount);

  // Filtered materials for currently viewed module
  const displayedMaterials = useMemo(() => {
    if (!currentModule || !currentModule.materials) return [];
    return currentModule.materials.filter((mat) => {
      const matchesFilter = filterType === 'all' || mat.type === filterType;
      const matchesSearch = !searchQuery || 
        mat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mat.type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [currentModule, filterType, searchQuery]);

  // Compute clearance readiness
  const isClearanceReady = percentage === 100 && totalMaterialsCount > 0;

  if (loading) {
    return (
      <div className="lms-empty-state">
        <div className="lms-empty-terminal" style={{ maxWidth: '400px' }}>
          <div className="lms-terminal-header">
            <div className="lms-pulse-indicator" />
            <span className="lms-terminal-title">INITIALIZING WORKSTATION // MIST_TELEMETRY</span>
          </div>
          <p className="lms-empty-text">Authenticating intern session and mounting unit curriculum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lms-console">
      {/* 1. TOP COMMAND & TELEMETRY BAR */}
      <header className="lms-command-bar">
        <div className="lms-brand-cluster">
          <div className="lms-civic-badge">
            <img 
              src={mistLogo} 
              alt="Lagos State MIST Coat of Arms" 
              style={{ height: '28px', width: 'auto', objectFit: 'contain' }} 
            />
            <span className="lms-civic-label">LAGOS STATE // MIST</span>
          </div>

          <div className="lms-brand-divider" />

          <div className="lms-system-title-group">
            <h1 className="lms-system-title">Student IT Portal</h1>
            <span className="lms-system-subtitle">INTERN LEARNING PORTAL</span>
          </div>
        </div>

        {/* Center System Telemetry HUD */}
        <div className="lms-telemetry-hud">
          <div className="lms-hud-chip">
            <div className="lms-pulse-indicator" />
            <span>STATUS: <strong>ONLINE</strong></span>
          </div>
          <div className="lms-hud-chip">
            <span>UNIT // <strong>{user.unit || 'GENERAL'}</strong></span>
          </div>
          <div className="lms-hud-chip">
            <span>STUDENT ID // <strong>{user._id ? user._id.slice(-6).toUpperCase() : 'STU-01'}</strong></span>
          </div>
        </div>

        {/* User Identity & Exit Action */}
        <div className="lms-user-deck">
          <button 
            onClick={() => navigate('/student/assignments')}
            style={{
              backgroundColor: '#1A365D',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: '600',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginRight: '8px'
            }}
          >
            Assignments
          </button>
          <div className="lms-user-meta">
            <span className="lms-user-name">{user.name || 'Student Intern'}</span>
            <span className="lms-user-tag">{user.email}</span>
          </div>
          <button 
            onClick={handleLogout} 
            className="lms-btn-exit"
            title="Terminate session"
          >
            <LogOut size={13} />
            EXIT
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKBENCH GRID */}
      {error ? (
        <main className="lms-empty-state">
          <div className="lms-empty-terminal">
            <div className="lms-terminal-header">
              <div className="lms-terminal-dot" />
              <span className="lms-terminal-title">CURRICULUM_NOT_FOUND // STATUS_ERR</span>
            </div>
            <p className="lms-empty-text" style={{ color: '#f87171', marginBottom: '12px' }}>
              {error}
            </p>
            <p className="lms-empty-text">
              No learning curriculum is currently registered for unit <strong>"{user.unit}"</strong>. 
              Contact your designated MIST supervisor to deploy the syllabus for your track.
            </p>
          </div>
        </main>
      ) : modules.length === 0 ? (
        <main className="lms-empty-state">
          <div className="lms-empty-terminal">
            <div className="lms-terminal-header">
              <div className="lms-terminal-dot" style={{ backgroundColor: '#d99b00' }} />
              <span className="lms-terminal-title">TRACK_UNINITIALIZED // EMPTY_SYLLABUS</span>
            </div>
            <p className="lms-empty-text">
              Your unit <strong>"{user.unit}"</strong> has no curriculum modules published yet. 
              Modules will appear as soon as the administrative team approves them.
            </p>
          </div>
        </main>
      ) : (
        <div className="lms-workbench">
          {/* =================================================================
             ZONE 1: MODULE TRAJECTORY RAIL (LEFT)
             ================================================================= */}
          <aside className="lms-nav-rail">
            <div className="lms-rail-header">
              <span className="lms-rail-title">Trajectory Modules</span>
              <span className="lms-rail-count">{modules.length} UNITS</span>
            </div>

            <div className="lms-module-nav-list">
              {modules.map((mod, index) => {
                const modMaterials = mod.materials || [];
                const modCompleted = modMaterials.filter(m => completedMaterials.includes(m._id)).length;
                const isModComplete = modMaterials.length > 0 && modCompleted === modMaterials.length;
                const isActive = index === activeModuleIndex;

                let statusClass = 'pending';
                let statusLabel = 'PENDING';
                if (isModComplete) {
                  statusClass = 'complete';
                  statusLabel = 'VERIFIED';
                } else if (modCompleted > 0 || isActive) {
                  statusClass = 'active';
                  statusLabel = 'IN_FLIGHT';
                }

                const fillWidth = modMaterials.length > 0 
                  ? Math.round((modCompleted / modMaterials.length) * 100) 
                  : 0;

                return (
                  <button
                    key={mod._id || index}
                    onClick={() => {
                      setActiveModuleIndex(index);
                      if (modMaterials.length > 0) {
                        setSelectedMaterial(modMaterials[0]);
                      }
                    }}
                    className={`lms-module-nav-item ${isActive ? 'is-active' : ''} ${isModComplete ? 'is-completed' : ''}`}
                  >
                    <div className="lms-nav-item-top">
                      <span className="lms-nav-item-index">MOD_{String(index + 1).padStart(2, '0')}</span>
                      <span className={`lms-nav-item-status ${statusClass}`}>{statusLabel}</span>
                    </div>

                    <h4 className="lms-nav-item-title">{mod.title}</h4>

                    <div className="lms-nav-item-meter">
                      <div className="lms-nav-item-bar">
                        <div 
                          className="lms-nav-item-bar-fill" 
                          style={{ width: `${fillWidth}%` }}
                        />
                      </div>
                      <span className="lms-nav-item-tally">
                        {modCompleted}/{modMaterials.length}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* =================================================================
             ZONE 2: CURRICULUM WORKBENCH (CENTER)
             ================================================================= */}
          <main className="lms-stage">
            {/* Toolbar: Category Filters & Search */}
            <div className="lms-stage-toolbar">
              <div className="lms-filter-tabs">
                {['all', 'video', 'pdf', 'doc'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`lms-filter-btn ${filterType === type ? 'is-active' : ''}`}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="lms-search-box">
                <Search size={13} style={{ color: '#64748b' }} />
                <input 
                  type="text" 
                  className="lms-search-input" 
                  placeholder="FILTER ASSETS..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Active Module Briefing Header */}
            {currentModule && (
              <div className="lms-module-briefing">
                <div className="lms-briefing-meta">
                  <span className="lms-briefing-code">
                    MODULE_{String(activeModuleIndex + 1).padStart(2, '0')}
                  </span>
                  <span className="lms-briefing-unit">
                    UNIT // {user.unit?.toUpperCase()} // SYLLABUS_V1
                  </span>
                </div>
                <h2 className="lms-briefing-title">{currentModule.title}</h2>
                {currentModule.description && (
                  <p className="lms-briefing-desc">{currentModule.description}</p>
                )}
              </div>
            )}

            {/* Hairline Resource Deck */}
            <div className="lms-materials-deck">
              {displayedMaterials.length === 0 ? (
                <div style={{ padding: '60px 28px', textAlign: 'center', color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem' }}>
                  NO LEARNING ASSETS MATCH SPECIFIED FILTER CRITERIA
                </div>
              ) : (
                displayedMaterials.map((mat, idx) => {
                  const isDone = completedMaterials.includes(mat._id);
                  const isSelected = selectedMaterial?._id === mat._id;

                  return (
                    <div 
                      key={mat._id} 
                      className={`lms-material-row ${isDone ? 'is-completed' : ''} ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setSelectedMaterial(mat)}
                    >
                      {/* Index Monospace Tag */}
                      <span className="lms-mat-index">
                        {String(idx + 1).padStart(2, '0')}
                      </span>

                      {/* Technical Type Badge */}
                      <div>
                        <span className={`lms-mat-badge ${mat.type}`}>
                          {mat.type === 'link' ? 'REPO' : mat.type}
                        </span>
                      </div>

                      {/* Resource Description & Subtext */}
                      <div className="lms-mat-info">
                        <span className="lms-mat-title">{mat.title}</span>
                        <div className="lms-mat-sub">
                          <span>SOURCE: {mat.url.replace(/^https?:\/\//, '').split('/')[0]}</span>
                          {isDone && <span style={{ color: '#34d399' }}>// VERIFIED</span>}
                        </div>
                      </div>

                      {/* Action Triggers */}
                      <div className="lms-mat-actions">
                        <a 
                          href={mat.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="lms-btn-icon-trigger"
                          onClick={(e) => e.stopPropagation()}
                          title="Open external resource"
                        >
                          LAUNCH
                          <ExternalLink size={11} />
                        </a>
                      </div>

                      {/* Verification Checkbox */}
                      <div className="lms-verify-control">
                        <div 
                          className={`lms-checkbox-custom ${isDone ? 'checked' : ''}`}
                          onClick={(e) => handleToggleMaterial(mat._id, e)}
                          title={isDone ? 'Mark as pending' : 'Verify completion'}
                        >
                          {isDone && <Check size={14} strokeWidth={3} />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </main>

          {/* =================================================================
             ZONE 3: PERFORMANCE & CLEARANCE DECK (RIGHT)
             ================================================================= */}
          <aside className="lms-telemetry-deck">
            {/* Bento 1: Progress Vector */}
            <div className="lms-bento-panel">
              <div className="lms-panel-label">
                <span>Progress Vector (50/50 Weighted)</span>
                <span style={{ color: '#006633' }}>● LIVE</span>
              </div>

              <div className="lms-progress-figure">
                <span className="lms-big-percent">{percentage}%</span>
                <span className="lms-percent-label">WEIGHTED OVERALL</span>
              </div>

              {/* 20-Tick Segmented Mechanical Meter */}
              <div className="lms-mechanical-meter" title={`${percentage}% Completed`}>
                {Array.from({ length: 20 }).map((_, i) => {
                  const tickThreshold = (i + 1) * 5;
                  const isFilled = percentage >= tickThreshold;
                  return (
                    <div 
                      key={i} 
                      className={`lms-meter-tick ${isFilled ? 'filled' : ''}`} 
                    />
                  );
                })}
              </div>

              {/* Tally Numbers */}
              <div className="lms-tally-grid">
                <div className="lms-tally-box">
                  <div className="lms-tally-title">VERIFIED</div>
                  <div className="lms-tally-val" style={{ color: '#34d399' }}>
                    {completedCount} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ASSETS</span>
                  </div>
                </div>

                <div className="lms-tally-box">
                  <div className="lms-tally-title">REMAINING</div>
                  <div className="lms-tally-val" style={{ color: '#fbbf24' }}>
                    {remainingCount} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ASSETS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento 2: Clearance & Certification Readiness */}
            <div className="lms-bento-panel">
              <div className="lms-panel-label">
                <span>Internship Clearance</span>
                <ShieldCheck size={14} style={{ color: isClearanceReady ? '#34d399' : '#d99b00' }} />
              </div>

              <div className="lms-clearance-box">
                <div className={`lms-clearance-status ${isClearanceReady ? 'approved' : 'pending'}`}>
                  <div className="lms-clearance-icon">
                    {isClearanceReady ? (
                      <ShieldCheck size={20} style={{ color: '#34d399' }} />
                    ) : (
                      <Clock size={20} style={{ color: '#fbbf24' }} />
                    )}
                  </div>
                  <div>
                    <div className="lms-clearance-headline">
                      {isClearanceReady ? 'ELIGIBLE FOR SIGN-OFF' : 'VERIFICATION IN PROGRESS'}
                    </div>
                    <div className="lms-clearance-note">
                      {isClearanceReady 
                        ? 'All track modules completed. Ready for supervisor evaluation.' 
                        : `${remainingCount} requirement(s) pending verification before clearance.`
                      }
                    </div>
                  </div>
                </div>

                {/* Monospace Criteria Checklist */}
                <div className="lms-checklist">
                  <div className="lms-check-item">
                    <span>UNIT SYLLABUS COMPLETION</span>
                    <span className={percentage >= 100 ? 'state-ok' : 'state-wait'}>
                      {percentage >= 100 ? '[SATISFIED]' : `[${percentage}%]`}
                    </span>
                  </div>
                  <div className="lms-check-item">
                    <span>MINIMUM THRESHOLD (80%)</span>
                    <span className={percentage >= 80 ? 'state-ok' : 'state-wait'}>
                      {percentage >= 80 ? '[MET]' : '[UNMET]'}
                    </span>
                  </div>
                  <div className="lms-check-item">
                    <span>MIST EVALUATION QUEUE</span>
                    <span className={isClearanceReady ? 'state-ok' : 'state-wait'}>
                      {isClearanceReady ? '[QUEUED]' : '[PENDING]'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento 3: Quick Inspector */}
            <div className="lms-bento-panel" style={{ flex: 1 }}>
              <div className="lms-panel-label">
                <span>Selected Resource</span>
                <Compass size={14} style={{ color: '#38bdf8' }} />
              </div>

              {selectedMaterial ? (
                <div className="lms-inspector-box">
                  <div className="lms-inspector-target">
                    {selectedMaterial.title}
                  </div>

                  <div>
                    <div className="lms-inspector-meta-row">
                      <span className="lms-inspector-k">FORMAT</span>
                      <span className="lms-inspector-v">{selectedMaterial.type?.toUpperCase()}</span>
                    </div>
                    <div className="lms-inspector-meta-row">
                      <span className="lms-inspector-k">STATUS</span>
                      <span className="lms-inspector-v" style={{ color: completedMaterials.includes(selectedMaterial._id) ? '#34d399' : '#fbbf24' }}>
                        {completedMaterials.includes(selectedMaterial._id) ? 'VERIFIED' : 'PENDING'}
                      </span>
                    </div>
                    <div className="lms-inspector-meta-row">
                      <span className="lms-inspector-k">HOST</span>
                      <span className="lms-inspector-v">
                        {selectedMaterial.url?.replace(/^https?:\/\//, '').split('/')[0]}
                      </span>
                    </div>
                  </div>

                  <a 
                    href={selectedMaterial.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="lms-inspector-btn"
                  >
                    LAUNCH MATERIAL ↗
                  </a>
                </div>
              ) : (
                <div style={{ color: '#64748b', fontSize: '0.75rem', fontFamily: 'ui-monospace, monospace' }}>
                  SELECT AN ASSET TO VIEW TELEMETRY & SPEC
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
