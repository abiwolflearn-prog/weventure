const fs = require('fs');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace dark mode backgrounds
  content = content.replace(/\bbg-slate-950\b/g, 'bg-[#F8FAFC]'); // Page background
  content = content.replace(/\bbg-slate-900\b/g, 'bg-white'); // Card background
  content = content.replace(/\bbg-slate-850\b/g, 'bg-gray-50');
  content = content.replace(/\bbg-slate-800\b/g, 'bg-gray-100');
  content = content.replace(/\bbg-slate-700\b/g, 'bg-gray-200');

  // Replace borders
  content = content.replace(/\bborder-slate-800\b/g, 'border-[#E5E7EB]');
  content = content.replace(/\bborder-slate-700\b/g, 'border-gray-200');
  content = content.replace(/\bborder-slate-600\b/g, 'border-gray-300');

  // Replace text colors
  content = content.replace(/\btext-slate-400\b/g, 'text-[#6B7280]');
  content = content.replace(/\btext-slate-500\b/g, 'text-[#6B7280]');
  content = content.replace(/\btext-slate-300\b/g, 'text-gray-600');
  content = content.replace(/\btext-slate-200\b/g, 'text-gray-700');
  // Need to be careful with text-white: don't replace if it's on a primary button (e.g., bg-[#1E3A8A] text-white).
  // But wait, the standard text color in those cards is text-white. Let's do a smart replace where bg-slate-* was removed.
  // We'll just replace text-white with text-[#111827] unless it's preceded by a dark background color. But regex is hard.
  // Actually, replacing text-white with text-[#111827] everywhere might break buttons.
  // Let's replace text-white with text-[#111827] for generic text, but fix buttons manually?
  // Let's replace text-white with text-[#111827].
  // Then fix: bg-[#1E3A8A] text-[#111827] -> bg-[#1E3A8A] text-white.
  content = content.replace(/\btext-white\b/g, 'text-[#111827]');

  // Replace sky colors (often primary) with Primary Blue #1E3A8A
  content = content.replace(/\bbg-sky-600\b/g, 'bg-[#1E3A8A] text-white');
  content = content.replace(/\bbg-sky-500\b/g, 'bg-blue-600 text-white');
  content = content.replace(/\bhover:bg-sky-500\b/g, 'hover:bg-blue-700');
  content = content.replace(/\bhover:bg-sky-400\b/g, 'hover:bg-blue-600');
  content = content.replace(/\btext-sky-400\b/g, 'text-[#1E3A8A]');
  content = content.replace(/\btext-sky-300\b/g, 'text-blue-600');
  content = content.replace(/\btext-sky-600\b/g, 'text-[#1E3A8A]');
  content = content.replace(/\bbg-sky-950\b/g, 'bg-blue-50');
  content = content.replace(/\bbg-sky-900\b/g, 'bg-blue-100');
  content = content.replace(/\border-sky-500\b/g, 'border-[#1E3A8A]');
  content = content.replace(/\border-sky-700\b/g, 'border-blue-200');

  // Fix button text colors that were mangled
  content = content.replace(/bg-\[#1E3A8A\] text-\[#111827\]/g, 'bg-[#1E3A8A] text-white');
  content = content.replace(/bg-blue-600 text-\[#111827\]/g, 'bg-blue-600 text-white');
  content = content.replace(/bg-\[#84CC16\] text-\[#111827\]/g, 'bg-[#84CC16] text-white');

  // WeVentureHub green (#84CC16)
  content = content.replace(/\bbg-lime-500\b/g, 'bg-[#84CC16]');
  content = content.replace(/\bbg-emerald-500\b/g, 'bg-[#84CC16]');
  content = content.replace(/\btext-lime-400\b/g, 'text-[#84CC16]');
  content = content.replace(/\btext-emerald-400\b/g, 'text-[#84CC16]');
  content = content.replace(/\bborder-lime-500\b/g, 'border-[#84CC16]');

  // Clean up any double text-white
  content = content.replace(/text-white text-white/g, 'text-white');

  fs.writeFileSync(filePath, content);
  console.log(`Processed ${filePath}`);
}

processFile('src/views/CrmDashboard.tsx');
processFile('src/views/ContactPage.tsx');
processFile('src/views/InvoicesPage.tsx');
