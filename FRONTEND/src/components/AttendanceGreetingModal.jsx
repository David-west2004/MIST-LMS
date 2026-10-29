import React, { useEffect, useState } from 'react';
import { Check, X, Calendar, ShieldCheck } from 'lucide-react';

const AttendanceGreetingModal = ({ isOpen, onClose, studentName, currentWeek }) => {
  const [timeLeft, setTimeLeft] = useState(3.5);

  useEffect(() => {
    if (!isOpen) return;

    // Auto dismiss after 3.5s
    const timer = setTimeout(() => {
      onClose();
    }, 3500);

    // Progress countdown
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 0.1));
    }, 100);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modalCard} className="animate-scale-in">
        {/* Close Icon Top-Right */}
        <button 
          type="button" 
          onClick={onClose} 
          style={styles.closeBtn}
          aria-label="Dismiss notification"
        >
          <X size={18} />
        </button>

        {/* Animated Checkmark Badge with Particle Rings */}
        <div style={styles.badgeWrapper}>
          <div style={styles.pulseRing} />
          <div style={styles.iconCircle}>
            <svg 
              style={styles.svgCheck} 
              viewBox="0 0 52 52"
            >
              <circle 
                style={styles.svgCircle} 
                cx="26" 
                cy="26" 
                r="23" 
                fill="none" 
              />
              <path 
                style={styles.svgCheckmark} 
                fill="none" 
                d="M14.1 27.2l7.1 7.2 16.7-16.8" 
              />
            </svg>
          </div>
        </div>

        {/* Text Content */}
        <div style={styles.content}>
          <span style={styles.tag}>ATTENDANCE VERIFIED</span>
          <h3 style={styles.title}>
            Welcome Back! Daily Attendance Logged.
          </h3>
          <p style={styles.subtitle}>
            {studentName ? `${studentName}, your` : 'Your'} daily check-in for today has been officially logged and credited toward your SIWES tenure.
          </p>

          {currentWeek && (
            <div style={styles.weekPill}>
              <Calendar size={14} color="#008751" />
              <span>Active Period: <strong>Week {currentWeek}</strong></span>
            </div>
          )}
        </div>

        {/* Countdown Bar */}
        <div style={styles.progressTrack}>
          <div 
            style={{
              ...styles.progressBar,
              width: `${(timeLeft / 3.5) * 100}%`
            }} 
          />
        </div>

        {/* Touch-Friendly Got It Button */}
        <button
          type="button"
          onClick={onClose}
          style={styles.confirmBtn}
        >
          Got it
        </button>
      </div>

      {/* Embedded Animation Styles */}
      <style>{`
        @keyframes scaleIn {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes strokePulse {
          0% { stroke-dashoffset: 48; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes circleDraw {
          0% { stroke-dashoffset: 150; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes ringPulse {
          0% { transform: scale(0.85); opacity: 0.8; }
          50% { transform: scale(1.25); opacity: 0; }
          100% { transform: scale(1.25); opacity: 0; }
        }
        .animate-scale-in {
          animation: scaleIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px'
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    maxWidth: '380px',
    width: '100%',
    padding: '28px 24px 22px',
    boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.25)',
    position: 'relative',
    textAlign: 'center',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  closeBtn: {
    position: 'absolute',
    top: '14px',
    right: '14px',
    background: '#F1F5F9',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748B',
    transition: 'all 0.15s ease'
  },
  badgeWrapper: {
    position: 'relative',
    width: '76px',
    height: '76px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px'
  },
  pulseRing: {
    position: 'absolute',
    inset: '-8px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 135, 81, 0.18)',
    animation: 'ringPulse 2s ease-out infinite'
  },
  iconCircle: {
    width: '68px',
    height: '68px',
    borderRadius: '50%',
    backgroundColor: '#F0FDF4',
    border: '2px solid #86EFAC',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 135, 81, 0.15)',
    zIndex: 1
  },
  svgCheck: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    display: 'block'
  },
  svgCircle: {
    strokeDasharray: 150,
    strokeDashoffset: 0,
    strokeWidth: 3,
    strokeMiterlimit: 10,
    stroke: '#008751',
    animation: 'circleDraw 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards'
  },
  svgCheckmark: {
    transformOrigin: '50% 50%',
    strokeDasharray: 48,
    strokeDashoffset: 0,
    strokeWidth: 4,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    stroke: '#008751',
    animation: 'strokePulse 0.4s cubic-bezier(0.65, 0, 0.45, 1) 0.3s forwards'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '18px'
  },
  tag: {
    fontSize: '0.6875rem',
    fontWeight: '700',
    color: '#008751',
    backgroundColor: '#DCFCE7',
    padding: '3px 10px',
    borderRadius: '9999px',
    letterSpacing: '0.06em',
    marginBottom: '10px'
  },
  title: {
    fontSize: '1.15rem',
    fontWeight: '800',
    color: '#1A365D',
    lineHeight: 1.3,
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '0.8125rem',
    color: '#64748B',
    lineHeight: 1.5,
    margin: 0,
    maxWidth: '300px'
  },
  weekPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '12px',
    padding: '4px 12px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    fontSize: '0.75rem',
    color: '#334155'
  },
  progressTrack: {
    width: '100%',
    height: '4px',
    backgroundColor: '#F1F5F9',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '16px'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#008751',
    transition: 'width 0.1s linear'
  },
  confirmBtn: {
    width: '100%',
    minHeight: '44px',
    backgroundColor: '#1A365D',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '0.875rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s ease'
  }
};

export default AttendanceGreetingModal;
