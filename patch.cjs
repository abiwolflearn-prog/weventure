const fs = require('fs');

let content = fs.readFileSync('src/components/events/RegistrationConfig.tsx', 'utf-8');

const stateDecls = `
  const [activeTab, setActiveTab] = useState<'general' | 'builder' | 'design' | 'email' | 'ticket' | 'access' | 'registrations' | 'performance'>('general');
  const [isPreview, setIsPreview] = useState(false);
  const [fields, setFields] = useState<IRsvpFormField[]>(event.rsvpFormFields || []);
`;

const newStateDecls = `
  const [activeTab, setActiveTab] = useState<'general' | 'builder' | 'design' | 'email' | 'ticket' | 'access' | 'registrations' | 'performance' | 'versions'>('general');
  const [isPreview, setIsPreview] = useState(false);
  
  const [configVersions, setConfigVersions] = useState<any[]>([]);
  const [publishedVersion, setPublishedVersion] = useState(0);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  const [fields, setFields] = useState<IRsvpFormField[]>(event.rsvpFormFields || []);
`;

content = content.replace(stateDecls.trim(), newStateDecls.trim());

const autoSaveLogic = `
  // Auto-save logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (saveStatus === 'saving') {
        handleSave();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [fields, appearance, emailSettings, ticketSettings]);

  useEffect(() => {
    if (activeTab === 'registrations') {
      fetchRegistrations();
    }
  }, [activeTab]);
`;

const newAutoSaveLogic = `
  // Config fetching
  useEffect(() => {
    if (event?.id) {
      fetchConfig();
    }
  }, [event?.id]);

  const fetchConfig = async () => {
    setIsLoadingConfig(true);
    try {
      const response = await axiosInstance.get(\`/api/v1/events/\${event.id}/rsvp-configuration\`);
      const config = response.data?.data;
      if (config) {
        if (config.draft?.fields?.length) setFields(config.draft.fields);
        if (config.draft?.appearance) setAppearance(config.draft.appearance);
        if (config.draft?.emailSettings) setEmailSettings(config.draft.emailSettings);
        if (config.draft?.ticketSettings) setTicketSettings(config.draft.ticketSettings);
        
        setConfigVersions(config.versions || []);
        setPublishedVersion(config.publishedVersion || 0);
        setLastSaved(config.draft?.updatedAt);
      }
    } catch (error) {
      console.error("Failed to load RSVP configuration", error);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  // Auto-save trigger
  useEffect(() => {
    if (isLoadingConfig) return; // don't auto-save while loading
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      handleSave(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [fields, appearance, emailSettings, ticketSettings]);

  useEffect(() => {
    if (activeTab === 'registrations') {
      fetchRegistrations();
    }
  }, [activeTab]);
`;

content = content.replace(autoSaveLogic.trim(), newAutoSaveLogic.trim());

const handleSaveCode = `
  const handleSave = async () => {
    setSaveStatus('saving');
    try {
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

const newHandleSaveCode = `
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

  const handleRestoreVersion = async (version: number) => {
    if (!confirm(\`Are you sure you want to restore Version \${version}? Unsaved changes will be lost.\`)) return;
    
    try {
      const response = await axiosInstance.post(\`/api/v1/events/\${event.id}/rsvp-configuration/restore/\${version}\`);
      const config = response.data.data;
      if (config) {
        if (config.draft?.fields) setFields(config.draft.fields);
        if (config.draft?.appearance) setAppearance(config.draft.appearance);
        if (config.draft?.emailSettings) setEmailSettings(config.draft.emailSettings);
        if (config.draft?.ticketSettings) setTicketSettings(config.draft.ticketSettings);
        setLastSaved(config.draft?.updatedAt);
      }
    } catch (error) {
      console.error("Failed to restore version", error);
    }
  };
`;

content = content.replace(handleSaveCode.trim(), newHandleSaveCode.trim());

// Insert Versions Tab in Sidebar
const sidebarNav = `
              <button
                onClick={() => setActiveTab('performance')}
                className={\`w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-colors \${activeTab === 'performance' ? 'bg-[#0F172A] text-white' : 'text-gray-600 hover:bg-gray-100'}\`}
              >
                <div className="flex items-center gap-3">
                  <BarChart2 className="w-4 h-4" />
                  Performance
                </div>
              </button>
`;
const newSidebarNav = sidebarNav + `
              <button
                onClick={() => setActiveTab('versions')}
                className={\`w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-colors \${activeTab === 'versions' ? 'bg-[#0F172A] text-white' : 'text-gray-600 hover:bg-gray-100'}\`}
              >
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4" />
                  Version History
                </div>
              </button>
`;

content = content.replace(sidebarNav, newSidebarNav);

// Insert Versions Tab Content
const versionsTabContent = `
          {activeTab === 'versions' && (
            <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div>
                <h2 className="text-2xl font-bold text-[#0F172A]">Version History</h2>
                <p className="text-gray-500 mt-1">Manage and restore previous published versions of your RSVP form.</p>
              </div>

              <div className="space-y-4">
                {configVersions.length === 0 ? (
                  <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-200">
                    <History className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-sm font-medium text-gray-900">No versions yet</h3>
                    <p className="text-sm text-gray-500 mt-1">Publish your form to create the first version.</p>
                  </div>
                ) : (
                  configVersions.slice().reverse().map((version: any) => (
                    <div key={version.versionNumber} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">Version {version.versionNumber}</h4>
                          {publishedVersion === version.versionNumber && (
                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                              Current Published
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Created {format(new Date(version.createdAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreVersion(version.versionNumber)}
                      >
                        Restore
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
`;

const endOfTabs = `
          {activeTab === 'performance' && (
`;

content = content.replace(endOfTabs, versionsTabContent + '\n' + endOfTabs);

// Publish Button & Last Saved status
const saveStatusDiv = `
              <div className="flex items-center gap-2">
                {saveStatus === 'saving' && <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />}
                {saveStatus === 'saved' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {saveStatus === 'error' && <X className="w-4 h-4 text-red-500" />}
                <span className="text-sm text-gray-500">
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Error saving'}
                </span>
              </div>
`;
const newSaveStatusDiv = `
              <div className="flex items-center gap-2">
                {saveStatus === 'saving' && <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />}
                {saveStatus === 'saved' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {saveStatus === 'error' && <X className="w-4 h-4 text-red-500" />}
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-700">
                    {saveStatus === 'saving' ? 'Saving draft...' : saveStatus === 'saved' ? 'Draft saved' : 'Error saving'}
                  </span>
                  {lastSaved && saveStatus !== 'saving' && (
                    <span className="text-xs text-gray-500">
                      Last saved: {format(new Date(lastSaved), 'h:mm a')}
                    </span>
                  )}
                </div>
              </div>
              <Button onClick={() => handleSave(true)} className="ml-4 gap-2">
                <CheckCircle className="w-4 h-4" />
                Publish v{publishedVersion + 1}
              </Button>
`;

content = content.replace(saveStatusDiv, newSaveStatusDiv);

fs.writeFileSync('src/components/events/RegistrationConfig.tsx', content);

