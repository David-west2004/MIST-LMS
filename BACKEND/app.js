const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const curriculumRoutes = require('./routes/curriculumRoutes');
const progressRoutes = require('./routes/progressRoutes');
const studentRoutes = require('./routes/studentRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const clearanceRoutes = require('./routes/clearanceRoutes');
const unitRoutes = require('./routes/unitRoutes');
const { registerNewStudent } = require('./controller/authController');
const { protect, restrictTo } = require('./middleware/auth');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Mount routers
app.use('/api/auth', authRoutes);
app.post('/api/admin/invite', protect, restrictTo('supervisor'), registerNewStudent);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/clearance', clearanceRoutes);
app.use('/api/units', unitRoutes);

// Default API health status route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'MIST Student IT Portal API is running.'
  });
});

// Handle unmapped routes
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

module.exports = app;
