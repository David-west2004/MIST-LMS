import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, BookOpen, UserPlus, LogOut, Shield, FileText } from 'lucide-react';
import { api } from '../../services/api';
import mistLogo from '../../assets/MIST.webp';

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

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

  const navItems = [
    { path: '/admin/students', label: 'IT Students', icon: <Users size={18} /> },
    { path: '/admin/curriculum', label: 'Curriculums', icon: <BookOpen size={18} /> },
    { path: '/admin/assignments', label: 'Assignments', icon: <FileText size={18} /> },
    { path: '/admin/invites', label: 'Send Invites', icon: <UserPlus size={18} /> }
  ];

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logoContainer}>
            <img 
              src={mistLogo} 
              alt="MIST Logo" 
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }} 
            />
            <span style={styles.logoText}>MIST Admin</span>
          </div>
          <p style={styles.sidebarSubtitle}>IT Portal Controller</p>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={styles.navLink(isActive)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.adminProfile}>
            <span style={styles.adminName}>{user.name || 'Admin'}</span>
            <span style={styles.adminRole}>Administrator</span>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={styles.mainContent}>
        <header style={styles.topbar}>
          <h2 style={styles.topbarTitle}>
            {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </h2>
        </header>

        <div style={styles.pageContent}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)',
  },
  sidebar: {
    width: '260px',
    backgroundColor: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
  },
  sidebarHeader: {
    padding: '24px',
    borderBottom: '1px solid var(--border-color)',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    fontSize: '1.25rem',
    color: '#ffffff',
    letterSpacing: '0.5px',
  },
  sidebarSubtitle: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '4px',
    fontWeight: '500',
  },
  nav: {
    flex: 1,
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  navLink: (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    color: isActive ? '#ffffff' : 'var(--text-secondary)',
    backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
    fontWeight: isActive ? '600' : '500',
    fontSize: '0.9375rem',
    transition: 'all var(--transition-fast)',
    boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
  }),
  sidebarFooter: {
    padding: '24px 16px',
    borderTop: '1px solid var(--border-color)',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  adminProfile: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '12px',
    padding: '0 8px',
  },
  adminName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#ffffff',
  },
  adminRole: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  mainContent: {
    flex: 1,
    marginLeft: '260px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  topbar: {
    height: '72px',
    backgroundColor: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 32px',
  },
  topbarTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  pageContent: {
    flex: 1,
    padding: '32px',
    overflowY: 'auto',
  }
};

export default DashboardLayout;
