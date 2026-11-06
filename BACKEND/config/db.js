const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'mist_lms_db',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || '',
  {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`MySQL Connected successfully via Sequelize: ${process.env.MYSQL_HOST || 'localhost'}:${process.env.MYSQL_PORT || 3306}/${process.env.MYSQL_DATABASE || 'mist_lms_db'}`);
    await sequelize.sync();
    console.log('Sequelize models synchronized successfully with MySQL.');
  } catch (error) {
    console.error(`Unable to connect to MySQL database: ${error.message}`);
  }
};

module.exports = {
  sequelize,
  connectDB
};
