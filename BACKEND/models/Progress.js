const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Progress = sequelize.define('Progress', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  materialId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'materials',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'progress',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'materialId'],
      name: 'unique_user_material_progress'
    }
  ]
});

module.exports = Progress;
