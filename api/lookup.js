const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  next();
});

// BIN data storage
let binData = [];
let isDataLoaded = false;

console.log('🚀 Starting BIN Lookup API...');

// Load BIN data immediately
const loadBINData = () => {
  return new Promise((resolve, reject) => {
    const csvPath = path.join(process.cwd(), 'bin-list-data.csv');
    console.log('📁 Loading CSV from:', csvPath);
    
    if (!fs.existsSync(csvPath)) {
      console.error('❌ CSV file not found!');
      reject(new Error('CSV file not found'));
      return;
    }

    const stream = fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        binData.push(row);
      })
      .on('end', () => {
        isDataLoaded = true;
        console.log(`✅ BIN data loaded! Total records: ${binData.length}`);
        
        // Log sample data for verification
        console.log('📝 Sample BINs loaded:');
        binData.slice(0, 3).forEach(item => {
          console.log(`   ${item.BIN}: ${item.Brand} - ${item.Issuer}`);
        });
        
        resolve(binData);
      })
      .on('error', (error) => {
        console.error('❌ CSV load error:', error);
        reject(error);
      });
  });
};

// Start loading immediately and wait for it
loadBINData().catch(error => {
  console.error('Failed to load BIN data:', error);
});

// BIN lookup endpoint
app.get('/api/lookup/:bin', (req, res) => {
  const { bin } = req.params;
  
  if (!bin || bin.length < 6) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid BIN. Must be at least 6 digits.' 
    });
  }

  const binPrefix = bin.substring(0, 6);
  console.log(`🔍 Looking up BIN: ${binPrefix}`);
  
  if (!isDataLoaded) {
    return res.status(503).json({ 
      success: false,
      message: 'Database still loading. Please try again in 10 seconds.',
      retryAfter: 10
    });
  }

  // Exact match search
  const result = binData.find(item => item.BIN === binPrefix);
  
  if (result) {
    console.log(`✅ Found: ${result.Brand} - ${result.Issuer}`);
    res.json({
      success: true,
      data: result
    });
  } else {
    console.log(`❌ BIN ${binPrefix} not found`);
    
    // Find similar BINs for debugging
    const similar = binData.filter(item => 
      item.BIN.startsWith(binPrefix.substring(0, 4))
    ).slice(0, 3);
    
    res.json({
      success: false,
      message: 'BIN not found in database',
      similarBINs: similar.map(s => s.BIN)
    });
  }
});

// Bulk lookup endpoint
app.get('/api/bulk-lookup', (req, res) => {
  const { bins } = req.query;
  
  if (!bins) {
    return res.status(400).json({
      success: false,
      message: 'No BINs provided. Use ?bins=411111,510510,424242'
    });
  }

  const binList = bins.split(',').map(bin => bin.trim().substring(0, 6));
  const results = binList.map(bin => {
    const result = binData.find(item => item.BIN === bin);
    return {
      bin,
      found: !!result,
      data: result || null
    };
  });

  res.json({
    success: true,
    results: results
  });
});

// Database stats endpoint
app.get('/api/stats', (req, res) => {
  const brands = {};
  const countries = {};
  
  binData.forEach(item => {
    brands[item.Brand] = (brands[item.Brand] || 0) + 1;
    countries[item.CountryName] = (countries[item.CountryName] || 0) + 1;
  });

  res.json({
    success: true,
    stats: {
      totalRecords: binData.length,
      dataLoaded: isDataLoaded,
      brands: brands,
      topCountries: Object.entries(countries)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    dataLoaded: isDataLoaded,
    totalRecords: binData.length,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
