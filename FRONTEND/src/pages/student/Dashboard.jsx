import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import StudentNavbar from '../../components/StudentNavbar';
import AttendanceGreetingModal from '../../components/AttendanceGreetingModal';
import { 
  ExternalLink, 
  Check, 
  Search, 
  BookOpen, 
  CalendarCheck, 
  Layers, 
  ArrowRight,
  List,
  Compass,
  FileText
} from 'lucide-react';
import './StudentDashboard.css';

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
  const [showGreeting, setShowGreeting] = useState(false);
  const [mobileSyllabusOpen, setMobileSyllabusOpen] = useState(false);

  // Attendance summary for active week pill
  const [attendanceSummary, setAttendanceSummary] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('attendanceSummary') || 'null');
    } catch {
      return null;
    }
  });

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
        localStorage.setItem('attendanceSummary', JSON.stringify(attRes.data));
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

    // Trigger animated greeting overlay if attendance was logged during this session
    if (sessionStorage.getItem('attendanceJustLogged') === 'true') {
      setShowGreeting(true);
      sessionStorage.removeItem('attendanceJustLogged');
    }
  }, []);

  // Material Status Toggle
  const handleToggleMaterial = async (materialId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.toggleMaterialStatus(materialId);
      setCompletedMaterials(res.data.completedMaterials);
      setPercentage(res.data.percentage);
    } catch (err) {
      console.error('Error toggling material status:', err.message);
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
        mat.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mat.type?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [currentModule, filterType, searchQuery]);

  if (loading) {
    return (
      <div className="lms-empty-state">
        <div className="lms-empty-card" style={{ maxWidth: '420px', textAlign: 'center' }}>
          <div className="lms-pulse-indicator" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#1A365D', fontWeight: '700', marginBottom: '8px' }}>
            Loading Curriculum
          </h3>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Synchronizing curriculum syllabus and progress...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="lms-console">
      {/* 1. REUSABLE RESPONSIVE NAVBAR */}
      <StudentNavbar user={user} />

      {/* 2. ANIMATED ATTENDANCE LOGIN OVERLAY */}
      <AttendanceGreetingModal
        isOpen={showGreeting}
        onClose={() => setShowGreeting(false)}
        studentName={user.name}
        currentWeek={attendanceSummary?.currentWeek}
      />

      {/* 3. DEDICATED CURRICULUM WORKBENCH (NO MATRIX POLLUTION) */}
      {error ? (
        <main className="lms-empty-state">
          <div className="lms-empty-card">
            <div className="lms-empty-header">
              <span className="lms-empty-title">Curriculum Not Available</span>
            </div>
            <p className="lms-empty-text" style={{ color: '#DC2626', marginBottom: '12px' }}>
              {error}
            </p>
            <p className="lms-empty-text">
              No learning curriculum is currently registered for unit <strong>"{user.unit}"</strong>. 
              Please contact your designated MIST supervisor.
            </p>
          </div>
        </main>
      ) : modules.length === 0 ? (
        <main className="lms-empty-state">
          <div className="lms-empty-card">
            <div className="lms-empty-header">
              <span className="lms-empty-title">No Modules Published</span>
            </div>
            <p className="lms-empty-text">
              Your assigned unit <strong>"{user.unit}"</strong> has no curriculum modules published yet. 
              Modules will appear as soon as the administrative team publishes them.
            </p>
          </div>
        </main>
      ) : (
        <div className="lms-workbench">
          {/* MOBILE SYLLABUS ACCORDION TOGGLE (< 768px) */}
          <div className="lms-mobile-syllabus-trigger">
            <button 
              type="button"
              className="lms-mobile-module-btn"
              onClick={() => setMobileSyllabusOpen(!mobileSyllabusOpen)}
            >
              <List size={18} />
              <span>
                {currentModule ? `Module ${activeModuleIndex + 1}: ${currentModule.title}` : 'Select Module'}
              </span>
              <span className="lms-mobile-badge">{modules.length} Modules</span>
            </button>
          </div>

          {/* ZONE 1: MODULE NAVIGATION RAIL (LEFT) */}
          <aside className={`lms-nav-rail ${mobileSyllabusOpen ? 'mobile-open' : ''}`}>
            <div className="lms-rail-header">
              <span className="lms-rail-title">Syllabus Modules</span>
              <span className="lms-rail-count">{modules.length} Modules</span>
            </div>

            <div className="lms-module-nav-list">
              {modules.map((mod, index) => {
                const modMaterials = mod.materials || [];
                const modCompleted = modMaterials.filter(m => completedMaterials.includes(m._id)).length;
                const isModComplete = modMaterials.length > 0 && modCompleted === modMaterials.length;
                const isActive = index === activeModuleIndex;

                let statusClass = 'pending';
                let statusLabel = 'Pending';
                if (isModComplete) {
                  statusClass = 'complete';
                  statusLabel = 'Completed';
                } else if (modCompleted > 0 || isActive) {
                  statusClass = 'active';
                  statusLabel = 'In Progress';
                }

                const fillWidth = modMaterials.length > 0 
                  ? Math.round((modCompleted / modMaterials.length) * 100) 
                  : 0;

                return (
                  <button
                    key={mod._id || index}
                    onClick={() => {
                      setActiveModuleIndex(index);
                      setMobileSyllabusOpen(false);
                      if (modMaterials.length > 0) {
                        setSelectedMaterial(modMaterials[0]);
                      }
                    }}
                    className={`lms-module-nav-item ${isActive ? 'is-active' : ''} ${isModComplete ? 'is-completed' : ''}`}
                  >
                    <div className="lms-nav-item-top">
                      <span className="lms-nav-item-index">Module {index + 1}</span>
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
                        {modCompleted} of {modMaterials.length}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Link to Attendance Page at rail bottom */}
            <div className="lms-rail-footer">
              <Link to="/student/attendance" className="lms-rail-attendance-link">
                <CalendarCheck size={16} />
                <span>View Attendance Matrix →</span>
              </Link>
            </div>
          </aside>

          {/* ZONE 2: MODULE RESOURCES (CENTER) */}
          <main className="lms-stage">
            {/* Toolbar: Category Filters & Search */}
            <div className="lms-stage-toolbar">
              <div className="lms-filter-tabs">
                {[
                  { id: 'all', label: 'All Resources' },
                  { id: 'video', label: 'Videos' },
                  { id: 'pdf', label: 'PDFs' },
                  { id: 'doc', label: 'Documents' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterType(tab.id)}
                    className={`lms-filter-btn ${filterType === tab.id ? 'is-active' : ''}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="lms-search-box">
                <Search size={14} style={{ color: '#64748B' }} />
                <input 
                  type="text" 
                  className="lms-search-input" 
                  placeholder="Search module resources..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Active Module Header */}
            {currentModule && (
              <div className="lms-module-briefing">
                <div className="lms-briefing-meta">
                  <span className="lms-briefing-code">
                    Module {activeModuleIndex + 1}
                  </span>
                  <span className="lms-briefing-unit">
                    {user.unit ? `${user.unit} Track` : 'General Track'}
                  </span>
                </div>
                <h2 className="lms-briefing-title">{currentModule.title}</h2>
                {currentModule.description && (
                  <p className="lms-briefing-desc">{currentModule.description}</p>
                )}
              </div>
            )}

            {/* Resource Items Deck */}
            <div className="lms-materials-deck">
              {displayedMaterials.length === 0 ? (
                <div className="lms-no-materials">
                  No learning resources match the current filter.
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
                          {mat.type === 'link' ? 'LINK' : mat.type}
                        </span>
                      </div>

                      <div className="lms-mat-info">
                        <span className="lms-mat-title">{mat.title}</span>
                        <div className="lms-mat-sub">
                          <span className="lms-mat-source">
                            {mat.url ? mat.url.replace(/^https?:\/\//, '').split('/')[0] : 'Resource Link'}
                          </span>
                          {isDone && (
                            <span className="lms-mat-completed-pill">Completed ✓</span>
                          )}
                        </div>
                      </div>

                      <div className="lms-mat-actions">
                        <a 
                          href={mat.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="lms-btn-launch"
                          onClick={(e) => e.stopPropagation()}
                          title="Open external resource"
                        >
                          <span>Open Resource</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>

                      <div className="lms-verify-control">
                        <button 
                          type="button"
                          className={`lms-checkbox-custom ${isDone ? 'checked' : ''}`}
                          onClick={(e) => handleToggleMaterial(mat._id, e)}
                          title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                          aria-label={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                        >
                          {isDone && <Check size={14} strokeWidth={3} />}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </main>

          {/* ZONE 3: PERFORMANCE DECK (RIGHT) */}
          <aside className="lms-telemetry-deck">
            {/* Bento 1: Progress Vector */}
            <div className="lms-bento-panel">
              <div className="lms-panel-label">
                <span>Curriculum Completion</span>
                <span className="lms-live-dot">● Active</span>
              </div>

              <div className="lms-progress-figure">
                <span className="lms-big-percent">{percentage}%</span>
                <span className="lms-percent-label">COMPLETED</span>
              </div>

              {/* Segmented Meter */}
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
                  <div className="lms-tally-title">Completed</div>
                  <div className="lms-tally-val green">
                    {completedCount} <span className="lms-tally-unit">Resources</span>
                  </div>
                </div>

                <div className="lms-tally-box">
                  <div className="lms-tally-title">Remaining</div>
                  <div className="lms-tally-val amber">
                    {remainingCount} <span className="lms-tally-unit">Resources</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento 2: Selected Resource Inspector */}
            <div className="lms-bento-panel" style={{ flex: 1 }}>
              <div className="lms-panel-label">
                <span>Resource Details</span>
                <BookOpen size={14} style={{ color: '#1A365D' }} />
              </div>

              {selectedMaterial ? (
                <div className="lms-inspector-box">
                  <h4 className="lms-inspector-target">
                    {selectedMaterial.title}
                  </h4>

                  <div className="lms-inspector-meta-group">
                    <div className="lms-inspector-meta-row">
                      <span className="lms-inspector-k">Format</span>
                      <span className="lms-inspector-v">{selectedMaterial.type?.toUpperCase()}</span>
                    </div>
                    <div className="lms-inspector-meta-row">
                      <span className="lms-inspector-k">Status</span>
                      <span className={`lms-inspector-v ${completedMaterials.includes(selectedMaterial._id) ? 'green' : 'amber'}`}>
                        {completedMaterials.includes(selectedMaterial._id) ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                    <div className="lms-inspector-meta-row">
                      <span className="lms-inspector-k">Host</span>
                      <span className="lms-inspector-v">
                        {selectedMaterial.url ? selectedMaterial.url.replace(/^https?:\/\//, '').split('/')[0] : 'Direct'}
                      </span>
                    </div>
                  </div>

                  <a 
                    href={selectedMaterial.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="lms-inspector-btn"
                  >
                    Open Resource ↗
                  </a>
                </div>
              ) : (
                <div className="lms-inspector-placeholder">
                  Select any resource from the list to view specification and links.
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
