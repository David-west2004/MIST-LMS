const { Attendance, User } = require('../models');

/**
 * Normalizes a date to YYYY-MM-DD string for MySQL DATEONLY column.
 * @param {Date|number|string} [date]
 * @returns {string}
 */
const normalizeToUTCDate = (date = new Date()) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Dynamic Policy Evaluator for SIWES clearance eligibility.
 * 
 * Rules:
 * 1. Total Target Days = student.siwesDurationWeeks * 3
 * 2. Student must log at least 3 check-ins for EVERY single week of their duration (week 1 to siwesDurationWeeks).
 * 
 * @param {number|string} studentId 
 */
const checkClearanceEligibility = async (studentId) => {
  const student = await User.findByPk(studentId);
  if (!student) {
    throw new Error('Student not found');
  }

  const durationWeeks = student.siwesDurationWeeks || 24;
  const targetDays = durationWeeks * 3;

  // Retrieve all attendance records for student
  const attendanceRecords = await Attendance.findAll({
    where: { userId: studentId }
  });
  const totalDays = attendanceRecords.length;

  // Group check-in counts by weekNumber
  const weeklyBreakdown = {};
  for (let w = 1; w <= durationWeeks; w++) {
    weeklyBreakdown[w] = 0;
  }

  attendanceRecords.forEach(rec => {
    const w = rec.weekNumber;
    if (w >= 1 && w <= durationWeeks) {
      weeklyBreakdown[w] = (weeklyBreakdown[w] || 0) + 1;
    }
  });

  let compliantWeeks = 0;
  const missingWeeks = [];

  for (let w = 1; w <= durationWeeks; w++) {
    if (weeklyBreakdown[w] >= 3) {
      compliantWeeks++;
    } else {
      missingWeeks.push(w);
    }
  }

  const eligible = compliantWeeks === durationWeeks;

  return {
    eligible,
    totalDays,
    targetDays,
    compliantWeeks,
    targetWeeks: durationWeeks,
    missingWeeks,
    weeklyBreakdown
  };
};

/**
 * Verified student daily attendance check-in.
 * POST /api/attendance/check-in
 */
const checkIn = async (req, res) => {
  try {
    const student = req.user;
    const { latitude, longitude } = req.body;

    if (student.isBlocked) {
      return res.status(403).json({
        status: 'fail',
        message: 'Access denied. Your student account has been suspended.'
      });
    }

    const durationWeeks = student.siwesDurationWeeks || 24;
    let weekNumber = 1;

    if (student.siwesStartDate) {
      const now = new Date();
      const diffMs = now.getTime() - new Date(student.siwesStartDate).getTime();
      weekNumber = Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000));
      if (weekNumber < 1) weekNumber = 1;
      if (weekNumber > durationWeeks) weekNumber = durationWeeks;
    }

    const today = normalizeToUTCDate(new Date());

    // Check if attendance already exists for today
    const existingCheckIn = await Attendance.findOne({
      where: {
        userId: student.id,
        date: today
      }
    });

    if (existingCheckIn) {
      return res.status(400).json({
        status: 'fail',
        message: 'Attendance already logged for today. Only 1 check-in is permitted per calendar day.'
      });
    }

    const attendance = await Attendance.create({
      userId: student.id,
      date: today,
      weekNumber,
      status: 'present',
      latitude: latitude || null,
      longitude: longitude || null
    });

    return res.status(201).json({
      status: 'success',
      message: `Check-in verified successfully for Week ${weekNumber}.`,
      data: {
        attendance: {
          id: attendance.id,
          date: attendance.date,
          weekNumber: attendance.weekNumber,
          status: attendance.status,
          coordinates: {
            latitude: attendance.latitude,
            longitude: attendance.longitude
          }
        }
      }
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        status: 'fail',
        message: 'Attendance already logged for today.'
      });
    }
    console.error('Attendance check-in error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Returns student's attendance summary, weekly breakdown, and clearance eligibility.
 * GET /api/attendance/my-summary
 */
const getMyAttendanceSummary = async (req, res) => {
  try {
    const student = req.user;
    const today = normalizeToUTCDate(new Date());

    const todayRecord = await Attendance.findOne({
      where: {
        userId: student.id,
        date: today
      }
    });

    const durationWeeks = student.siwesDurationWeeks || 24;
    let currentWeek = 1;
    if (student.siwesStartDate) {
      const diffMs = Date.now() - new Date(student.siwesStartDate).getTime();
      currentWeek = Math.max(1, Math.min(durationWeeks, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000))));
    }

    const eligibility = await checkClearanceEligibility(student.id);

    const allLogs = await Attendance.findAll({
      where: { userId: student.id },
      order: [['date', 'DESC']],
      limit: 60
    });

    return res.status(200).json({
      status: 'success',
      data: {
        checkedInToday: !!todayRecord,
        todayRecord: todayRecord ? {
          id: todayRecord.id,
          date: todayRecord.date,
          weekNumber: todayRecord.weekNumber,
          status: todayRecord.status,
          coordinates: {
            latitude: todayRecord.latitude,
            longitude: todayRecord.longitude
          }
        } : null,
        currentWeek,
        durationWeeks,
        eligibility,
        attendanceLogs: allLogs
      }
    });
  } catch (error) {
    console.error('Get attendance summary error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  checkIn,
  getMyAttendanceSummary,
  checkClearanceEligibility,
  normalizeToUTCDate
};
