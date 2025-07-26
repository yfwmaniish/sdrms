const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { requirePermission } = require('../middleware/auth');
const { uploadRateLimit } = require('../middleware/rateLimiter');
const Subscriber = require('../models/Subscriber');

const uploadDir = process.env.UPLOAD_DIR || './uploads';
const allowedFileTypes = (process.env.ALLOWED_FILE_TYPES || 'csv,xlsx,txt,mdb').split(',');

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedFileTypes.includes(ext.substring(1))) {
    return cb(new Error('File type is not allowed'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || 104857600) } // Default to 100MB
});

// Import utility functions for parsing
const { parseCSV, parseXLSX, parseTXT, parseMDB } = require('../utils/parsers');

// Handle bulk upload
router.post('/', requirePermission('upload_data'), uploadRateLimit, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileType = path.extname(req.file.originalname).toLowerCase().substring(1);

    let parsedData;

    switch (fileType) {
      case 'csv':
        parsedData = await parseCSV(filePath);
        break;
      case 'xlsx':
        parsedData = await parseXLSX(filePath);
        break;
      case 'txt':
        parsedData = await parseTXT(filePath);
        break;
      case 'mdb':
        parsedData = await parseMDB(filePath);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported file format' });
    }

    // Validate and save data
    const bulkOps = parsedData.map(subscriber => {
      return {
        updateOne: {
          filter: { mobileNumber: subscriber.mobileNumber },
          update: { $set: subscriber },
          upsert: true
        }
      };
    });

    const result = await Subscriber.bulkWrite(bulkOps);

    res.status(200).json({
      message: 'Bulk data processed successfully',
      result
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

module.exports = router;
