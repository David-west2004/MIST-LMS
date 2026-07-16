import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Blocked from './pages/Blocked';
import DashboardLayout from './pages/admin/DashboardLayout';
import Students from './pages/admin/Students';
import Curriculum from './pages/admin/Curriculum';
import Invites from './pages/admin/Invites';
import StudentDashboard from './pages/student/Dashboard';

// Route Guard for authenticated users
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// Route Guard for administrators only
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/login" replace />;

  return children;
};

// Root redirection helper
const RootRedirect = () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/students" replace />;
  return <Navigate to="/student/curriculum" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/blocked" element={<Blocked />} />

        {/* Admin Dashboard Area */}
        <Route path="/admin" element={
          <AdminRoute>
            <DashboardLayout />
          </AdminRoute>
        }>
          <Route path="students" element={<Students />} />
          <Route path="curriculum" element={<Curriculum />} />
          <Route path="invites" element={<Invites />} />
        </Route>

        {/* Student Dashboard Area */}
        <Route path="/student/curriculum" element={
          <PrivateRoute>
            <StudentDashboard />
          </PrivateRoute>
        } />

        {/* Catch-all & Root redirection */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
