const fs = require('fs');
let content = fs.readFileSync('src/views/StartupPage.tsx', 'utf8');

content = content.replace(
  /setFormSuccessMessage\(null\);\r?\n\s*setIsAppModalOpen\(true\);/g,
  "setFormSuccessMessage(null);\n    setIsAppModalOpen(true);\n    const el = document.getElementById('application-form-section');\n    if (el) {\n      el.scrollIntoView({ behavior: 'smooth' });\n    }"
);

fs.writeFileSync('src/views/StartupPage.tsx', content);
console.log('Fixed scroll in StartupPage');
