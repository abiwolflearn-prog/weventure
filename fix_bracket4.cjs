const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/`"\$\{item\.nextDueDate\}"`\r?\n\s*\);/g, '`"${item.nextDueDate}"`\n    ]);');
  content = content.replace(/`"\$\{inv\.paidAt \|\| ''\}"`\r?\n\s*\);/g, '`"${inv.paidAt || \'\'}"`\n  ]);');

  fs.writeFileSync(filePath, content);
  console.log(`Fixed in ${filePath}`);
}

fixFile('src/views/CrmDashboard.tsx');
fixFile('src/views/InvoicesPage.tsx');
