import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Menu, 
  X, 
  BookOpen, 
  CalendarCheck, 
  FileText, 
  LogOut 
} from 'lucide-react';
import mistLogo from '../assets/MIST.webp';
import { api } from '../services/api';

const StudentNavbar = ({ user }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err.message);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('attendanceSummary');
      sessionStorage.removeItem('attendanceJustLogged');
      navigate('/login');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="student-navbar">
      <div className="student-navbar-inner">
        {/* Brand Crest & Portal Title */}
        <Link to="/student/curriculum" className="student-navbar-brand">
          <img 
            src={mistLogo} 
            alt="Lagos State MIST Coat of Arms" 
            className="student-navbar-crest"
          />
          <div className="student-navbar-title-block">
            <span className="student-navbar-title">Student IT Portal</span>
            <span className="student-navbar-subtitle">Lagos State Ministry of Innovation, Science & Technology</span>
          </div>
        </Link>

        {/* Desktop Interactive Pill: Attendance Logged Today (Links to /student/attendance) */}
        <div className="student-navbar-desktop-center">
          <Link 
            to="/student/attendance" 
            className="student-navbar-attendance-pill"
            title="View Attendance & Clearance Matrix"
          >
            <CheckCircle2 size={16} className="student-pill-check" />
            <span>Attendance Logged for Today</span>
            <span className="student-pill-action">View Matrix →</span>
          </Link>
        </div>

        {/* Desktop Navigation Links & Controls */}
        <div className="student-navbar-desktop-right">
          <div className="student-navbar-nav-links">
            <Link 
              to="/student/curriculum" 
              className={`student-nav-link ${isActive('/student/curriculum') ? 'active' : ''}`}
            >
              <BookOpen size={14} />
              <span>Curriculum</span>
            </Link>

            <Link 
              to="/student/attendance" 
              className={`student-nav-link ${isActive('/student/attendance') ? 'active' : ''}`}
            >
              <CalendarCheck size={14} />
              <span>Attendance & Clearance</span>
            </Link>

            <Link 
              to="/student/assignments" 
              className={`student-nav-link ${isActive('/student/assignments') ? 'active' : ''}`}
            >
              <FileText size={14} />
              <span>Assignments</span>
            </Link>
          </div>

          <div className="student-navbar-divider" />

          {/* Unit Badge */}
          <div className="student-unit-badge">
            <span className="unit-label">UNIT</span>
            <span className="unit-val">{user?.unit || 'GENERAL'}</span>
          </div>

          {/* User Meta */}
          <div className="student-user-meta">
            <span className="user-name">{user?.name || 'Student Intern'}</span>
            <span className="user-id">{user?.matricNumber || user?.email}</span>
          </div>

          {/* Sign Out Button */}
          <button 
            type="button" 
            onClick={handleLogout} 
            className="student-btn-exit"
            title="Sign out of portal"
          >
            <LogOut size={13} />
            <span>Exit</span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button 
          type="button"
          className="student-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Collapsible Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="student-mobile-drawer">
          <div className="student-mobile-attendance-box">
            <Link 
              to="/student/attendance" 
              className="student-mobile-attendance-btn"
              onClick={() => setMobileMenuOpen(false)}
            >
              <CheckCircle2 size={18} color="#10B981" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '700', fontSize: '0.8125rem', color: '#FFFFFF' }}>
                  Attendance Logged for Today
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#93C5FD' }}>
                  Open Attendance Matrix & Clearance →
                </div>
              </div>
            </Link>
          </div>

          <div className="student-mobile-links">
            <Link 
              to="/student/curriculum" 
              className={`student-mobile-link ${isActive('/student/curriculum') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <BookOpen size={18} />
              <span>Curriculum Workspace</span>
            </Link>

            <Link 
              to="/student/attendance" 
              className={`student-mobile-link ${isActive('/student/attendance') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <CalendarCheck size={18} />
              <span>Attendance & Clearance Matrix</span>
            </Link>

            <Link 
              to="/student/assignments" 
              className={`student-mobile-link ${isActive('/student/assignments') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <FileText size={18} />
              <span>Assignments & Submissions</span>
            </Link>
          </div>

          <div className="student-mobile-footer">
            <div className="student-mobile-user-row">
              <div>
                <div style={{ fontWeight: '700', color: '#FFFFFF', fontSize: '0.8125rem' }}>
                  {user?.name || 'Student Intern'}
                </div>
                <div style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>
                  Unit: {user?.unit || 'General'} • {user?.matricNumber || user?.email}
                </div>
              </div>
            </div>

            <button 
              type="button" 
              onClick={handleLogout} 
              className="student-mobile-logout-btn"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default StudentNavbar;
