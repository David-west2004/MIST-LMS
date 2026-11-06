const { sequelize } = require('../config/db');
const User = require('./User');
const Attendance = require('./Attendance');
const Material = require('./Material');
const Curriculum = require('./Curriculum');
const Assignment = require('./Assignment');
const Submission = require('./Submission');
const Progress = require('./Progress');

// Setup Associations / Relationships
User.hasMany(Attendance, { foreignKey: 'userId', as: 'attendances', onDelete: 'CASCADE' });
Attendance.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Assignment.hasMany(Submission, { foreignKey: 'assignmentId', as: 'submissions', onDelete: 'CASCADE' });
Submission.belongsTo(Assignment, { foreignKey: 'assignmentId', as: 'assignment' });

User.hasMany(Submission, { foreignKey: 'studentId', as: 'submissions', onDelete: 'CASCADE' });
Submission.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

User.hasMany(Progress, { foreignKey: 'userId', as: 'progressList', onDelete: 'CASCADE' });
Progress.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Material.hasMany(Progress, { foreignKey: 'materialId', as: 'progressList', onDelete: 'CASCADE' });
Progress.belongsTo(Material, { foreignKey: 'materialId', as: 'material' });

module.exports = {
  sequelize,
  User,
  Attendance,
  Material,
  Curriculum,
  Assignment,
  Submission,
  Progress
};
