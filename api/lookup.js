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

// BIN data ကို memory ထဲ load လုပ်ပါ
let binData = [];

fs.createReadStream(path.join(__dirname, '../bin-list-data.csv'))
  .pipe(csv())
  .on('data', (row) => {
    binData.push(row);
  })
  .on('end', () => {
    console.log('BIN data loaded successfully');
  });

// BIN lookup endpoint
app.get('/api/lookup/:bin', (req, res) => {
  const { bin } = req.params;
  
  if (!bin || bin.length < 6) {
    return res.status(400).json({ 
      error: 'Invalid BIN. Must be at least 6 digits.' 
    });
  }

  const binPrefix = bin.substring(0, 6);
  const results = binData.filter(item => item.BIN === binPrefix);

  if (results.length > 0) {
    res.json({
      success: true,
      data: results[0]
    });
  } else {
    res.json({
      success: false,
      message: 'BIN not found in database'
    });
  }
});

// All routes handler for Vercel
module.exports = app;
