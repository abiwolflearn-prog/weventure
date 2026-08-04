const fs = require('fs');

let content = fs.readFileSync('src/components/events/RegistrationConfig.tsx', 'utf-8');

content = content.replace("Search\n  ExternalLink,", "Search,\n  ExternalLink,");

fs.writeFileSync('src/components/events/RegistrationConfig.tsx', content);
