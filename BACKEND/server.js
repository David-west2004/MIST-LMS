require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db/connection');

const authRoutes = require('./routes/authRoutes');
const curriculumRoutes = require('./routes/curriculumRoutes');
const progressRoutes = require('./routes/progressRoutes');
const studentRoutes = require('./routes/studentRoutes');

// Connect to database
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/students', studentRoutes);

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
