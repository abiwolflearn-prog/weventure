import mongoose, { Schema, Document } from 'mongoose';
import { TenantStatus, SubscriptionPlan } from '../types';

export interface ITenantDocument {
  _id: string;
  id: string; // maps to the string slug id
  name: string;
  description?: string;
  status: TenantStatus;
  settings: {
    language: string;
    timezone: string;
    currency: string;
  };
  branding: {
    logoUrl?: string;
    darkLogoUrl?: string;
    faviconUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor?: string;
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
      logoHeight: number;
      showPoweredBy: boolean;
    };

    loadingScreen?: {
      loadingText: string;
      spinnerStyle: 'classic' | 'pulse' | 'bars';
      fadeDuration: number;
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
  };
  subscription: {
    plan: SubscriptionPlan;
    isTrial: boolean;
    expiresAt: Date;
    limits: {
      maxWorkspaces: number;
      maxEvents: number;
      maxUsers: number;
    };
    featureFlags: any;
  };
  website?: {
    enabled: boolean;
    hero: {
      title: string;
      subtitle: string;
      backgroundImageUrl?: string;
      ctaText: string;
      ctaLink: string;
    };
    about: {
      title: string;
      description: string;
      foundingYear?: number;
      highlights?: string[];
    };
    team: Array<{
      name: string;
      role: string;
      bio?: string;
      photoUrl?: string;
    }>;
    gallery: Array<{
      url: string;
      caption?: string;
    }>;
    testimonials: Array<{
      name: string;
      role?: string;
      text: string;
      rating: number;
      avatarUrl?: string;
    }>;
    seo: {
      metaTitle?: string;
      metaDescription?: string;
      metaKeywords?: string[];
      ogImage?: string;
    };
    analytics?: {
      googleAnalyticsId?: string;
      pixelId?: string;
      customScript?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new Schema<ITenantDocument>(
  {
    _id: { type: String, required: true }, // we use the slug (e.g. 'weventurehub') as the custom string _id
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(TenantStatus),
      default: TenantStatus.ACTIVE,
      required: true,
      index: true,
    },
    settings: {
      language: { type: String, default: 'en', required: true },
      timezone: { type: String, default: 'UTC', required: true },
      currency: { type: String, default: 'USD', required: true },
    },
    branding: {
      logoUrl: { type: String },
      darkLogoUrl: { type: String },
      faviconUrl: { type: String },
      primaryColor: { type: String, default: '#0284c7', required: true },
      secondaryColor: { type: String, default: '#0f172a', required: true },
      accentColor: { type: String, default: '#0ea5e9' },
      themeMode: { type: String, enum: ['light', 'dark', 'custom', 'auto'], default: 'light', required: true },
      
      semanticColors: {
        success: { type: String, default: '#10b981' },
        warning: { type: String, default: '#f59e0b' },
        info: { type: String, default: '#3b82f6' },
        danger: { type: String, default: '#ef4444' }
      },

      lightTheme: {
        background: { type: String, default: '#f8fafc' },
        cardBackground: { type: String, default: '#ffffff' },
        text: { type: String, default: '#0f172a' },
        border: { type: String, default: '#e2e8f0' }
      },

      darkTheme: {
        background: { type: String, default: '#0f172a' },
        cardBackground: { type: String, default: '#1e293b' },
        text: { type: String, default: '#f8fafc' },
        border: { type: String, default: '#334155' }
      },

      dashboardBranding: {
        sidebarMode: { type: String, enum: ['light', 'dark', 'brand'], default: 'light' },
        brandTitle: { type: String, default: '' },
        logoHeight: { type: Number, default: 32 },
        showPoweredBy: { type: Boolean, default: true }
      },

      loadingScreen: {
        loadingText: { type: String, default: 'Loading your experience...' },
        spinnerStyle: { type: String, enum: ['classic', 'pulse', 'bars'], default: 'classic' },
        fadeDuration: { type: Number, default: 300 }
      },

      typography: {
        fontFamily: { type: String, default: 'Inter' },
        fontSizeScale: { type: String, enum: ['compact', 'standard', 'large'], default: 'standard' },
        borderRadius: { type: String, enum: ['none', 'sm', 'md', 'lg', 'full'], default: 'lg' }
      },

      emailBranding: {
        headerColor: { type: String, default: '#0284c7', required: true },
        headerLogoUrl: { type: String },
        headerAlignment: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
        footerText: { type: String, default: '© WeVentureHub. All rights reserved.', required: true },
        supportEmail: { type: String, default: 'support@weventurehub.com', required: true },
        socialFacebook: { type: String },
        socialTwitter: { type: String },
        socialLinkedIn: { type: String },
        socialInstagram: { type: String },
        buttonBgColor: { type: String, default: '#0284c7' },
        buttonTextColor: { type: String, default: '#ffffff' },
        bannerColor: { type: String, default: '#0f172a' }
      },
      loginBranding: {
        title: { type: String, default: 'WeVentureHub', required: true },
        subtitle: { type: String, default: 'Enterprise Event & Workspace Portal', required: true },
        backgroundImageUrl: { type: String },
      },
      pdfBranding: {
        invoiceHeaderLogoUrl: { type: String },
        invoicePrimaryColor: { type: String, default: '#0284c7' },
        invoiceNotes: { type: String, default: 'Thank you for your business. For any invoice queries, contact accounting.' },
        invoiceSignatureUrl: { type: String },
        bankTransferDetails: { type: String, default: 'Acme bank transfers' },
        certificateBorderColor: { type: String, default: '#0284c7' },
        certificateSignatureUrl: { type: String },
        certificateLogoUrl: { type: String },
        certificateTitle: { type: String, default: 'Certificate of Achievement' },
        certificateBackgroundPattern: { type: String, enum: ['none', 'classic', 'modern'], default: 'classic' },
        reportCoverLogoUrl: { type: String },
        reportHeaderColor: { type: String, default: '#0f172a' },
        reportFooterPageNumbering: { type: Boolean, default: true },
        reportConfidentialityLabel: { type: String, default: 'CONFIDENTIAL' }
      }
    },
    subscription: {
      plan: {
        type: String,
        enum: Object.values(SubscriptionPlan),
        default: SubscriptionPlan.FREE,
        required: true,
      },
      isTrial: { type: Boolean, default: true, required: true },
      expiresAt: { type: Date, required: true },
      limits: {
        maxWorkspaces: { type: Number, default: 5, required: true },
        maxEvents: { type: Number, default: 10, required: true },
        maxUsers: { type: Number, default: 10, required: true },
      },
      featureFlags: {
        type: Map,
        of: Boolean,
        default: {},
      },
    },
    website: {
      enabled: { type: Boolean, default: true },
      hero: {
        title: { type: String, default: 'Custom Tailored Workspace & Events Hub' },
        subtitle: { type: String, default: 'Establish, coordinate, and host premium workspace boards and interactive user experiences.' },
        backgroundImageUrl: { type: String, default: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200' },
        ctaText: { type: String, default: 'Explore Experiences' },
        ctaLink: { type: String, default: '#events' }
      },
      about: {
        title: { type: String, default: 'Our Narrative' },
        description: { type: String, default: 'We are committed to delivering outstanding workspace bookings and event management solutions tailored to ambitious operations.' },
        foundingYear: { type: Number, default: 2024 },
        highlights: { type: [String], default: ['Tailored boardrooms', 'High-speed fiber web', 'Active workshops', 'Professional hospitality'] }
      },
      team: {
        type: [
          {
            name: { type: String, required: true },
            role: { type: String, required: true },
            bio: { type: String },
            photoUrl: { type: String }
          }
        ],
        default: [
          {
            name: 'Sarah Jenkins',
            role: 'Managing Director & Curator',
            bio: 'Sarahas coordinated top-tier premium tech workspaces for over a decade.',
            photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400'
          },
          {
            name: 'Marcus Vance',
            role: 'Chief Hospitality Officer',
            bio: 'Marcus manages our workspace member services and on-site event execution.',
            photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400'
          }
        ]
      },
      gallery: {
        type: [
          {
            url: { type: String, required: true },
            caption: { type: String }
          }
        ],
        default: [
          {
            url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600',
            caption: 'Modern Boardroom Setup'
          },
          {
            url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=600',
            caption: 'Co-working Hot Desks'
          },
          {
            url: 'https://images.unsplash.com/photo-1517502884422-41eaaced0168?auto=format&fit=crop&q=80&w=600',
            caption: 'Interactive Seminar Area'
          }
        ]
      },
      testimonials: {
        type: [
          {
            name: { type: String, required: true },
            role: { type: String },
            text: { type: String, required: true },
            rating: { type: Number, default: 5 },
            avatarUrl: { type: String }
          }
        ],
        default: [
          {
            name: 'David K.',
            role: 'Founder, Apex Digital',
            text: 'This platform transformed how our remote team books and schedules space. Simply seamless.',
            rating: 5,
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
          },
          {
            name: 'Elena Rostova',
            role: 'Operations Director',
            text: 'We hosted our annual summit here. The white-labeled branding and ticket check-ins were flawlessly executed.',
            rating: 5,
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'
          }
        ]
      },
      seo: {
        metaTitle: { type: String, default: 'Custom Tailored Workspace & Event Platform' },
        metaDescription: { type: String, default: 'Schedule boardrooms and explore upcoming conferences with our high-end booking directory.' },
        metaKeywords: { type: [String], default: ['workspace', 'boardroom', 'meetups', 'tickets'] },
        ogImage: { type: String, default: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200' }
      },
      analytics: {
        googleAnalyticsId: { type: String, default: '' },
        pixelId: { type: String, default: '' },
        customScript: { type: String, default: '' }
      }
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Tenant = mongoose.model<ITenantDocument>('Tenant', TenantSchema);
