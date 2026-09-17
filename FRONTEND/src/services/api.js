const BASE_URL = 'http://localhost:5000/api';

class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // 403 Forbidden interceptor for account suspension
      if (response.status === 403 && data.message && data.message.toLowerCase().includes('suspended')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/blocked';
      }

      // 401 Unauthorized redirect to login (unless trying to log in)
      if (response.status === 401 && endpoint !== '/auth/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }

      throw new APIError(data.message || 'API request failed', response.status);
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError('Network error, please try again.', 500);
  }
};

export const api = {
  // Authentication
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  inviteStudent: (name, email, unit) => request('/auth/invite', {
    method: 'POST',
    body: JSON.stringify({ name, email, unit })
  }),
  verifyInviteToken: (token) => request(`/auth/verify-invite/${token}`),
  completeRegistration: (token, password) => request('/auth/register-invited', {
    method: 'POST',
    body: JSON.stringify({ token, password })
  }),
  resetPassword: (token, newPassword) => request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword })
  }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),

  // Curriculum Management
  getMyCurriculum: () => request('/curriculum/my-unit'),
  getCurricula: () => request('/curriculum'),
  createCurriculum: (unit, modules) => request('/curriculum', {
    method: 'POST',
    body: JSON.stringify({ unit, modules })
  }),
  updateCurriculum: (id, data) => request(`/curriculum/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteCurriculum: (id) => request(`/curriculum/${id}`, {
    method: 'DELETE'
  }),
  getCurriculumByUnit: (unit) => request(`/curriculum/unit/${encodeURIComponent(unit)}`),
  uploadMaterialFile: (formData) => request('/curriculum/upload', {
    method: 'POST',
    body: formData
  }),

  // Progress Tracking
  toggleMaterialStatus: (materialId) => request('/progress/toggle', {
    method: 'POST',
    body: JSON.stringify({ materialId })
  }),
  getMyProgress: () => request('/progress/my-progress'),
  getStudentProgress: (studentId) => request(`/progress/student/${studentId}`),

  // Assignment Management
  getAllAdminAssignments: (unit) => request(unit ? `/assignments?unit=${encodeURIComponent(unit)}` : '/assignments'),
  getMyAssignments: () => request('/assignments/my-unit'),
  getAssignmentsByUnit: (unit) => request(`/assignments/unit/${encodeURIComponent(unit)}`),
  createAssignment: (data) => request('/assignments', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteAssignment: (id) => request(`/assignments/${id}`, {
    method: 'DELETE'
  }),
  submitAssignmentFile: (id, formData) => request(`/assignments/${id}/submit`, {
    method: 'POST',
    body: formData
  }),

  // Student Administration (Admin-only)
  getAllStudents: () => request('/students'),
  toggleBlockStudent: (id, isBlocked) => request(`/students/${id}/block`, {
    method: 'PATCH',
    body: JSON.stringify({ isBlocked })
  }),
  updateStudent: (id, data) => request(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  updateStudentUnit: (id, unit) => request(`/students/${id}/unit`, {
    method: 'PATCH',
    body: JSON.stringify({ unit })
  })
};

export { APIError };
