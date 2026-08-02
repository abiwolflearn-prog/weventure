const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/c\.customerType === 'Government'\)\.length \|\| 3 \},\r?\n\s*\}/g, "c.customerType === 'Government').length || 3 },\n                ]}");

  fs.writeFileSync(filePath, content);
  console.log(`Fixed in ${filePath}`);
}

fixFile('src/views/CrmDashboard.tsx');
