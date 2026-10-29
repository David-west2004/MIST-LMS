import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import StudentNavbar from '../../components/StudentNavbar';
import { 
  Calendar, 
  CheckCircle2, 
  Award, 
  Download, 
  Clock, 
  Lock, 
  ShieldCheck, 
  FileCheck, 
  Layers, 
  AlertCircle 
} from 'lucide-react';
import './StudentAttendancePage.css';

const StudentAttendancePage = () => {
  const [attendanceSummary, setAttendanceSummary] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('attendanceSummary') || 'null');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestingLetter, setRequestingLetter] = useState(false);
  const [certificateData, setCertificateData] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);

  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));

  const fetchAttendanceData = async () => {
    try {
      const res = await api.getMyAttendanceSummary();
      if (res?.data) {
        setAttendanceSummary(res.data);
        localStorage.setItem('attendanceSummary', JSON.stringify(res.data));
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve attendance record telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const handleRequestCompletionLetter = async () => {
    setRequestingLetter(true);
    setError('');

    try {
      const res = await api.requestCompletionLetter();
      setCertificateData(res.data);
      setShowCertModal(true);

      const updatedUser = { ...user, isClearedForCompletion: true };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      await fetchAttendanceData();
    } catch (err) {
      setError(err.message || 'Failed to generate official completion certificate.');
    } finally {
      setRequestingLetter(false);
    }
  };

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

  const durationWeeks = attendanceSummary?.durationWeeks || user.siwesDurationWeeks || 24;
  const targetDays = durationWeeks * 3;

  const eligibility = attendanceSummary?.eligibility || {
    eligible: false,
    totalDays: attendanceSummary?.daysLogged || 0,
    targetDays,
    compliantWeeks: attendanceSummary?.weeksCleared || 0,
    targetWeeks: durationWeeks,
    missingWeeks: [],
    weeklyBreakdown: {}
  };

  const currentWeekNum = attendanceSummary?.currentWeek || 1;
  const isCleared = user.isClearedForCompletion || false;
  const clearancePct = Math.min(100, Math.round(((eligibility.compliantWeeks || 0) / durationWeeks) * 100));

  const durationLabel = user.siwesDuration === '3_months'
    ? '3 Months (12 Weeks)'
    : user.siwesDuration === '1_year'
      ? '1 Year (52 Weeks)'
      : '6 Months (24 Weeks)';

  return (
    <div className="attendance-page-container">
      {/* Reusable Mobile-Responsive Student Navigation Bar */}
      <StudentNavbar user={user} />

      <main className="attendance-page-content">
        {/* Hero Banner */}
        <section className="attendance-hero-banner">
          <div className="attendance-hero-info">
            <h2>SIWES Attendance & Clearance Matrix</h2>
            <p>
              Your daily attendance is automatically verified and logged when you log into the portal.
              A minimum of 3 check-ins per week is required to earn SIWES completion clearance.
            </p>
          </div>

          <div className="attendance-hero-pill">
            <CheckCircle2 size={18} />
            <span>Daily Check-in Active for Today</span>
          </div>
        </section>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #F87171',
            borderRadius: '8px',
            color: '#B91C1C',
            marginBottom: '20px',
            fontSize: '0.875rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Overview Stat Cards (grid-cols-1 sm:grid-cols-3 gap-4) */}
        <section className="attendance-stats-grid">
          <div className="attendance-stat-card green">
            <div className="stat-card-top">
              <span className="stat-card-label">Total Days Logged</span>
              <div className="stat-card-icon green">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="stat-card-value">
              {eligibility.totalDays} / {eligibility.targetDays}
            </div>
            <div className="stat-card-sub">
              Target for {durationLabel}
            </div>
          </div>

          <div className="attendance-stat-card blue">
            <div className="stat-card-top">
              <span className="stat-card-label">Weeks Cleared</span>
              <div className="stat-card-icon blue">
                <Award size={18} />
              </div>
            </div>
            <div className="stat-card-value">
              {eligibility.compliantWeeks} / {durationWeeks}
            </div>
            <div className="stat-card-sub">
              Weeks with at least 3 daily check-ins
            </div>
          </div>

          <div className="attendance-stat-card amber">
            <div className="stat-card-top">
              <span className="stat-card-label">Current Active Week</span>
              <div className="stat-card-icon amber">
                <Clock size={18} />
              </div>
            </div>
            <div className="stat-card-value">
              Week {currentWeekNum}
            </div>
            <div className="stat-card-sub">
              Tenure progress: Week {currentWeekNum} of {durationWeeks}
            </div>
          </div>
        </section>

        {/* 2. 24-Week Matrix Grid (grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3) */}
        <section className="attendance-matrix-section">
          <div className="attendance-matrix-header">
            <div className="matrix-title-group">
              <h3>Weekly Verification Matrix ({durationWeeks} Weeks)</h3>
              <p>Each card displays verified logins for that specific calendar week</p>
            </div>

            <div className="matrix-legend-row">
              <span className="legend-tag">
                <span className="legend-chip green" /> Cleared (3/3 Days)
              </span>
              <span className="legend-tag">
                <span className="legend-chip blue" /> Current Active Week
              </span>
              <span className="legend-tag">
                <span className="legend-chip amber" /> Deficit Week
              </span>
              <span className="legend-tag">
                <span className="legend-chip gray" /> Upcoming
              </span>
            </div>
          </div>

          <div className="attendance-weeks-grid">
            {Array.from({ length: durationWeeks }).map((_, i) => {
              const weekNum = i + 1;
              const count = eligibility.weeklyBreakdown?.[weekNum] || 0;
              const isClearedWeek = count >= 3;
              const isCurrent = weekNum === currentWeekNum;
              const isPast = weekNum < currentWeekNum;

              let cardClass = 'status-pending';
              let badgeText = '0/3 Days';
              let badgeStatus = 'pending';

              if (isClearedWeek) {
                cardClass = 'status-cleared';
                badgeText = '3/3 Days • Cleared';
                badgeStatus = 'cleared';
              } else if (isCurrent) {
                cardClass = 'status-active';
                badgeText = `${count}/3 Days • Active`;
                badgeStatus = 'active';
              } else if (isPast) {
                cardClass = 'status-deficit';
                badgeText = `${count}/3 Days • Deficit`;
                badgeStatus = 'deficit';
              } else {
                badgeText = '0/3 Days • Pending';
                badgeStatus = 'pending';
              }

              return (
                <div 
                  key={weekNum} 
                  className={`attendance-week-card ${cardClass} ${isCurrent ? 'is-current' : ''}`}
                >
                  <div className="week-card-top-row">
                    <span className="week-card-title">Week {String(weekNum).padStart(2, '0')}</span>
                    {isCurrent && <span className="current-indicator-badge">ACTIVE</span>}
                  </div>
                  <div className={`week-badge-indicator ${badgeStatus}`}>
                    {badgeText}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Clearance Gate Card */}
        <section className={`attendance-clearance-card ${isCleared ? 'cleared' : eligibility.eligible ? 'eligible' : 'locked'}`}>
          <div className="clearance-card-left">
            <div className="clearance-icon-wrapper">
              {isCleared ? (
                <Award size={28} color="#008751" />
              ) : eligibility.eligible ? (
                <ShieldCheck size={28} color="#008751" />
              ) : (
                <Lock size={26} color="#64748B" />
              )}
            </div>

            <div className="clearance-text-block">
              <h4 className="clearance-heading">
                {isCleared 
                  ? 'Official SIWES Clearance Granted & Validated' 
                  : eligibility.eligible 
                    ? 'Clearance Unlocked: Ready to Request Completion Letter' 
                    : 'Clearance Gate Locked'}
              </h4>
              <p className="clearance-sub">
                {isCleared 
                  ? 'Your SIWES completion credentials and formal certificate have been verified and issued by MIST.' 
                  : eligibility.eligible 
                    ? 'Congratulations! You have satisfied the required 3 logins for all weeks of your SIWES tenure. You may now generate your official Completion Letter.' 
                    : `Requires at least 3 daily check-ins for every single week of your tenure. (${eligibility.missingWeeks?.length || (durationWeeks - (eligibility.compliantWeeks || 0))} week(s) pending compliance).`}
              </p>

              {/* Progress Bar */}
              <div className="clearance-progress-box">
                <div className="clearance-progress-labels">
                  <span className="clearance-progress-title">Clearance Requirement Progress</span>
                  <span className="clearance-progress-stat">
                    {eligibility.compliantWeeks} of {durationWeeks} Weeks Cleared ({clearancePct}%)
                  </span>
                </div>
                <div className="clearance-progress-track">
                  <div 
                    className="clearance-progress-bar" 
                    style={{ width: `${clearancePct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="clearance-action-box">
            {isCleared ? (
              <button
                type="button"
                onClick={handleRequestCompletionLetter}
                disabled={requestingLetter}
                className="btn-request-clearance download"
              >
                <Download size={16} />
                {requestingLetter ? 'Loading Certificate...' : 'Download Certificate (PDF)'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRequestCompletionLetter}
                disabled={!eligibility.eligible || requestingLetter}
                className={`btn-request-clearance ${eligibility.eligible ? 'unlocked' : 'locked'}`}
              >
                {eligibility.eligible ? <FileCheck size={16} /> : <Lock size={15} />}
                {requestingLetter 
                  ? 'Generating PDF Certificate...' 
                  : eligibility.eligible 
                    ? 'Request Official Completion Letter' 
                    : 'Clearance Locked'}
              </button>
            )}
          </div>
        </section>
      </main>

      {/* Certificate Modal */}
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
                SIWES Completion Certificate Issued!
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
                    minHeight: '44px',
                    backgroundColor: '#008751',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
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
                  minHeight: '44px',
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
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

export default StudentAttendancePage;
