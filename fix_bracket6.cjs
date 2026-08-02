const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/\{ month: 'May', revenue: 310000 \}\r?\n\s*\}/g, '{ month: \'May\', revenue: 310000 }\n              ]}');

  fs.writeFileSync(filePath, content);
  console.log(`Fixed in ${filePath}`);
}

fixFile('src/views/CrmDashboard.tsx');
