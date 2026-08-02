const fs = require('fs');
let i = fs.readFileSync('src/views/InvoicesPage.tsx', 'utf8');
i = i.replace(/'Paid At'\r?\n\s*;/g, "'Paid At'\n  ];");
fs.writeFileSync('src/views/InvoicesPage.tsx', i);
