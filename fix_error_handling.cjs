const fs = require('fs');
let content = fs.readFileSync('src/components/events/RegistrationConfig.tsx', 'utf-8');

content = content.replace(
  "if (isPublish && error.response?.data?.message) {", 
  "if (isPublish && (error.response?.data?.error?.message || error.response?.data?.message)) {"
);

content = content.replace(
  "setPublishError(error.response.data.message);", 
  "setPublishError(error.response?.data?.error?.message || error.response?.data?.message);"
);

fs.writeFileSync('src/components/events/RegistrationConfig.tsx', content);
