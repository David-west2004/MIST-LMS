// const mongoose = require('mongoose');
// const User = require('../model/User');
// const Curriculum = require('../model/Curriculum');
// const Progress = require('../model/Progress');

// const PORT = process.env.PORT || 5002;
// const BASE_URL = `http://localhost:${PORT}`;

// async function runTests() {
//   console.log('Starting integration tests...');

//   // Start the server programmatically
//   process.env.PORT = PORT.toString();
//   process.env.MONGODB_URI = 'mongodb://localhost:27017/mist_lms_test';
//   process.env.NODE_ENV = 'test';

//   const server = require('../server');

//   // Clear test DB first
//   await mongoose.connection.dropDatabase();
//   console.log('Test database dropped and cleared.');

//   // Run a mini-seeding inside the test script
//   const adminEmail = 'mistsupervisor@gmail.com';
//   const adminPassword = 'supervisor1234';
//   const admin = await User.create({
//     name: 'MIST Test Admin',
//     email: adminEmail,
//     password: adminPassword,
//     role: 'admin',
//     unit: 'Administration'
//   });
//   console.log('Seeded test admin.');

//   const curriculum = await Curriculum.create({
//     unit: 'Software Development',
//     modules: [
//       {
//         title: 'Module 1',
//         description: 'Test Module',
//         materials: [
//           { title: 'Material A', type: 'pdf', url: 'https://example.com/a.pdf' },
//           { title: 'Material B', type: 'video', url: 'https://example.com/b.mp4' }
//         ]
//       }
//     ]
//   });
//   console.log('Seeded test curriculum with 2 materials.');

//   // Wait 1 second for express server to bind
//   await new Promise(resolve => setTimeout(resolve, 1000));

//   let adminToken = '';
//   let studentToken = '';
//   let studentId = '';
//   let inviteToken = '';
//   let materialId = curriculum.modules[0].materials[0]._id.toString();

//   try {
//     // 1. Admin Login
//     console.log('\n--- Test 1: Admin Login ---');
//     const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ email: adminEmail, password: adminPassword })
//     });
//     const loginData = await loginRes.json();
//     if (loginRes.status !== 200 || !loginData.token) {
//       throw new Error(`Admin login failed: ${JSON.stringify(loginData)}`);
//     }
//     adminToken = loginData.token;
//     console.log('Success: Admin logged in, JWT token received.');

//     // 2. Admin Invites Student
//     console.log('\n--- Test 2: Invite Student ---');
//     const inviteRes = await fetch(`${BASE_URL}/api/auth/invite`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${adminToken}`
//       },
//       body: JSON.stringify({
//         name: 'Jane Doe',
//         email: 'jane.doe@example.com',
//         unit: 'Software Development'
//       })
//     });
//     const inviteData = await inviteRes.json();
//     if (inviteRes.status !== 201 || !inviteData.data.inviteToken) {
//       throw new Error(`Invite failed: ${JSON.stringify(inviteData)}`);
//     }
//     inviteToken = inviteData.data.inviteToken;
//     console.log(`Success: Invitation generated. Token: ${inviteToken}`);

//     // 3. Verify Invite Token
//     console.log('\n--- Test 3: Verify Invite Token ---');
//     const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-invite/${inviteToken}`);
//     const verifyData = await verifyRes.json();
//     if (verifyRes.status !== 200 || verifyData.data.email !== 'jane.doe@example.com') {
//       throw new Error(`Token verification failed: ${JSON.stringify(verifyData)}`);
//     }
//     console.log('Success: Token validated, student info fetched.');

//     // 4. Complete Registration
//     console.log('\n--- Test 4: Complete Registration ---');
//     const registerRes = await fetch(`${BASE_URL}/api/auth/register-invited`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         token: inviteToken,
//         password: 'StudentSecure123!'
//       })
//     });
//     const registerData = await registerRes.json();
//     if (registerRes.status !== 200 || !registerData.token) {
//       throw new Error(`Registration failed: ${JSON.stringify(registerData)}`);
//     }
//     studentToken = registerData.token;
//     studentId = registerData.data.user.id;
//     console.log('Success: Student registration complete, student JWT token received.');

//     // 5. Get Student Profile & Unit Curriculum
//     console.log('\n--- Test 5: Fetch Profile and Curriculum ---');
//     const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
//       headers: { 'Authorization': `Bearer ${studentToken}` }
//     });
//     const meData = await meRes.json();
//     if (meRes.status !== 200 || meData.data.user.unit !== 'Software Development') {
//       throw new Error(`Profile fetch failed: ${JSON.stringify(meData)}`);
//     }
//     console.log(`Success: Fetched student profile. Assigned Unit: ${meData.data.user.unit}`);

//     const currRes = await fetch(`${BASE_URL}/api/curriculum/my-unit`, {
//       headers: { 'Authorization': `Bearer ${studentToken}` }
//     });
//     const currData = await currRes.json();
//     if (currRes.status !== 200 || currData.data.curriculum.modules.length === 0) {
//       throw new Error(`Curriculum fetch failed: ${JSON.stringify(currData)}`);
//     }
//     console.log(`Success: Fetched curriculum with ${currData.data.curriculum.modules[0].materials.length} materials.`);

//     // 6. Fetch Progress & Toggle Completion
//     console.log('\n--- Test 6: Progress Completion Flow ---');
//     const progRes1 = await fetch(`${BASE_URL}/api/progress/my-progress`, {
//       headers: { 'Authorization': `Bearer ${studentToken}` }
//     });
//     const progData1 = await progRes1.json();
//     if (progData1.data.percentage !== 0) {
//       throw new Error(`Expected initial progress to be 0%, got: ${progData1.data.percentage}%`);
//     }
//     console.log('Success: Initial progress is 0%.');

//     // Toggle material
//     const toggleRes = await fetch(`${BASE_URL}/api/progress/toggle`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${studentToken}`
//       },
//       body: JSON.stringify({ materialId })
//     });
//     const toggleData = await toggleRes.json();
//     if (toggleRes.status !== 200 || toggleData.data.percentage !== 50) {
//       throw new Error(`Expected progress after toggle to be 50%, got: ${JSON.stringify(toggleData)}`);
//     }
//     console.log('Success: Toggled Material completion. Progress is now 50%.');

//     // 7. Admin View Students List
//     console.log('\n--- Test 7: Admin View Students ---');
//     const listRes = await fetch(`${BASE_URL}/api/students`, {
//       headers: { 'Authorization': `Bearer ${adminToken}` }
//     });
//     const listData = await listRes.json();
//     const foundStudent = listData.data.students.find(s => s._id.toString() === studentId);
//     if (!foundStudent || foundStudent.progressPercentage !== 50) {
//       throw new Error(`Admin list did not report correct student details: ${JSON.stringify(listData)}`);
//     }
//     console.log(`Success: Admin retrieved student list. Jane Doe's progress: ${foundStudent.progressPercentage}%.`);

//     // 8. Test Blocking Suspension Mechanism
//     console.log('\n--- Test 8: Block Mechanism ---');
//     const blockRes = await fetch(`${BASE_URL}/api/students/${studentId}/block`, {
//       method: 'PATCH',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${adminToken}`
//       },
//       body: JSON.stringify({ isBlocked: true })
//     });
//     const blockData = await blockRes.json();
//     if (blockRes.status !== 200 || blockData.data.student.isBlocked !== true) {
//       throw new Error(`Blocking student failed: ${JSON.stringify(blockData)}`);
//     }
//     console.log('Success: Student has been blocked by Admin.');

//     // Attempt student request while blocked
//     const blockedReqRes = await fetch(`${BASE_URL}/api/auth/me`, {
//       headers: { 'Authorization': `Bearer ${studentToken}` }
//     });
//     const blockedReqData = await blockedReqRes.json();
//     if (blockedReqRes.status !== 403) {
//       throw new Error(`Blocked user request should return 403, got: ${blockedReqRes.status}`);
//     }
//     console.log('Success: Student request rejected with 403 Forbidden suspension code.');

//     // Unblock Student
//     console.log('\n--- Test 9: Unblock Mechanism ---');
//     const unblockRes = await fetch(`${BASE_URL}/api/students/${studentId}/block`, {
//       method: 'PATCH',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${adminToken}`
//       },
//       body: JSON.stringify({ isBlocked: false })
//     });
//     const unblockData = await unblockRes.json();
//     if (unblockRes.status !== 200 || unblockData.data.student.isBlocked !== false) {
//       throw new Error(`Unblocking student failed: ${JSON.stringify(unblockData)}`);
//     }
//     console.log('Success: Student has been unblocked by Admin.');

//     // Attempt student request again after unblocking
//     const activeReqRes = await fetch(`${BASE_URL}/api/auth/me`, {
//       headers: { 'Authorization': `Bearer ${studentToken}` }
//     });
//     if (activeReqRes.status !== 200) {
//       throw new Error(`Request after unblocking failed with code: ${activeReqRes.status}`);
//     }
//     console.log('Success: Student can make requests normally again.');

//     console.log('\n=======================================');
//     console.log('ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
//     console.log('=======================================');
//     process.exit(0);

//   } catch (error) {
//     console.error('\nTEST FAILURE:', error.message);
//     process.exit(1);
//   }
// }

// runTests();
