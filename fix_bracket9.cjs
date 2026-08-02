const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/inv\.paidAt \? new Date\(inv\.paidAt\)\.toISOString\(\)\.split\('T'\)\[0\] : '',\r?\n\s*\);/g, "inv.paidAt ? new Date(inv.paidAt).toISOString().split('T')[0] : '',\n    ]);");

  fs.writeFileSync(filePath, content);
  console.log(`Fixed in ${filePath}`);
}

fixFile('src/views/InvoicesPage.tsx');
