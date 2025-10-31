const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const app = express();

// CORS enable
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  next();
});

// BIN data storage
let binData = [];
let isDataLoaded = false;

console.log('Starting BIN data load...');

// Load BIN data from CSV
try {
  const csvPath = path.join(process.cwd(), 'bin-list-data.csv');
  console.log('CSV Path:', csvPath);
  console.log('File exists:', fs.existsSync(csvPath));
  
  if (!fs.existsSync(csvPath)) {
    console.error('CSV file not found!');
  }

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      binData.push(row);
    })
    .on('end', () => {
      isDataLoaded = true;
      console.log(`✅ BIN data loaded successfully. Total records: ${binData.length}`);
      console.log('Sample BINs:', binData.slice(0, 3).map(item => item.BIN));
    })
    .on('error', (error) => {
      console.error('Error loading CSV:', error);
    });
} catch (error) {
  console.error('Failed to load BIN data:', error);
}

// BIN lookup endpoint
app.get('/api/lookup/:bin', (req, res) => {
  const { bin } = req.params;
  
  if (!isDataLoaded) {
    return res.status(503).json({ 
      success: false,
      message: 'Service initializing. Please try again in a moment.' 
    });
  }

  if (!bin || bin.length < 6) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid BIN. Must be at least 6 digits.' 
    });
  }

  const binPrefix = bin.substring(0, 6);
  console.log(`Looking up BIN: ${binPrefix}`);
  
  // Exact match ရှာပါ
  const result = binData.find(item => item.BIN === binPrefix);
  
  if (result) {
    console.log('BIN found:', result);
    res.json({
      success: true,
      data: result
    });
  } else {
    console.log(`BIN ${binPrefix} not found in database`);
    console.log('Available BINs sample:', binData.slice(0, 5).map(item => item.BIN));
    res.json({
      success: false,
      message: 'BIN not found in database'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    dataLoaded: isDataLoaded,
    totalRecords: binData.length,
    sampleBINs: binData.slice(0, 3).map(item => item.BIN)
  });
});

// Test endpoint with sample BINs
app.get('/api/test', (req, res) => {
  const testBINs = ['411111', '510510', '401288'];
  const results = testBINs.map(bin => {
    const result = binData.find(item => item.BIN === bin);
    return { bin, found: !!result, data: result };
  });
  
  res.json({
    databaseStatus: {
      loaded: isDataLoaded,
      totalRecords: binData.length
    },
    testResults: results
  });
});

module.exports = app;
