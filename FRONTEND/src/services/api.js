const BASE_URL = 'http://localhost:5000/api';

class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
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

  // Progress Tracking
  toggleMaterialStatus: (materialId) => request('/progress/toggle', {
    method: 'POST',
    body: JSON.stringify({ materialId })
  }),
  getMyProgress: () => request('/progress/my-progress'),
  getStudentProgress: (studentId) => request(`/progress/student/${studentId}`),

  // Student Administration (Admin-only)
  getAllStudents: () => request('/students'),
  toggleBlockStudent: (id, isBlocked) => request(`/students/${id}/block`, {
    method: 'PATCH',
    body: JSON.stringify({ isBlocked })
  }),
  updateStudentUnit: (id, unit) => request(`/students/${id}/unit`, {
    method: 'PATCH',
    body: JSON.stringify({ unit })
  })
};
export { APIError };
