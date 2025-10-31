// Debug script - api/debug.js
const fs = require('fs');
const csv = require('csv-parser');

console.log('Checking CSV file...');

fs.createReadStream('./bin-list-data.csv')
  .pipe(csv())
  .on('data', (row) => {
    if (row.BIN === '411111' || row.BIN === '510510') {
      console.log('Found test BIN:', row);
    }
  })
  .on('end', () => {
    console.log('CSV check completed');
  });
