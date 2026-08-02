const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Strip all dark: variants
  content = content.replace(/dark:[a-zA-Z0-9\[\]\#\-]+\b/g, '');
  
  // Replace the crazy gradient header with standard white card
  content = content.replace(/bg-gradient-to-r from-[^ ]+ via-[^ ]+ to-[^ ]+/g, 'bg-white');
  
  // Fix sky-800/40 or slate-900 colors in that header block
  content = content.replace(/border-sky-800\/40/g, 'border-[#E5E7EB]');
  
  // Clean up any stray text-white that got added directly on standard text because of the old dark gradient
  // Let's replace `text-white text-[#111827]` logic just in case
  content = content.replace(/text-white flex items-center gap-2/g, 'text-[#111827] flex items-center gap-2');
  content = content.replace(/text-white opacity-80/g, 'text-[#6B7280]');
  
  // Fix the wrapper bg-slate-50
  content = content.replace(/bg-slate-50 /g, 'bg-[#F8FAFC] ');

  // Fix button variants that might have bg-slate-800, replace with bg-white or bg-[#1E3A8A]
  content = content.replace(/\bbg-slate-800\b/g, 'bg-white');
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed dark mode in ${filePath}`);
}

fixFile('src/views/CrmDashboard.tsx');
fixFile('src/views/ContactPage.tsx');
fixFile('src/views/InvoicesPage.tsx');
