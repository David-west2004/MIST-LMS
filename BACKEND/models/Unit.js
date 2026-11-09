const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Unit = sequelize.define('Unit', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'units',
  timestamps: true
});

module.exports = Unit;
