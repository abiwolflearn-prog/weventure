const fs = require('fs');

let content = fs.readFileSync('src/components/events/RegistrationConfig.tsx', 'utf-8');

const defaultFieldsStr = `
const DEFAULT_RSVP_FIELDS: IRsvpFormField[] = [
  { id: 'f_name', type: 'name', label: 'Full Name', required: true, placeholder: 'Enter your full name' },
  { id: 'f_email', type: 'email', label: 'Email Address', required: true, placeholder: 'Enter your email' },
  { id: 'f_company', type: 'company', label: 'Company / Organization', required: false, placeholder: 'Where do you work?' }
];
`;

content = content.replace('export const RegistrationConfig: React.FC<RegistrationConfigProps> = ({', defaultFieldsStr + '\nexport const RegistrationConfig: React.FC<RegistrationConfigProps> = ({');

const initFields = `const [fields, setFields] = useState<IRsvpFormField[]>(event.rsvpFormFields || []);`;
const newInitFields = `const [fields, setFields] = useState<IRsvpFormField[]>(event.rsvpFormFields?.length ? event.rsvpFormFields : DEFAULT_RSVP_FIELDS);`;

content = content.replace(initFields, newInitFields);

const fetchFields = `if (config.draft?.fields?.length) setFields(config.draft.fields);`;
const newFetchFields = `
        if (config.draft?.fields?.length) {
          setFields(config.draft.fields);
        } else {
          setFields(event.rsvpFormFields?.length ? event.rsvpFormFields : DEFAULT_RSVP_FIELDS);
        }
`;

content = content.replace(fetchFields, newFetchFields);

fs.writeFileSync('src/components/events/RegistrationConfig.tsx', content);

