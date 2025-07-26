const express = require('express');
const multer = require('multer');
const UnifiedDataset = require('../models/UnifiedDataset');
const csvParser = require('csv-parser');
const XLSX = require('xlsx');
const papaparse = require('papaparse');
const { Readable } = require('stream');
const { Client } = require('@opensearch-project/opensearch');
const winston = require('winston');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'bulk-ingest' },
  transports: [
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'), false);
    }
  }
});

// Helper function to parse CSV data into JSON
const parseCsv = async (csvData) => {
  return new Promise((resolve, reject) => {
    const records = [];
    const stream = Readable.from(csvData);
    stream
      .pipe(csvParser())
      .on('data', (data) => records.push(data))
      .on('end', () => resolve(records))
      .on('error', (error) => reject(error));
  });
};

// Helper function to parse Excel files
const parseExcel = (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
};

// Helper function to validate and transform data
const validateAndTransform = (records, mapping, sourceProvider) => {
  const validRecords = [];
  const errors = [];
  
  records.forEach((record, index) => {
    try {
      const mappedRecord = { 
        source_provider: sourceProvider,
        original_id: record[mapping.original_id] || `${sourceProvider}_${index}`,
        ingestion_date: new Date()
      };
      
      // Apply field mapping with validation
      Object.keys(mapping).forEach(targetField => {
        const sourceField = mapping[targetField];
        if (record[sourceField] !== undefined && record[sourceField] !== null && record[sourceField] !== '') {
          if (targetField === 'date_of_birth' || targetField === 'activation_date' || targetField === 'last_recharge_date') {
            mappedRecord[targetField] = new Date(record[sourceField]);
          } else if (targetField === 'age' || targetField === 'plan_amount' || targetField === 'account_balance') {
            mappedRecord[targetField] = parseFloat(record[sourceField]) || 0;
          } else {
            mappedRecord[targetField] = record[sourceField];
          }
        }
      });
      
      // Validate required fields
      if (!mappedRecord.first_name || !mappedRecord.last_name || !mappedRecord.primary_phone) {
        errors.push({ row: index + 1, error: 'Missing required fields: first_name, last_name, or primary_phone' });
        return;
      }
      
      validRecords.push(mappedRecord);
    } catch (error) {
      errors.push({ row: index + 1, error: error.message });
    }
  });
  
  return { validRecords, errors };
};

// Bulk ingestion route with file upload
router.post('/bulk-ingest-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const { mapping, sourceProvider } = req.body;
    if (!mapping || !sourceProvider) {
      return res.status(400).json({ message: 'Mapping and sourceProvider are required' });
    }
    
    let records = [];
    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    // Parse file based on extension
    if (fileExtension === '.csv') {
      const csvData = fs.readFileSync(filePath, 'utf8');
      records = papaparse.parse(csvData, { header: true, skipEmptyLines: true }).data;
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      records = parseExcel(filePath);
    }
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);
    
    // Validate and transform data
    const mappingObj = JSON.parse(mapping);
    const { validRecords, errors } = validateAndTransform(records, mappingObj, sourceProvider);
    
    if (validRecords.length === 0) {
      return res.status(400).json({ 
        message: 'No valid records found', 
        errors: errors.slice(0, 10) // Return first 10 errors
      });
    }
    
    // Bulk insert with batch processing
    const batchSize = 1000;
    let totalInserted = 0;
    const insertErrors = [];
    
    for (let i = 0; i < validRecords.length; i += batchSize) {
      const batch = validRecords.slice(i, i + batchSize);
      try {
        const result = await UnifiedDataset.insertMany(batch, { 
          ordered: false, 
          rawResult: true 
        });
        totalInserted += result.insertedCount || batch.length;
        logger.info(`Batch ${Math.floor(i/batchSize) + 1}: Inserted ${result.insertedCount || batch.length} records`);
      } catch (error) {
        logger.error(`Batch ${Math.floor(i/batchSize) + 1} error:`, error.message);
        insertErrors.push({ batch: Math.floor(i/batchSize) + 1, error: error.message });
      }
    }
    
    res.status(201).json({ 
      message: 'Bulk data ingestion completed', 
      totalProcessed: records.length,
      validRecords: validRecords.length,
      insertedCount: totalInserted,
      errors: errors.slice(0, 10),
      insertErrors: insertErrors
    });
    
  } catch (error) {
    logger.error('Bulk ingestion error:', error);
    res.status(500).json({ message: 'Failed to ingest data', error: error.message });
  }
});

// Bulk ingestion route with JSON data
router.post('/bulk-ingest-json', async (req, res) => {
  try {
    const { records, mapping, sourceProvider } = req.body;
    
    if (!records || !Array.isArray(records) || !mapping || !sourceProvider) {
      return res.status(400).json({ message: 'Records array, mapping, and sourceProvider are required' });
    }
    
    // Validate and transform data
    const { validRecords, errors } = validateAndTransform(records, mapping, sourceProvider);
    
    if (validRecords.length === 0) {
      return res.status(400).json({ 
        message: 'No valid records found', 
        errors: errors.slice(0, 10)
      });
    }
    
    // Bulk insert
    const result = await UnifiedDataset.insertMany(validRecords, { 
      ordered: false, 
      rawResult: true 
    });
    
    res.status(201).json({ 
      message: 'Bulk data ingested successfully', 
      totalProcessed: records.length,
      validRecords: validRecords.length,
      insertedCount: result.insertedCount || validRecords.length,
      errors: errors.slice(0, 10)
    });
    
  } catch (error) {
    logger.error('Bulk ingestion error:', error);
    res.status(500).json({ message: 'Failed to ingest data', error: error.message });
  }
});

// Get data mapping suggestions based on sample data
router.post('/suggest-mapping', async (req, res) => {
  try {
    const { sampleData } = req.body;
    
    if (!sampleData || !Array.isArray(sampleData) || sampleData.length === 0) {
      return res.status(400).json({ message: 'Sample data is required' });
    }
    
    const sampleRecord = sampleData[0];
    const sourceFields = Object.keys(sampleRecord);
    
    // Suggest mappings based on field name similarity
    const suggestions = {
      first_name: sourceFields.find(field => 
        /first.*name|fname|firstname/i.test(field)
      ),
      last_name: sourceFields.find(field => 
        /last.*name|lname|lastname|surname/i.test(field)
      ),
      primary_phone: sourceFields.find(field => 
        /phone|mobile|contact|number/i.test(field)
      ),
      email: sourceFields.find(field => 
        /email|mail/i.test(field)
      ),
      'address.city': sourceFields.find(field => 
        /city/i.test(field)
      ),
      'address.state': sourceFields.find(field => 
        /state/i.test(field)
      ),
      service_type: sourceFields.find(field => 
        /service.*type|plan.*type|type/i.test(field)
      ),
      plan_name: sourceFields.find(field => 
        /plan.*name|plan/i.test(field)
      ),
      date_of_birth: sourceFields.find(field => 
        /birth|dob|born/i.test(field)
      ),
      activation_date: sourceFields.find(field => 
        /activation|active|start/i.test(field)
      )
    };
    
    // Remove null suggestions
    Object.keys(suggestions).forEach(key => {
      if (!suggestions[key]) {
        delete suggestions[key];
      }
    });
    
    res.json({ 
      sourceFields,
      suggestions,
      sampleRecord
    });
    
  } catch (error) {
    logger.error('Mapping suggestion error:', error);
    res.status(500).json({ message: 'Failed to generate mapping suggestions', error: error.message });
  }
});

// Get bulk ingestion status and statistics
router.get('/stats', async (req, res) => {
  try {
    const { source_provider, date_from, date_to } = req.query;
    
    const filters = {};
    if (source_provider) filters.source_provider = source_provider;
    if (date_from || date_to) {
      filters.ingestion_date = {};
      if (date_from) filters.ingestion_date.$gte = new Date(date_from);
      if (date_to) filters.ingestion_date.$lte = new Date(date_to);
    }
    
    const stats = await UnifiedDataset.getAdvancedStats(filters);
    
    // Get provider breakdown
    const providerStats = await UnifiedDataset.aggregate([
      { $match: filters },
      { 
        $group: {
          _id: '$source_provider',
          count: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.json({ 
      ...stats,
      providerBreakdown: providerStats,
      totalProviders: providerStats.length
    });
    
  } catch (error) {
    logger.error('Stats error:', error);
    res.status(500).json({ message: 'Failed to get statistics', error: error.message });
  }
});

module.exports = router;
