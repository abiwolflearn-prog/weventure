const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/sortBy,\r?\n\s*,\r?\n\s*queryFn: \(\) =>/g, "sortBy,\n    ],\n    queryFn: () =>");
  content = content.replace(/workspaceFilter,\r?\n\s*,\r?\n\s*queryFn: \(\) =>/g, "workspaceFilter,\n    ],\n    queryFn: () =>");

  fs.writeFileSync(filePath, content);
  console.log(`Fixed in ${filePath}`);
}

fixFile('src/views/InvoicesPage.tsx');
