require('dotenv').config({ path: '../.env' });
const { sequelize, User, Material } = require('../models');

const seedData = async () => {
  try {
    const supervisorEmail = process.env.SUPERVISOR_EMAIL || process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || 'supervisor@mist.gov.ng';
    const supervisorPassword = process.env.SUPERVISOR_PASSWORD || process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || 'SupervisorSecure2026!';
    const supervisorName = process.env.SUPERVISOR_NAME || process.env.ADMIN_NAME || process.env.SEED_ADMIN_NAME || 'MIST Portal Supervisor';

    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('MySQL connected and schema synchronized for seeding.');

    // Clear existing materials
    await Material.destroy({ where: {} });
    console.log('Cleared all curriculum/material data.');

    // Clear existing supervisor and students to avoid state conflicts
    await User.destroy({ where: { email: supervisorEmail } });
    await User.destroy({ where: { role: 'student' } });

    // Create fresh supervisor record so beforeCreate hook handles password hashing cleanly
    const supervisor = await User.create({
      name: supervisorName,
      email: supervisorEmail,
      password: supervisorPassword,
      role: 'supervisor',
      unit: 'Administration'
    });

    console.log(`Successfully seeded supervisor account: ${supervisor.email}`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
