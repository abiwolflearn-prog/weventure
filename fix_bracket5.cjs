const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix lineItems missing bracket
  content = content.replace(/amount: subtotal\s*\}\s*\};\s*await paymentApi/g, 'amount: subtotal\n          }\n        ]\n      };\n      await paymentApi');

  fs.writeFileSync(filePath, content);
  console.log(`Fixed in ${filePath}`);
}

fixFile('src/views/CrmDashboard.tsx');
