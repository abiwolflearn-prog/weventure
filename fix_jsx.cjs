const fs = require('fs');
let content = fs.readFileSync('src/views/CrmDashboard.tsx', 'utf8');

content = content.replace(/\]\s*>\s*<defs>/g, ']}\n              >\n              <defs>');

fs.writeFileSync('src/views/CrmDashboard.tsx', content);
