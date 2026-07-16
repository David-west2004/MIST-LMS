require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../model/User');
const Curriculum = require('../model/Curriculum');

const seedData = async () => {
  try {
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

    const adminEmail = 'mistsupervisor@gmail.com';
    const adminPassword = 'supervisor1234';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: 'MIST Portal Administrator',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        unit: 'Administration'
      });
      console.log(`Created default admin: ${adminEmail} / ${adminPassword}`);
    } else {
      admin.password = adminPassword;
      await admin.save();
      console.log(`Updated admin password for ${adminEmail} to ${adminPassword}`);
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seedData();
