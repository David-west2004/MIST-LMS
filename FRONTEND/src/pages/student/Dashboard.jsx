import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  LogOut, 
  ExternalLink, 
  Check, 
  Search, 
  ShieldCheck, 
  Clock, 
  AlertTriangle,
  Compass,
  MapPin,
  Award,
  Download,
  CheckCircle2,
  XCircle,
  FileCheck,
  Calendar
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

  // Attendance & Clearance State
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInNotice, setCheckInNotice] = useState(null); // { type: 'success' | 'error', message: string }
  const [requestingLetter, setRequestingLetter] = useState(false);
  const [certificateData, setCertificateData] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);

  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const [currRes, progRes, attRes] = await Promise.all([
        api.getMyCurriculum().catch(err => ({ data: { curriculum: null }, error: err.message })),
        api.getMyProgress().catch(() => ({ data: { completedMaterials: [], percentage: 0 } })),
        api.getMyAttendanceSummary().catch(() => ({ data: null }))
      ]);

      const curr = currRes.data?.curriculum || null;
      setCurriculum(curr);
      if (currRes.error && !curr) {
        setError(currRes.error);
      }

      const completed = progRes.data?.completedMaterials || [];
      setCompletedMaterials(completed);
      setPercentage(progRes.data?.percentage || 0);

      if (attRes?.data) {
        setAttendanceSummary(attRes.data);
      }

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
    fetchDashboardData();
  }, []);

  // Material Toggle
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

  // Geofenced Check-In Action
  const handleCheckIn = () => {
    setCheckInNotice(null);
    if (!navigator.geolocation) {
      setCheckInNotice({
        type: 'error',
        message: 'Geolocation is not supported by your browser. Please use a modern browser to verify attendance.'
      });
      return;
    }

    setCheckingIn(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await api.checkInAttendance(latitude, longitude);
          
          setCheckInNotice({
            type: 'success',
            message: res.message || 'Attendance verified successfully inside Alausa Secretariat!'
          });

          // Refresh attendance telemetry
          const updatedSummary = await api.getMyAttendanceSummary();
          setAttendanceSummary(updatedSummary.data);
        } catch (err) {
          setCheckInNotice({
            type: 'error',
            message: err.message || 'Geofence verification failed. Ensure you are physically at Alausa Secretariat.'
          });
        } finally {
          setCheckingIn(false);
        }
      },
      (geoError) => {
        setCheckingIn(false);
        let msg = 'Failed to acquire GPS location.';
        if (geoError.code === 1) {
          msg = 'Location permission was denied. Please allow location access in your browser to check in at Alausa.';
        } else if (geoError.code === 2) {
          msg = 'Location unavailable. Ensure device GPS is active.';
        } else if (geoError.code === 3) {
          msg = 'Location request timed out. Please try again.';
        }
        setCheckInNotice({ type: 'error', message: msg });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // Completion Certificate Request Action
  const handleRequestCompletionLetter = async () => {
    setRequestingLetter(true);
    setCheckInNotice(null);

    try {
      const res = await api.requestCompletionLetter();
      setCertificateData(res.data);
      setShowCertModal(true);
      
      // Update local student user state
      const updatedUser = { ...user, isClearedForCompletion: true };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Refresh attendance summary
      const updatedSummary = await api.getMyAttendanceSummary();
      setAttendanceSummary(updatedSummary.data);
    } catch (err) {
      setCheckInNotice({
        type: 'error',
        message: err.message || 'Failed to request completion letter.'
      });
    } finally {
      setRequestingLetter(false);
    }
  };

  // Download PDF Certificate Helper
  const downloadPdfFile = (base64Data, filename) => {
    try {
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${base64Data}`;
      link.download = filename || 'MIST_SIWES_Completion_Certificate.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
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

  // Attendance metrics
  const eligibility = attendanceSummary?.eligibility || {
    eligible: false,
    totalDays: 0,
    targetDays: (user.siwesDurationWeeks || 24) * 3,
    compliantWeeks: 0,
    targetWeeks: user.siwesDurationWeeks || 24,
    missingWeeks: [],
    weeklyBreakdown: {}
  };

  const durationWeeks = attendanceSummary?.durationWeeks || user.siwesDurationWeeks || 24;
  const currentWeekNum = attendanceSummary?.currentWeek || 1;
  const checkedInToday = attendanceSummary?.checkedInToday || false;
  const isCleared = user.isClearedForCompletion || false;

  const durationLabel = user.siwesDuration === '3_months'
    ? '3 Months (12 Weeks)'
    : user.siwesDuration === '1_year'
      ? '1 Year (52 Weeks)'
      : '6 Months (24 Weeks)';

  if (loading) {
    return (
      <div className="lms-empty-state">
        <div className="lms-empty-terminal" style={{ maxWidth: '420px', textAlign: 'center' }}>
          <div className="lms-terminal-header" style={{ justifyContent: 'center' }}>
            <div className="lms-pulse-indicator" />
            <span className="lms-terminal-title">INITIALIZING WORKSTATION // MIST_TELEMETRY</span>
          </div>
          <p className="lms-empty-text">Authenticating intern session, geofence status, and curriculum syllabus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lms-console">
      {/* 1. TOP COMMAND & CIVIC NAVIGATION BAR */}
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
            <span className="lms-system-subtitle">INTERN LEARNING WORKBENCH</span>
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
            <span>SIWES // <strong>{durationLabel}</strong></span>
          </div>
        </div>

        {/* User Identity & Exit Action */}
        <div className="lms-user-deck">
          <button 
            onClick={() => navigate('/student/assignments')}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              fontSize: '0.75rem',
              fontWeight: '600',
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.25)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Assignments
          </button>
          
          <div className="lms-user-meta">
            <span className="lms-user-name">{user.name || 'Student Intern'}</span>
            <span className="lms-user-tag">{user.matricNumber || user.email}</span>
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

      {/* 2. REPLACED HEADER: ATTENDANCE TRACKING WIDGET */}
      <section className="lms-attendance-widget">
        <div className="lms-widget-top">
          <div className="lms-widget-title-area">
            <h2 className="lms-widget-heading">
              <MapPin size={20} color="#008751" />
              SIWES Daily Attendance & Geofenced Clearance Tracker
            </h2>
            <p className="lms-widget-sub">
              Alausa Secretariat Perimeter (250m radius) • Policy: Minimum 3 verified daily check-ins required every single week
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* Metric Badges */}
            <div className="lms-widget-metrics">
              <div className="lms-metric-badge green">
                <span>Days Logged:</span>
                <strong>{eligibility.totalDays} / {eligibility.targetDays}</strong>
              </div>

              <div className="lms-metric-badge">
                <span>Weeks Cleared:</span>
                <strong style={{ color: eligibility.compliantWeeks === durationWeeks ? '#008751' : '#1A365D' }}>
                  {eligibility.compliantWeeks} / {durationWeeks}
                </strong>
              </div>

              <div className="lms-metric-badge amber">
                <span>Current Week:</span>
                <strong>Week {currentWeekNum} of {durationWeeks}</strong>
              </div>
            </div>

            {/* Check In Today Button */}
            <button
              type="button"
              onClick={handleCheckIn}
              disabled={checkingIn || checkedInToday}
              className={`lms-btn-checkin ${checkedInToday ? 'checked' : ''}`}
              title={checkedInToday ? 'Daily check-in already recorded' : 'Verify physical presence at Alausa'}
            >
              <MapPin size={16} />
              {checkedInToday ? (
                'Checked In Today ✓'
              ) : checkingIn ? (
                'Verifying Geofence...'
              ) : (
                'Check In Today'
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Alerts (Geofence / Location errors) */}
        {checkInNotice && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '6px',
            marginBottom: '12px',
            fontSize: '0.8125rem',
            backgroundColor: checkInNotice.type === 'success' ? '#F0FDF4' : '#FFF5F5',
            color: checkInNotice.type === 'success' ? '#008751' : '#C53030',
            border: `1px solid ${checkInNotice.type === 'success' ? 'rgba(0,135,81,0.25)' : 'rgba(197,48,48,0.25)'}`
          }}>
            {checkInNotice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{checkInNotice.message}</span>
          </div>
        )}

        {/* Dynamic Week Grid (1 to 12, 24, or 52) */}
        <div className="lms-week-grid-container">
          <div className="lms-week-grid">
            {Array.from({ length: durationWeeks }).map((_, i) => {
              const weekNum = i + 1;
              const count = eligibility.weeklyBreakdown?.[weekNum] || 0;
              const isClearedWeek = count >= 3;
              const isCurrent = weekNum === currentWeekNum;
              const isPast = weekNum < currentWeekNum;

              let cardStatusClass = 'status-future';
              let badgeText = 'PENDING';

              if (isClearedWeek) {
                cardStatusClass = 'status-cleared';
                badgeText = 'CLEARED';
              } else if (isCurrent) {
                cardStatusClass = 'status-amber';
                badgeText = `${count}/3 DAYS`;
              } else if (isPast) {
                cardStatusClass = 'status-amber';
                badgeText = 'DEFICIT';
              }

              return (
                <div 
                  key={weekNum} 
                  className={`lms-week-card ${cardStatusClass} ${isCurrent ? 'is-current' : ''}`}
                  title={`Week ${weekNum}: ${count} / 3 daily check-ins logged`}
                >
                  <span className="lms-week-num">W{String(weekNum).padStart(2, '0')}</span>
                  <span className="lms-week-count">{count}/3d</span>
                  <span className="lms-week-badge">{badgeText}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Completion Action Card (Clearance Gate) */}
        <div className={`lms-clearance-action-card ${isCleared ? 'is-cleared' : eligibility.eligible ? 'is-eligible' : ''}`}>
          <div className="lms-clearance-card-left">
            {isCleared ? (
              <Award size={24} color="#008751" />
            ) : eligibility.eligible ? (
              <ShieldCheck size={24} color="#008751" />
            ) : (
              <Clock size={24} color="#D97706" />
            )}

            <div>
              <h4 className="lms-clearance-card-title">
                {isCleared 
                  ? 'Official SIWES Industrial Attachment Completed & Cleared' 
                  : eligibility.eligible 
                    ? 'Clearance Gate Open: All Requirements Satisfied!' 
                    : 'Clearance Gate: In Progress'}
              </h4>
              <p className="lms-clearance-card-desc">
                {isCleared 
                  ? 'Your completion credentials and certificate have been officially validated by MIST.' 
                  : eligibility.eligible 
                    ? 'You have logged at least 3 geofenced check-ins for every single week of your tenure. Request your signed Completion Letter now.' 
                    : `Requires at least 3 check-ins for every week. (${eligibility.missingWeeks.length} week(s) pending compliance).`}
              </p>
            </div>
          </div>

          <div>
            {isCleared ? (
              <button
                type="button"
                onClick={handleRequestCompletionLetter}
                disabled={requestingLetter}
                className="lms-btn-clearance download"
              >
                <Download size={15} />
                {requestingLetter ? 'Loading Certificate...' : 'Download Certificate (PDF)'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRequestCompletionLetter}
                disabled={!eligibility.eligible || requestingLetter}
                className={`lms-btn-clearance ${eligibility.eligible ? 'unlocked' : 'locked'}`}
              >
                <FileCheck size={15} />
                {requestingLetter 
                  ? 'Generating PDF Certificate...' 
                  : eligibility.eligible 
                    ? 'Request Completion Letter' 
                    : 'Clearance Gate Locked'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. MAIN WORKBENCH GRID */}
      {error ? (
        <main className="lms-empty-state">
          <div className="lms-empty-terminal">
            <div className="lms-terminal-header">
              <div className="lms-terminal-dot" />
              <span className="lms-terminal-title">CURRICULUM_NOT_FOUND // STATUS_ERR</span>
            </div>
            <p className="lms-empty-text" style={{ color: '#DC2626', marginBottom: '12px' }}>
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
              <div className="lms-terminal-dot" style={{ backgroundColor: '#D97706' }} />
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
          {/* ZONE 1: MODULE TRAJECTORY RAIL (LEFT) */}
          <aside className="lms-nav-rail">
            <div className="lms-rail-header">
              <span className="lms-rail-title">Syllabus Modules</span>
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

          {/* ZONE 2: CURRICULUM WORKBENCH (CENTER) */}
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
                <Search size={14} style={{ color: '#64748B' }} />
                <input 
                  type="text" 
                  className="lms-search-input" 
                  placeholder="FILTER COURSE ASSETS..." 
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
                    UNIT // {user.unit?.toUpperCase()} // SYLLABUS
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
                <div style={{ padding: '60px 28px', textAlign: 'center', color: '#64748B', fontSize: '0.8125rem' }}>
                  No learning assets match the selected filter criteria.
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
                      <span className="lms-mat-index">
                        {String(idx + 1).padStart(2, '0')}
                      </span>

                      <div>
                        <span className={`lms-mat-badge ${mat.type}`}>
                          {mat.type === 'link' ? 'REPO' : mat.type}
                        </span>
                      </div>

                      <div className="lms-mat-info">
                        <span className="lms-mat-title">{mat.title}</span>
                        <div className="lms-mat-sub">
                          <span>SOURCE: {mat.url.replace(/^https?:\/\//, '').split('/')[0]}</span>
                          {isDone && <span style={{ color: '#008751', fontWeight: '600' }}>// VERIFIED ✓</span>}
                        </div>
                      </div>

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

          {/* ZONE 3: PERFORMANCE & CLEARANCE DECK (RIGHT) */}
          <aside className="lms-telemetry-deck">
            {/* Bento 1: Progress Vector */}
            <div className="lms-bento-panel">
              <div className="lms-panel-label">
                <span>Curriculum Progress</span>
                <span style={{ color: '#008751' }}>● LIVE</span>
              </div>

              <div className="lms-progress-figure">
                <span className="lms-big-percent">{percentage}%</span>
                <span className="lms-percent-label">COMPLETED</span>
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

              <div className="lms-tally-grid">
                <div className="lms-tally-box">
                  <div className="lms-tally-title">VERIFIED</div>
                  <div className="lms-tally-val" style={{ color: '#008751' }}>
                    {completedCount} <span style={{ fontSize: '0.75rem', color: '#64748B' }}>ASSETS</span>
                  </div>
                </div>

                <div className="lms-tally-box">
                  <div className="lms-tally-title">REMAINING</div>
                  <div className="lms-tally-val" style={{ color: '#D97706' }}>
                    {remainingCount} <span style={{ fontSize: '0.75rem', color: '#64748B' }}>ASSETS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento 2: Selected Resource Inspector */}
            <div className="lms-bento-panel" style={{ flex: 1 }}>
              <div className="lms-panel-label">
                <span>Selected Resource</span>
                <Compass size={14} style={{ color: '#1A365D' }} />
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
                      <span className="lms-inspector-v" style={{ color: completedMaterials.includes(selectedMaterial._id) ? '#008751' : '#D97706' }}>
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
                <div style={{ color: '#64748B', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  SELECT AN ASSET TO VIEW SPECIFICATION
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* 4. CERTIFICATE OF COMPLETION MODAL */}
      {showCertModal && certificateData && (
        <div className="lms-modal-overlay animate-fade-in">
          <div className="lms-modal-content">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#F0FDF4',
                color: '#008751',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px'
              }}>
                <Award size={32} />
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1A365D', margin: '0 0 6px 0' }}>
                SIWES Completion Certificate Approved!
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: 0 }}>
                Lagos State Ministry of Innovation, Science and Technology
              </p>
            </div>

            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8125rem' }}>
                <span style={{ color: '#64748B' }}>Intern Full Name:</span>
                <strong style={{ color: '#1A365D' }}>{user.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8125rem' }}>
                <span style={{ color: '#64748B' }}>Assigned Unit:</span>
                <strong style={{ color: '#1A365D' }}>{user.unit}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8125rem' }}>
                <span style={{ color: '#64748B' }}>Verification Serial:</span>
                <strong style={{ color: '#008751', fontFamily: 'monospace' }}>{certificateData.serialNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: '#64748B' }}>Email Dispatch:</span>
                <span style={{ color: certificateData.emailSent ? '#008751' : '#64748B', fontWeight: '600' }}>
                  {certificateData.emailSent ? `Sent to ${certificateData.recipientEmail}` : 'Certificate generated'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {certificateData.pdfBase64 && (
                <button
                  type="button"
                  onClick={() => downloadPdfFile(certificateData.pdfBase64, certificateData.fileName)}
                  style={{
                    flex: 1,
                    height: '42px',
                    backgroundColor: '#008751',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '700',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Download size={16} />
                  Download PDF
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowCertModal(false)}
                style={{
                  padding: '0 20px',
                  height: '42px',
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
