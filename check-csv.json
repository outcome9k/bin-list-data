const fs = require('fs');
const csv = require('csv-parser');

console.log('🔍 Checking BIN 418210 in CSV file...');

const results = [];
fs.createReadStream('./bin-list-data.csv')
  .pipe(csv())
  .on('data', (row) => {
    if (row.BIN === '418210') {
      console.log('✅ FOUND 418210:', row);
    }
    results.push(row);
  })
  .on('end', () => {
    console.log(`📊 Total records: ${results.length}`);
    
    // Check if 418210 exists
    const found = results.find(r => r.BIN === '418210');
    if (!found) {
      console.log('❌ 418210 NOT FOUND in CSV');
      console.log('Sample BINs around 418xxx:');
      const similar = results.filter(r => r.BIN.startsWith('418')).slice(0, 5);
      similar.forEach(row => console.log(`   ${row.BIN}: ${row.Brand} - ${row.Issuer}`));
    }
  });
