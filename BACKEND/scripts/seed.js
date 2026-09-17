require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../model/User');
const Curriculum = require('../model/Curriculum');

const seedData = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || process.env.SEED_ADMIN_NAME || 'MIST Portal Administrator';

    if (!adminEmail || !adminPassword) {
      console.error('Seeding aborted: Missing ADMIN_EMAIL or ADMIN_PASSWORD.');
      console.error('Please add ADMIN_EMAIL and ADMIN_PASSWORD to your .env file before running seed.');
      process.exit(1);
    }

    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mist_lms';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected for seeding.');

    // Clear existing data to ensure a clean, dynamic app state
    await Curriculum.deleteMany({});
    console.log('Cleared all curriculum/unit data.');

    await User.deleteMany({ role: { $ne: 'admin' } });
    console.log('Cleared all non-admin users.');

    // Delete legacy admin if exists
    await User.deleteOne({ email: 'admin@mist.gov.ng' });

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        unit: 'Administration'
      });
      console.log(`Created default admin account for: ${adminEmail}`);
    } else {
      admin.password = adminPassword;
      if (adminName) admin.name = adminName;
      await admin.save();
      console.log(`Updated admin credentials for: ${adminEmail}`);
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seedData();
