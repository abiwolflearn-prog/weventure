const fs = require('fs');
let content = fs.readFileSync('src/views/StartupManagementPage.tsx', 'utf8');

content = content.replace(/\btext-slate-400\b/g, 'text-gray-400');
content = content.replace(/\btext-slate-500\b/g, 'text-gray-500');
content = content.replace(/\btext-slate-600\b/g, 'text-[#6B7280]');
content = content.replace(/\btext-slate-700\b/g, 'text-gray-700');
content = content.replace(/\btext-slate-800\b/g, 'text-gray-800');
content = content.replace(/\btext-slate-900\b/g, 'text-[#111827]');
content = content.replace(/\bbg-slate-50\b/g, 'bg-gray-50');
content = content.replace(/\bbg-slate-100\b/g, 'bg-gray-100');
content = content.replace(/\bbg-slate-200\b/g, 'bg-gray-200');
content = content.replace(/\bborder-slate-200\b/g, 'border-gray-200');
content = content.replace(/\bborder-slate-300\b/g, 'border-gray-300');

fs.writeFileSync('src/views/StartupManagementPage.tsx', content);
console.log('Fixed StartupManagementPage colors');
