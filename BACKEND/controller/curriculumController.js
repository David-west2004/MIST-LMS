const path = require('path');
const { Sequelize } = require('sequelize');
const { Material, User } = require('../models');
const { uploadToCloudinary } = require('../config/cloudinary');

/**
 * Helper to group flat Material records into the hierarchical curriculum format expected by the frontend:
 * { unit, modules: [ { moduleNumber, title, description, materials: [ { id, title, type, url, publicId } ] } ] }
 */
const formatCurriculumFromMaterials = (unit, materials) => {
  const moduleMap = {};

  materials.forEach(mat => {
    const modNum = mat.moduleNumber || 1;
    if (!moduleMap[modNum]) {
      moduleMap[modNum] = {
        moduleNumber: modNum,
        title: mat.moduleTitle || `Module ${modNum}`,
        description: mat.description || '',
        materials: []
      };
    }
    moduleMap[modNum].materials.push({
      _id: mat.id,
      id: mat.id,
      title: mat.title,
      type: mat.fileType || 'pdf',
      url: mat.fileUrl,
      publicId: mat.publicId
    });
  });

  return {
    unit,
    modules: Object.values(moduleMap)
  };
};

const createCurriculum = async (req, res) => {
  try {
    const { unit, modules, title, fileUrl, publicId, fileType, moduleNumber, moduleTitle, description } = req.body;
    if (!unit) {
      return res.status(400).json({ message: 'Unit name is required' });
    }

    // Support single material creation
    if (title && fileUrl) {
      const material = await Material.create({
        title,
        fileUrl,
        publicId: publicId || null,
        unit,
        fileType: fileType || 'pdf',
        moduleNumber: moduleNumber || 1,
        moduleTitle: moduleTitle || `Module ${moduleNumber || 1}`,
        description: description || ''
      });
      return res.status(201).json({
        status: 'success',
        data: { material }
      });
    }

    // Support nested modules structure
    if (Array.isArray(modules) && modules.length > 0) {
      const createdMaterials = [];
      for (let i = 0; i < modules.length; i++) {
        const mod = modules[i];
        const modNum = mod.moduleNumber || i + 1;
        const modTitle = mod.title || `Module ${modNum}`;
        const modDesc = mod.description || '';

        if (Array.isArray(mod.materials)) {
          for (const mat of mod.materials) {
            const newMat = await Material.create({
              title: mat.title,
              fileUrl: mat.url || mat.fileUrl,
              publicId: mat.publicId || null,
              unit,
              fileType: mat.type || mat.fileType || 'pdf',
              moduleNumber: modNum,
              moduleTitle: modTitle,
              description: modDesc
            });
            createdMaterials.push(newMat);
          }
        }
      }
      const formatted = formatCurriculumFromMaterials(unit, createdMaterials);
      return res.status(201).json({
        status: 'success',
        data: { curriculum: formatted }
      });
    }

    return res.status(400).json({ message: 'Please provide curriculum materials or modules' });
  } catch (error) {
    console.error('Create curriculum error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getCurricula = async (req, res) => {
  try {
    const materials = await Material.findAll({
      order: [['unit', 'ASC'], ['moduleNumber', 'ASC'], ['id', 'ASC']]
    });

    const units = Array.from(new Set(materials.map(m => m.unit)));
    const curricula = units.map(u => {
      const unitMaterials = materials.filter(m => m.unit === u);
      return formatCurriculumFromMaterials(u, unitMaterials);
    });

    return res.status(200).json({
      status: 'success',
      results: curricula.length,
      data: { curricula }
    });
  } catch (error) {
    console.error('Get curricula error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getCurriculumByUnit = async (req, res) => {
  try {
    const { unit } = req.params;
    const materials = await Material.findAll({
      where: { unit },
      order: [['moduleNumber', 'ASC'], ['id', 'ASC']]
    });

    if (!materials || materials.length === 0) {
      return res.status(404).json({ message: `Curriculum for unit "${unit}" not found` });
    }

    const curriculum = formatCurriculumFromMaterials(unit, materials);

    return res.status(200).json({
      status: 'success',
      data: { curriculum }
    });
  } catch (error) {
    console.error('Get curriculum by unit error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getMyCurriculum = async (req, res) => {
  try {
    const unit = req.user.unit;
    const materials = await Material.findAll({
      where: { unit },
      order: [['moduleNumber', 'ASC'], ['id', 'ASC']]
    });

    if (!materials || materials.length === 0) {
      return res.status(404).json({ message: `Curriculum for unit "${unit}" has not been created yet.` });
    }

    const curriculum = formatCurriculumFromMaterials(unit, materials);

    return res.status(200).json({
      status: 'success',
      data: { curriculum }
    });
  } catch (error) {
    console.error('Get my curriculum error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const updateCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const { unit, modules, title, fileUrl, publicId, fileType, moduleNumber, moduleTitle, description } = req.body;

    // Check if ID is a specific Material ID
    const material = await Material.findByPk(id);
    if (material) {
      if (title) material.title = title;
      if (fileUrl) material.fileUrl = fileUrl;
      if (publicId !== undefined) material.publicId = publicId;
      if (unit) material.unit = unit;
      if (fileType) material.fileType = fileType;
      if (moduleNumber) material.moduleNumber = moduleNumber;
      if (moduleTitle) material.moduleTitle = moduleTitle;
      if (description !== undefined) material.description = description;

      await material.save();
      return res.status(200).json({
        status: 'success',
        data: { material }
      });
    }

    // Otherwise handle module update for a unit
    if (unit && Array.isArray(modules)) {
      // Re-create materials for this unit
      await Material.destroy({ where: { unit } });
      const created = [];
      for (let i = 0; i < modules.length; i++) {
        const mod = modules[i];
        const modNum = mod.moduleNumber || i + 1;
        const modTitle = mod.title || `Module ${modNum}`;
        const modDesc = mod.description || '';

        if (Array.isArray(mod.materials)) {
          for (const mat of mod.materials) {
            const newMat = await Material.create({
              title: mat.title,
              fileUrl: mat.url || mat.fileUrl,
              publicId: mat.publicId || null,
              unit,
              fileType: mat.type || mat.fileType || 'pdf',
              moduleNumber: modNum,
              moduleTitle: modTitle,
              description: modDesc
            });
            created.push(newMat);
          }
        }
      }
      const curriculum = formatCurriculumFromMaterials(unit, created);
      return res.status(200).json({
        status: 'success',
        data: { curriculum }
      });
    }

    return res.status(404).json({ message: 'Curriculum or material record not found' });
  } catch (error) {
    console.error('Update curriculum error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await Material.findByPk(id);
    if (material) {
      await material.destroy();
      return res.status(200).json({
        status: 'success',
        message: 'Material deleted successfully'
      });
    }

    // Try deleting by unit if numeric ID not found
    const deletedCount = await Material.destroy({ where: { unit: id } });
    if (deletedCount > 0) {
      return res.status(200).json({
        status: 'success',
        message: `Curriculum for unit "${id}" deleted successfully`
      });
    }

    return res.status(404).json({ message: 'Curriculum not found' });
  } catch (error) {
    console.error('Delete curriculum error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Upload material directly to Cloudinary from memory buffer
 */
const uploadMaterial = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No file uploaded or file buffer missing' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    let inferredType = 'pdf';
    if (ext === 'mp4') inferredType = 'video';
    else if (['doc', 'docx'].includes(ext)) inferredType = 'doc';
    else if (ext === 'pdf') inferredType = 'pdf';

    // Stream directly to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(
      req.file.buffer,
      'mist_lms/materials',
      { resource_type: 'auto' }
    );

    return res.status(200).json({
      status: 'success',
      data: {
        fileUrl: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        fileName: req.file.originalname,
        fileType: inferredType
      }
    });
  } catch (error) {
    console.error('Upload material to Cloudinary error:', error.message);
    return res.status(500).json({ message: error.message || 'Cloudinary upload failed' });
  }
};

const getDistinctUnits = async (req, res) => {
  try {
    const materialUnits = await Material.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('unit')), 'unit']],
      raw: true
    });

    const userUnits = await User.findAll({
      where: { role: 'student' },
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('unit')), 'unit']],
      raw: true
    });

    const combined = [
      ...materialUnits.map(m => m.unit),
      ...userUnits.map(u => u.unit)
    ];

    const cleanUnits = Array.from(
      new Set(
        combined
          .map(u => (typeof u === 'string' ? u.trim() : ''))
          .filter(u => u && u.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    return res.status(200).json({
      status: 'success',
      results: cleanUnits.length,
      data: { units: cleanUnits }
    });
  } catch (error) {
    console.error('Get distinct units error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createCurriculum,
  getCurricula,
  getCurriculumByUnit,
  getMyCurriculum,
  updateCurriculum,
  deleteCurriculum,
  uploadMaterial,
  getDistinctUnits
};
