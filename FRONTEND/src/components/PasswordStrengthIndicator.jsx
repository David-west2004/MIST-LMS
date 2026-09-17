import React from 'react';
import { Check, X } from 'lucide-react';
import { validatePasswordCriteria, PASSWORD_RULES } from '../utils/passwordValidator';

const PasswordStrengthIndicator = ({ password = '' }) => {
  const criteria = validatePasswordCriteria(password);

  return (
    <div style={styles.container}>
      <span style={styles.title}>Password Requirements:</span>
      <ul style={styles.list}>
        {PASSWORD_RULES.map((rule) => {
          const isMet = criteria[rule.key];
          return (
            <li key={rule.key} style={styles.item(isMet)}>
              <span style={styles.iconWrapper(isMet)}>
                {isMet ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
              </span>
              <span style={{ color: isMet ? '#006633' : '#718096' }}>
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const styles = {
  container: {
    marginTop: '8px',
    marginBottom: '16px',
    padding: '10px 12px',
    backgroundColor: '#F7FAFC',
    borderRadius: '6px',
    border: '1px solid #E2E8F0',
    fontSize: '0.8125rem',
  },
  title: {
    display: 'block',
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: '6px',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  item: (isMet) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.75rem',
    transition: 'color 0.15s ease',
  }),
  iconWrapper: (isMet) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: isMet ? '#DEF7EC' : '#EDF2F7',
    color: isMet ? '#006633' : '#A0AEC0',
    flexShrink: 0,
  }),
};

export default PasswordStrengthIndicator;
