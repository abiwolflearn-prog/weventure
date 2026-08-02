const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix the broken bracket syntax from the previous regex
  content = content.replace(/bg-\[#F8FAFC\] \]/g, 'bg-[#F8FAFC]');
  content = content.replace(/text-\[#111827\] \]/g, 'text-[#111827]');
  content = content.replace(/bg-white \]/g, 'bg-white');
  content = content.replace(/text-white \]/g, 'text-white');
  
  // also clean up any remaining `dark:XXX` just in case by avoiding \b on brackets
  content = content.replace(/dark:[a-zA-Z0-9\[\]\#\-]+/g, '');
  
  content = content.replace(/ +/g, ' ');

  fs.writeFileSync(filePath, content);
  console.log(`Syntax fixed in ${filePath}`);
}

fixFile('src/views/CrmDashboard.tsx');
fixFile('src/views/ContactPage.tsx');
fixFile('src/views/InvoicesPage.tsx');
