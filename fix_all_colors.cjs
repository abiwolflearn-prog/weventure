const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix button mangled text
  content = content.replace(/text-white hover:bg-sky-700 text-\[#111827\]/g, 'text-white hover:bg-blue-700');
  content = content.replace(/text-white text-\[#111827\]/g, 'text-white');
  content = content.replace(/text-\[#111827\] text-white/g, 'text-white');
  
  // Fix leftover sky colors to use Dashboard styles
  content = content.replace(/\btext-sky-700\b/g, 'text-[#1E3A8A]');
  content = content.replace(/\bbg-sky-100\b/g, 'bg-blue-100');
  content = content.replace(/\border-sky-300\b/g, 'border-blue-300');
  content = content.replace(/\bhover:bg-sky-50\b/g, 'hover:bg-blue-50');
  content = content.replace(/\btext-sky-800\b/g, 'text-[#1E3A8A]');

  // Fix slate
  content = content.replace(/\btext-slate-600\b/g, 'text-[#6B7280]');
  content = content.replace(/\btext-slate-800\b/g, 'text-[#111827]');
  content = content.replace(/\bbg-slate-100\b/g, 'bg-gray-100');
  content = content.replace(/\bbg-slate-200\b/g, 'bg-gray-200');
  content = content.replace(/\bborder-slate-300\b/g, 'border-gray-300');
  content = content.replace(/\bborder-slate-400\b/g, 'border-gray-400');
  
  // Fix any remaining `dark:bg-[#1E3A8A]` etc
  content = content.replace(/dark:[a-zA-Z0-9\[\]\#\-]+/g, '');
  
  // Fix the random space colon issues like `:bg-white` or `:bg-lime-950`
  content = content.replace(/ :bg-[a-zA-Z0-9\[\]\#\-]+/g, '');
  
  // WeVentureHub Green
  content = content.replace(/\btext-lime-600\b/g, 'text-[#65A30D]');
  content = content.replace(/\btext-lime-700\b/g, 'text-[#4D7C0F]');
  content = content.replace(/\btext-lime-500\b/g, 'text-[#84CC16]');
  content = content.replace(/\bbg-lime-600\b/g, 'bg-[#65A30D]');
  
  content = content.replace(/\btext-emerald-500\b/g, 'text-[#84CC16]');
  content = content.replace(/\btext-emerald-600\b/g, 'text-[#65A30D]');
  content = content.replace(/\btext-emerald-800\b/g, 'text-[#4D7C0F]');

  // Extra spaces cleanup
  content = content.replace(/ \]/g, ' ');
  content = content.replace(/ +/g, ' ');

  fs.writeFileSync(filePath, content);
  console.log(`Fully fixed colors in ${filePath}`);
}

fixFile('src/views/CrmDashboard.tsx');
fixFile('src/views/ContactPage.tsx');
fixFile('src/views/InvoicesPage.tsx');
