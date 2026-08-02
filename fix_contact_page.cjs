const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix custom dark colors
  content = content.replace(/bg-\[#181818\]/g, 'bg-white');
  content = content.replace(/bg-\[#111111\]/g, 'bg-[#F8FAFC]');
  content = content.replace(/border-neutral-800/g, 'border-[#E5E7EB]');
  
  content = content.replace(/text-neutral-slate-400/g, 'text-[#6B7280]');
  content = content.replace(/text-neutral-slate-300/g, 'text-[#6B7280]');
  content = content.replace(/text-neutral-400/g, 'text-[#6B7280]');
  content = content.replace(/text-brand-accent/g, 'text-[#84CC16]');
  content = content.replace(/text-white/g, 'text-[#111827]');
  
  // Make sure button texts have text-white if they are bg-[#1E3A8A] or bg-[#84CC16]
  content = content.replace(/className="([^"]*)bg-\[#1E3A8A\]([^"]*)"/g, function(match, p1, p2) {
      if(!match.includes('text-white')) return `className="${p1}bg-[#1E3A8A] text-white${p2}"`;
      return match;
  });
  content = content.replace(/className="([^"]*)bg-\[#84CC16\]([^"]*)"/g, function(match, p1, p2) {
      if(!match.includes('text-white')) return `className="${p1}bg-[#84CC16] text-white${p2}"`;
      return match;
  });
  
  // Also bg-brand-accent -> bg-[#84CC16]
  content = content.replace(/bg-brand-accent/g, 'bg-[#84CC16]');
  // hover:bg-brand-accent/90
  content = content.replace(/hover:bg-brand-accent\/90/g, 'hover:bg-lime-600');

  // Fix any background of the main wrapper if it uses a dark color.
  content = content.replace(/className="([^"]*)bg-neutral-slate-950([^"]*)"/g, `className="$1bg-[#F8FAFC]$2"`);

  fs.writeFileSync(filePath, content);
  console.log(`Fixed ContactPage colors in ${filePath}`);
}

fixFile('src/views/ContactPage.tsx');
