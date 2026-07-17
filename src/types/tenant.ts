export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  GROWTH = 'GROWTH',
  ENTERPRISE = 'ENTERPRISE',
}

export interface ITenantSettings {
  language: string; // e.g., 'en', 'es', 'fr'
  timezone: string; // e.g., 'America/New_York', 'UTC'
  currency: string; // e.g., 'USD', 'EUR', 'GBP'
}

export interface ITenantBranding {
  logoUrl?: string;
  darkLogoUrl?: string;
  faviconUrl?: string;
  primaryColor: string; // hex
  secondaryColor: string; // hex
  accentColor?: string; // hex
  themeMode: 'light' | 'dark' | 'custom' | 'auto';
  
  semanticColors?: {
    success: string;
    warning: string;
    info: string;
    danger: string;
  };

  lightTheme?: {
    background: string;
    cardBackground: string;
    text: string;
    border: string;
  };

  darkTheme?: {
    background: string;
    cardBackground: string;
    text: string;
    border: string;
  };

  dashboardBranding?: {
    sidebarMode: 'light' | 'dark' | 'brand';
    brandTitle: string;
    logoHeight: number; // in pixels
    showPoweredBy: boolean;
  };

  loadingScreen?: {
    loadingText: string;
    spinnerStyle: 'classic' | 'pulse' | 'bars';
    fadeDuration: number; // in milliseconds
  };

  typography?: {
    fontFamily: string;
    fontSizeScale: 'compact' | 'standard' | 'large';
    borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  };

  emailBranding: {
    headerColor: string;
    headerLogoUrl?: string;
    headerAlignment?: 'left' | 'center' | 'right';
    footerText: string;
    supportEmail: string;
    socialFacebook?: string;
    socialTwitter?: string;
    socialLinkedIn?: string;
    socialInstagram?: string;
    buttonBgColor?: string;
    buttonTextColor?: string;
    bannerColor?: string;
  };

  loginBranding: {
    title: string;
    subtitle: string;
    backgroundImageUrl?: string;
  };

  pdfBranding?: {
    invoiceHeaderLogoUrl?: string;
    invoicePrimaryColor: string;
    invoiceNotes?: string;
    invoiceSignatureUrl?: string;
    bankTransferDetails?: string;
    certificateBorderColor: string;
    certificateSignatureUrl?: string;
    certificateLogoUrl?: string;
    certificateTitle: string;
    certificateBackgroundPattern?: 'none' | 'classic' | 'modern';
    reportCoverLogoUrl?: string;
    reportHeaderColor: string;
    reportFooterPageNumbering: boolean;
    reportConfidentialityLabel?: string;
  };
}

export interface ITenantSubscription {
  plan: SubscriptionPlan;
  isTrial: boolean;
  expiresAt: string;
  limits: {
    maxWorkspaces: number;
    maxEvents: number;
    maxUsers: number;
  };
  featureFlags: any;
}

export interface ITenant {
  id: string; // unique slug e.g. 'weventurehub'
  name: string;
  description?: string;
  status: TenantStatus;
  settings: ITenantSettings;
  branding: ITenantBranding;
  subscription: ITenantSubscription;
  createdAt: string;
  updatedAt: string;
}

export interface ITenantAuditLog {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  action: string; // e.g., 'TENANT_CREATE', 'TENANT_SUSPEND', 'BRANDING_UPDATE'
  ipAddress?: string;
  details: Record<string, any>;
  timestamp: string;
}
