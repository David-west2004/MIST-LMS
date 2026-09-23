const Attendance = require('../model/Attendance');
const User = require('../model/User');
const { checkAlausaGeofence, DEFAULT_MAX_RADIUS_METERS } = require('../utils/geofence');

/**
 * Normalizes a date to UTC midnight for consistent daily calendar comparison.
 * @param {Date|number|string} [date]
 * @returns {Date}
 */
const normalizeToUTCDate = (date = new Date()) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

/**
 * Dynamic Policy Evaluator for SIWES clearance eligibility.
 * 
 * Rules:
 * 1. Total Target Days = student.siwesDurationWeeks * 3
 * 2. Student must log at least 3 check-ins for EVERY single week of their duration (week 1 to siwesDurationWeeks).
 * 
 * @param {string} studentId 
 * @returns {Promise<{
 *   eligible: boolean,
 *   totalDays: number,
 *   targetDays: number,
 *   compliantWeeks: number,
 *   targetWeeks: number,
 *   missingWeeks: number[],
 *   weeklyBreakdown: Record<number, number>
 * }>}
 */
const checkClearanceEligibility = async (studentId) => {
  const student = await User.findById(studentId);
  if (!student) {
    throw new Error('Student not found');
  }

  const durationWeeks = student.siwesDurationWeeks || 24;
  const targetDays = durationWeeks * 3;

  // Retrieve all attendance records for student
  const attendanceRecords = await Attendance.find({ student: studentId });
  const totalDays = attendanceRecords.length;

  // Group check-in counts by weekNumber
  const weeklyBreakdown = {};
  for (let w = 1; w <= durationWeeks; w++) {
    weeklyBreakdown[w] = 0;
  }

  attendanceRecords.forEach((record) => {
    if (record.weekNumber >= 1 && record.weekNumber <= durationWeeks) {
      weeklyBreakdown[record.weekNumber] = (weeklyBreakdown[record.weekNumber] || 0) + 1;
    }
  });

  const missingWeeks = [];
  let compliantWeeks = 0;

  for (let w = 1; w <= durationWeeks; w++) {
    const count = weeklyBreakdown[w] || 0;
    if (count >= 3) {
      compliantWeeks++;
    } else {
      missingWeeks.push(w);
    }
  }

  const eligible = missingWeeks.length === 0 && compliantWeeks === durationWeeks;

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
 * Handles daily attendance check-in within the Alausa Secretariat geofence.
 * POST /api/attendance/check-in
 */
const checkIn = async (req, res) => {
  try {
    const student = req.user;
    if (!student) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (student.isBlocked) {
      return res.status(403).json({ message: 'Access denied: Account suspended.' });
    }

    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ 
        message: 'Invalid request: GPS coordinates (numeric latitude and longitude) are required.' 
      });
    }

    // 1. Enforce Alausa Secretariat Geofence
    const geo = checkAlausaGeofence(latitude, longitude, DEFAULT_MAX_RADIUS_METERS);
    if (!geo.inside) {
      return res.status(400).json({
        status: 'fail',
        message: `Check-in rejected: You are outside the Alausa Secretariat boundary. Distance: ${geo.distance}m (Maximum allowed: ${geo.maxRadius}m).`,
        distance: geo.distance,
        maxRadius: geo.maxRadius
      });
    }

    // 2. Validate SIWES Dates and Compute Current Week Number
    if (!student.siwesStartDate) {
      return res.status(400).json({ 
        message: 'SIWES start date is not configured on your intern profile. Please contact your administrator.' 
      });
    }

    const startDate = new Date(student.siwesStartDate).getTime();
    const now = Date.now();
    const durationWeeks = student.siwesDurationWeeks || 24;

    const diffMs = now - startDate;
    const weekNumber = Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000));

    if (weekNumber < 1) {
      return res.status(400).json({
        status: 'fail',
        message: `Check-in rejected: Your SIWES internship tenure begins on ${new Date(student.siwesStartDate).toLocaleDateString('en-GB')}.`
      });
    }

    if (weekNumber > durationWeeks) {
      return res.status(400).json({
        status: 'fail',
        message: `Check-in rejected: Your SIWES internship duration (${durationWeeks} weeks) has officially elapsed.`
      });
    }

    // 3. Normalize Date & Enforce 1 Check-In Per Calendar Day
    const today = normalizeToUTCDate(new Date());

    const existingCheckIn = await Attendance.findOne({
      student: student._id,
      date: today
    });

    if (existingCheckIn) {
      return res.status(400).json({
        status: 'fail',
        message: 'Attendance already logged for today. Only 1 check-in is permitted per calendar day.'
      });
    }

    // 4. Save Attendance Record
    const attendance = await Attendance.create({
      student: student._id,
      date: today,
      weekNumber,
      coordinates: { latitude, longitude }
    });

    return res.status(201).json({
      status: 'success',
      message: `Check-in verified successfully for Week ${weekNumber} inside Alausa Secretariat.`,
      data: {
        attendance: {
          id: attendance._id,
          date: attendance.date,
          weekNumber: attendance.weekNumber,
          coordinates: attendance.coordinates
        }
      }
    });
  } catch (error) {
    // Handle compound unique index duplicate race condition
    if (error.code === 11000) {
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
      student: student._id,
      date: today
    });

    const durationWeeks = student.siwesDurationWeeks || 24;
    let currentWeek = 1;
    if (student.siwesStartDate) {
      const diffMs = Date.now() - new Date(student.siwesStartDate).getTime();
      currentWeek = Math.max(1, Math.min(durationWeeks, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000))));
    }

    const eligibility = await checkClearanceEligibility(student._id);

    const allLogs = await Attendance.find({ student: student._id })
      .sort({ date: -1 })
      .limit(60);

    return res.status(200).json({
      status: 'success',
      data: {
        checkedInToday: !!todayRecord,
        todayRecord: todayRecord ? {
          id: todayRecord._id,
          date: todayRecord.date,
          weekNumber: todayRecord.weekNumber,
          coordinates: todayRecord.coordinates
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
