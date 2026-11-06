const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM(
      'student',
      'supervisor'
    ),
    defaultValue: 'student'
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  isBlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  inviteToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tokenExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastActive: {
    type: DataTypes.DATE,
    allowNull: true
  },
  siwesDuration: {
    type: DataTypes.ENUM('3_months', '6_months', '1_year'),
    defaultValue: '6_months'
  },
  siwesDurationWeeks: {
    type: DataTypes.INTEGER,
    defaultValue: 24
  },
  siwesStartDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  siwesEndDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  institution: {
    type: DataTypes.STRING,
    allowNull: true
  },
  matricNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isClearedForCompletion: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password') && user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

User.prototype.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
