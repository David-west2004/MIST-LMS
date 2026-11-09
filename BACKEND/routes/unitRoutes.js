const express = require('express');
const router = express.Router();
const { Unit } = require('../models');

// GET /api/units - fetch all created units
router.get('/', async (req, res) => {
  try {
    const units = await Unit.findAll({
      order: [['name', 'ASC']]
    });

    return res.status(200).json({
      status: 'success',
      results: units.length,
      data: { units },
      units
    });
  } catch (error) {
    console.error('Error fetching units:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch units',
      error: error.message
    });
  }
});

// POST /api/units - create new department
router.post('/', async (req, res) => {
  try {
    const { name, code } = req.body;
    const unitName = (name || req.body.unit || req.body.department || '').trim();

    if (!unitName) {
      return res.status(400).json({
        status: 'fail',
        message: 'Unit name is required'
      });
    }

    // Check for existing unit (case-insensitive)
    const existing = await Unit.findOne({
      where: Unit.sequelize.where(
        Unit.sequelize.fn('LOWER', Unit.sequelize.col('name')),
        unitName.toLowerCase()
      )
    });

    if (existing) {
      return res.status(409).json({
        status: 'fail',
        message: `Unit "${unitName}" already exists`,
        data: { unit: existing },
        unit: existing
      });
    }

    const unitCode = code ? String(code).trim() : null;

    const unit = await Unit.create({
      name: unitName,
      code: unitCode
    });

    return res.status(201).json({
      status: 'success',
      message: 'Department/Unit created successfully',
      data: { unit },
      unit
    });
  } catch (error) {
    console.error('Error creating unit:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create unit',
      error: error.message
    });
  }
});

module.exports = router;
