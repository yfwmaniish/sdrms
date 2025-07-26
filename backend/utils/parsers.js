const fs = require('fs');
const csv = require('csv-parser');
const XLSX = require('xlsx');

const parseCSV = async (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};

const parseXLSX = async (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    return data;
  } catch (error) {
    throw new Error(`Failed to parse XLSX file: ${error.message}`);
  }
};

const parseTXT = async (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0].split('\t');
    
    const results = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      const obj = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index]?.trim() || '';
      });
      results.push(obj);
    }
    
    return results;
  } catch (error) {
    throw new Error(`Failed to parse TXT file: ${error.message}`);
  }
};

const parseMDB = async (filePath) => {
  // MDB parsing would require additional libraries like 'mdb-tools'
  // For now, return empty array
  console.warn('MDB parsing not implemented yet');
  return [];
};

module.exports = {
  parseCSV,
  parseXLSX,
  parseTXT,
  parseMDB
};
