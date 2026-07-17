export interface IFeatureFlagDefinition {
  key: string;
  name: string;
  description: string;
  category: 'analytics' | 'infrastructure' | 'events' | 'support' | 'customization';
}

export const FEATURE_REGISTRY: IFeatureFlagDefinition[] = [
  {
    key: 'enableAdvancedAnalytics',
    name: 'Advanced ML Analytics',
    description: 'Unlocks machine-learning powered visitor tracking, advanced chart breakdowns, and multi-workspace forecasting reports.',
    category: 'analytics',
  },
  {
    key: 'enableAPIIntegrations',
    name: 'Developer APIs & Webhooks',
    description: 'Allows generating secure API access keys and configuring real-time system event webhooks.',
    category: 'infrastructure',
  },
  {
    key: 'enableCustomDomain',
    name: 'Custom Domain SSL Routing',
    description: 'Enables white-labeled custom branding subdomains and secure SSL domain masking.',
    category: 'infrastructure',
  },
  {
    key: 'enableBulkRegistration',
    name: 'Bulk CSV Registration',
    description: 'Enables high-capacity CSV list imports and bulk ticket registrations for rapid event onboarding.',
    category: 'events',
  },
  {
    key: 'enablePrioritySupport',
    name: '24/7 Priority SLA Support',
    description: 'Guarantees 2-hour SLA response times directly from our technical staff team.',
    category: 'support',
  },
  {
    key: 'enableCustomTeaming',
    name: 'Granular Role Permissioning',
    description: 'Allows nesting custom administrative staff groups, team hierarchies, and secure folder scopes.',
    category: 'customization',
  },
];
