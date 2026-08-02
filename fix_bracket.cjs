const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix array ends
  content = content.replace(/'Next Due Date'\r?\n\s*;/g, "'Next Due Date'\n  ];");
  content = content.replace(/`"\$\{item\.nextDueDate\}"`\r?\n\s*\);/g, '`"${item.nextDueDate}"`\n    ];');
  content = content.replace(/amount: subtotal\s*\}\s*\};\s*await paymentApi/g, 'amount: subtotal\n          }\n        ]\n      };\n      await paymentApi');
  content = content.replace(/\{ month: 'May', revenue: 310000 \}\r?\n\s*\}/g, '{ month: \'May\', revenue: 310000 }\n              ]');
  content = content.replace(/c\.customerType === 'Government'\)\.length \|\| 3 \},\r?\n\s*\}/g, "c.customerType === 'Government').length || 3 },\n                ]");
  content = content.replace(/sortBy,\r?\n\s*,\r?\n\s*queryFn: \(\) =>/g, "sortBy,\n    ],\n    queryFn: () =>");
  content = content.replace(/workspaceFilter,\r?\n\s*,\r?\n\s*queryFn: \(\) =>/g, "workspaceFilter,\n    ],\n    queryFn: () =>");
  content = content.replace(/inv\.paidAt \? new Date\(inv\.paidAt\)\.toISOString\(\)\.split\('T'\)\[0\] : '',\r?\n\s*\);/g, "inv.paidAt ? new Date(inv.paidAt).toISOString().split('T')[0] : '',\n    ];");
  content = content.replace(/'Paid At',\s*;/g, "'Paid At'\n  ];");
  
  // Oh wait, c.customerType... 'Government').length || 3 }  ]; actually it's a JSX attribute array maybe?
  // Let's run build and fix errors one by one.

  fs.writeFileSync(filePath, content);
  console.log(`Fixed in ${filePath}`);
}

fixFile('src/views/CrmDashboard.tsx');
fixFile('src/views/InvoicesPage.tsx');
