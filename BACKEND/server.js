require('dotenv').config();
const app = require('./app');
const connectDB = require('./db/connection');

// Connect to MySQL database via Sequelize and sync schema
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
