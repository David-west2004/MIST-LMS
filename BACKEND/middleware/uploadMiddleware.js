const multer = require('multer');
const path = require('path');
const fs = require('fs');

const materialsDir = path.join(__dirname, '..', 'uploads', 'materials');
if (!fs.existsSync(materialsDir)) {
  fs.mkdirSync(materialsDir, { recursive: true });
}

const assignmentsDir = path.join(__dirname, '..', 'uploads', 'assignments');
if (!fs.existsSync(assignmentsDir)) {
  fs.mkdirSync(assignmentsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.baseUrl && req.baseUrl.includes('assignments')) {
      cb(null, assignmentsDir);
    } else {
      cb(null, materialsDir);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExts = ['.pdf', '.doc', '.docx', '.mp4'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type "${ext}". Allowed types: ${allowedExts.join(', ')}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB max
  }
});

module.exports = upload;
