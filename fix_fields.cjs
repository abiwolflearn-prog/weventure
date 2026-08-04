const fs = require('fs');

let content = fs.readFileSync('src/components/events/RegistrationConfig.tsx', 'utf-8');

const oldFields = `const DEFAULT_RSVP_FIELDS: IRsvpFormField[] = [
  { id: 'f_name', type: 'name', label: 'Full Name', required: true, placeholder: 'Enter your full name' },
  { id: 'f_email', type: 'email', label: 'Email Address', required: true, placeholder: 'Enter your email' },
  { id: 'f_company', type: 'company', label: 'Company / Organization', required: false, placeholder: 'Where do you work?' }
];`;

const newFields = `const DEFAULT_RSVP_FIELDS: IRsvpFormField[] = [
  { id: 'f_name', type: 'text', label: 'Full Name', required: true, placeholder: 'Enter your full name', order: 1 },
  { id: 'f_email', type: 'email', label: 'Email Address', required: true, placeholder: 'Enter your email', order: 2 },
  { id: 'f_company', type: 'company', label: 'Company / Organization', required: false, placeholder: 'Where do you work?', order: 3 }
];`;

content = content.replace(oldFields, newFields);

fs.writeFileSync('src/components/events/RegistrationConfig.tsx', content);

