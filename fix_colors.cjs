const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix up overlapping text color classes
  content = content.replace(/text-white text-\[#111827\]/g, 'text-white');
  content = content.replace(/text-\[#111827\] text-white/g, 'text-white');
  content = content.replace(/text-white text-white/g, 'text-white');
  content = content.replace(/bg-\[#1E3A8A\] text-white hover:bg-blue-600 text-white/g, 'bg-[#1E3A8A] hover:bg-blue-600 text-white');
  
  // also some text-slate-* colors were not completely handled, maybe?
  // Let's replace any `text-slate-900` or `text-slate-950` with `text-[#111827]`
  content = content.replace(/\btext-slate-900\b/g, 'text-[#111827]');
  content = content.replace(/\btext-slate-950\b/g, 'text-[#111827]');
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${filePath}`);
}

fixFile('src/views/CrmDashboard.tsx');
fixFile('src/views/ContactPage.tsx');
fixFile('src/views/InvoicesPage.tsx');
