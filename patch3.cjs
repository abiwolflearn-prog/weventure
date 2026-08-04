const fs = require('fs');

let content = fs.readFileSync('src/components/events/RegistrationConfig.tsx', 'utf-8');

// Add QRCodeSVG import
if (!content.includes('qrcode.react')) {
  content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { QRCodeSVG } from 'qrcode.react';");
}

// Add ExternalLink, Download, AlertCircle if not in lucide-react
if (!content.includes('ExternalLink,')) {
  content = content.replace("} from 'lucide-react';", "  ExternalLink,\n  Download,\n  AlertCircle\n} from 'lucide-react';");
}

// Add state for publish success
const stateHooks = `  const [fields, setFields] = useState<IRsvpFormField[]>(event.rsvpFormFields?.length ? event.rsvpFormFields : DEFAULT_RSVP_FIELDS);`;
const newStateHooks = `  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [fields, setFields] = useState<IRsvpFormField[]>(event.rsvpFormFields?.length ? event.rsvpFormFields : DEFAULT_RSVP_FIELDS);`;

content = content.replace(stateHooks, newStateHooks);

// Handle publish properly in handleSave
const oldHandleSave = `
  const handleSave = async (isPublish = false) => {
    setSaveStatus('saving');
    try {
      const draftData = {
        fields,
        appearance,
        emailSettings,
        ticketSettings
      };
      
      const response = await axiosInstance.put(\`/api/v1/events/\${event.id}/rsvp-configuration/draft\`, draftData);
      setLastSaved(response.data.data.draft.updatedAt);
      
      if (isPublish) {
        const pubResponse = await axiosInstance.post(\`/api/v1/events/\${event.id}/rsvp-configuration/publish\`);
        setConfigVersions(pubResponse.data.data.versions);
        setPublishedVersion(pubResponse.data.data.publishedVersion);
      }
      
      // Keep event object in sync for dashboard
      await onUpdate({
        rsvpFormFields: fields,
        rsvpFormAppearance: appearance,
        rsvpEmailSettings: emailSettings,
        rsvpTicketSettings: ticketSettings,
      });
      
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error');
    }
  };
`;

const newHandleSave = `
  const handleSave = async (isPublish = false) => {
    setSaveStatus('saving');
    setPublishError(null);
    try {
      const draftData = {
        fields,
        appearance,
        emailSettings,
        ticketSettings
      };
      
      const response = await axiosInstance.put(\`/api/v1/events/\${event.id}/rsvp-configuration/draft\`, draftData);
      setLastSaved(response.data.data.draft.updatedAt);
      
      if (isPublish) {
        const pubResponse = await axiosInstance.post(\`/api/v1/events/\${event.id}/rsvp-configuration/publish\`);
        setConfigVersions(pubResponse.data.data.versions);
        setPublishedVersion(pubResponse.data.data.publishedVersion);
        setPublishSuccess(true);
      }
      
      // Keep event object in sync for dashboard
      await onUpdate({
        rsvpFormFields: fields,
        rsvpFormAppearance: appearance,
        rsvpEmailSettings: emailSettings,
        rsvpTicketSettings: ticketSettings,
      });
      
      setSaveStatus('saved');
    } catch (error: any) {
      setSaveStatus('error');
      if (isPublish && error.response?.data?.message) {
        setPublishError(error.response.data.message);
      }
    }
  };
`;

content = content.replace(oldHandleSave.trim(), newHandleSave.trim());

// Update the "Publish Form" button onClick and add error message
const publishBtnStr = `<Button size="sm" variant="primary" className="h-9 px-4 text-[10px] font-black uppercase">Publish Form</Button>`;
const newPublishBtnStr = `
                        {publishError && (
                          <div className="text-red-500 text-xs font-medium mr-2 max-w-xs truncate" title={publishError}>
                            {publishError}
                          </div>
                        )}
                       <Button size="sm" variant="primary" onClick={() => handleSave(true)} className="h-9 px-4 text-[10px] font-black uppercase">Publish Form</Button>
`;

content = content.replace(publishBtnStr, newPublishBtnStr);

// Add the Success Overlay before the last </div>
const overlayJSX = `
      {publishSuccess && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">RSVP Form Published Successfully</h2>
              <p className="text-gray-500 mb-8">Your RSVP form is now live and accepting registrations.</p>
              
              <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 border border-gray-200">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">RSVP Link</label>
                <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden">
                  <input 
                    type="text" 
                    readOnly 
                    value={\`https://weventurehub.com/events/\${event.slug || event.id}/rsvp\`}
                    className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-700 outline-none"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(\`https://weventurehub.com/events/\${event.slug || event.id}/rsvp\`);
                      alert('Copied to clipboard!');
                    }}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors border-l border-gray-200"
                    title="Copy Link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex justify-center mb-8">
                <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm inline-block">
                  <QRCodeSVG 
                    value={\`https://weventurehub.com/events/\${event.slug || event.id}/rsvp\`} 
                    size={120}
                    id="rsvp-qrcode"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    const canvas = document.getElementById("rsvp-qrcode");
                    if(canvas) {
                      const svgData = new XMLSerializer().serializeToString(canvas);
                      const canvasElem = document.createElement("canvas");
                      const ctx = canvasElem.getContext("2d");
                      const img = new Image();
                      img.onload = () => {
                        canvasElem.width = img.width;
                        canvasElem.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        const pngFile = canvasElem.toDataURL("image/png");
                        const downloadLink = document.createElement("a");
                        downloadLink.download = "rsvp-qr.png";
                        downloadLink.href = \`\${pngFile}\`;
                        downloadLink.click();
                      };
                      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download QR Code
                </Button>
                <Button 
                  variant="primary" 
                  className="flex-1"
                  onClick={() => window.open(\`https://weventurehub.com/events/\${event.slug || event.id}/rsvp\`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open RSVP Page
                </Button>
              </div>
            </div>
            <div className="border-t border-gray-100 bg-gray-50 p-4 flex justify-end">
              <Button variant="outline" onClick={() => setPublishSuccess(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
`;

const closeDivStr = `    </div>\n  );\n};`;
if (content.includes(closeDivStr)) {
  content = content.replace(closeDivStr, overlayJSX);
} else {
  // Try another way to match the end of the file
  const closeStr2 = `    </div>\n  )\n}`;
  if (content.includes(closeStr2)) {
    content = content.replace(closeStr2, overlayJSX);
  }
}

fs.writeFileSync('src/components/events/RegistrationConfig.tsx', content);
