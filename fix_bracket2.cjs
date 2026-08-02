const fs = require('fs');
let c = fs.readFileSync('src/views/CrmDashboard.tsx', 'utf8');
c = c.replace(/`"\$\{item\.nextDueDate\}"`\r?\n\s*\];/g, '`"${item.nextDueDate}"`\n    ]);');
fs.writeFileSync('src/views/CrmDashboard.tsx', c);

let i = fs.readFileSync('src/views/InvoicesPage.tsx', 'utf8');
i = i.replace(/inv\.paidAt \? new Date\(inv\.paidAt\)\.toISOString\(\)\.split\('T'\)\[0\] : '',\r?\n\s*\];/g, "inv.paidAt ? new Date(inv.paidAt).toISOString().split('T')[0] : '',\n    ]);");
fs.writeFileSync('src/views/InvoicesPage.tsx', i);
