const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Any text-sky-*, text-blue-* etc in outline buttons
  content = content.replace(/text-sky-200/g, 'text-[#1E3A8A]');
  content = content.replace(/hover:bg-sky-800\/60/g, 'hover:bg-blue-100');
  content = content.replace(/bg-blue-100\/40/g, 'bg-blue-50');
  
  // Dashboard uses mostly #111827, #6B7280, #E5E7EB, #F8FAFC, #FFFFFF, #84CC16
  content = content.replace(/bg-gray-100/g, 'bg-white');
  content = content.replace(/bg-gray-200/g, 'bg-gray-50');
  content = content.replace(/border-gray-200/g, 'border-[#E5E7EB]');
  content = content.replace(/border-gray-300/g, 'border-[#E5E7EB]');
  
  // Tab active states in CRM
  content = content.replace(/text-white bg-[#1E3A8A]/g, 'text-[#1E3A8A] bg-blue-50 font-semibold shadow-sm');
  
  fs.writeFileSync(filePath, content);
  console.log(`Remaining colors fixed in ${filePath}`);
}

fixFile('src/views/CrmDashboard.tsx');
fixFile('src/views/ContactPage.tsx');
fixFile('src/views/InvoicesPage.tsx');
