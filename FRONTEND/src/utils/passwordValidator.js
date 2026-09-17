export const SPECIAL_CHARACTERS = '@$!%*?&#^()_+-=[]{}|;:,.<>';

export const validatePasswordCriteria = (password = '') => {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  // Matches any character in the allowed special symbols list: @$!%*?&#^()_+-=[]{}|;:,.<>
  const hasSpecial = /[@$!%*?&#^()_+\-=[\]{}|;:,.<>]/.test(password);

  const isValid = minLength && hasUpper && hasLower && hasDigit && hasSpecial;

  return {
    minLength,
    hasUpper,
    hasLower,
    hasDigit,
    hasSpecial,
    isValid
  };
};

export const PASSWORD_RULES = [
  { key: 'minLength', label: 'At least 8 characters' },
  { key: 'hasUpper', label: 'At least one uppercase letter (A-Z)' },
  { key: 'hasLower', label: 'At least one lowercase letter (a-z)' },
  { key: 'hasDigit', label: 'At least one number (0-9)' },
  { key: 'hasSpecial', label: 'At least one special symbol (@$!%*?&#^()_+-=[]{}|;:,.<>)' },
];
