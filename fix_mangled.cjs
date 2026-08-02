const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/text-slate-700 \]/g, 'text-gray-700');
  content = content.replace(/text-slate-700/g, 'text-gray-700');
  content = content.replace(/border-slate-200/g, 'border-gray-200');
  content = content.replace(/bg-slate-100/g, 'bg-gray-100');

  // Any other random `]` brackets floating around from stripped `dark:XXX`
  content = content.replace(/ \]/g, ' ');

  fs.writeFileSync(filePath, content);
  console.log(`Mangled syntax fixed in ${filePath}`);
}

fixFile('src/views/CrmDashboard.tsx');
fixFile('src/views/ContactPage.tsx');
fixFile('src/views/InvoicesPage.tsx');
