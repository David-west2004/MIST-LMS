const { sequelize, connectDB } = require('../config/db');

module.exports = connectDB;
module.exports.sequelize = sequelize;
module.exports.connectDB = connectDB;
