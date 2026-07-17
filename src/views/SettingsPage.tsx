import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Shield, 
  User, 
  Bell, 
  Save, 
  CheckCircle2, 
  Key, 
  Database,
  Mail,
  AppWindow,
  Volume2,
  Building2,
  Globe,
  Palette,
  CreditCard,
  CloudLightning,
  Loader2,
  Image,
  FileText,
  Sliders,
  Type,
  Play,
  Layout,
  Eye,
  Check,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Sparkles,
  Users,
  Trash2
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../store';
import { updateUserProfile } from '../store/authSlice';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { axiosInstance } from '../lib/axiosInstance';

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'organization'>('profile');
  const [firstName, setFirstName] = useState(user?.firstName || 'Alex');
  const [lastName, setLastName] = useState(user?.lastName || 'Chen');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Notification Preferences State (Persist to LocalStorage for offline sandbox fidelity)
  const [prefEmailBookings, setPrefEmailBookings] = useState(true);
  const [prefAppBookings, setPrefAppBookings] = useState(true);
  
  const [prefEmailEvents, setPrefEmailEvents] = useState(true);
  const [prefAppEvents, setPrefAppEvents] = useState(true);
  
  const [prefEmailPayments, setPrefEmailPayments] = useState(true);
  const [prefAppPayments, setPrefAppPayments] = useState(true);

  const [prefEmailAnnouncements, setPrefEmailAnnouncements] = useState(true);
  const [prefAppAnnouncements, setPrefAppAnnouncements] = useState(true);

  // Tenant / Organization custom configurations
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgDesc, setOrgDesc] = useState('');
  const [orgTimezone, setOrgTimezone] = useState('UTC');
  const [orgCurrency, setOrgCurrency] = useState('USD');
  const [orgLanguage, setOrgLanguage] = useState('en');
  
  // 1. Logo, Favicon & Background
  const [orgLogoUrl, setOrgLogoUrl] = useState('');
  const [orgDarkLogoUrl, setOrgDarkLogoUrl] = useState('');
  const [orgFaviconUrl, setOrgFaviconUrl] = useState('');
  const [orgLoginBackground, setOrgLoginBackground] = useState('');

  // 2. Main Themes & Colors
  const [orgPrimaryColor, setOrgPrimaryColor] = useState('#0284c7');
  const [orgSecondaryColor, setOrgSecondaryColor] = useState('#0f172a');
  const [orgAccentColor, setOrgAccentColor] = useState('#0ea5e9');
  const [orgThemeMode, setOrgThemeMode] = useState<'light' | 'dark' | 'custom' | 'auto'>('light');

  // Semantic Colors
  const [orgSuccessColor, setOrgSuccessColor] = useState('#10b981');
  const [orgWarningColor, setOrgWarningColor] = useState('#f59e0b');
  const [orgInfoColor, setOrgInfoColor] = useState('#3b82f6');
  const [orgDangerColor, setOrgDangerColor] = useState('#ef4444');

  // Light Theme Config
  const [orgLightBg, setOrgLightBg] = useState('#f8fafc');
  const [orgLightCardBg, setOrgLightCardBg] = useState('#ffffff');
  const [orgLightText, setOrgLightText] = useState('#0f172a');
  const [orgLightBorder, setOrgLightBorder] = useState('#e2e8f0');

  // Dark Theme Config
  const [orgDarkBg, setOrgDarkBg] = useState('#0f172a');
  const [orgDarkCardBg, setOrgDarkCardBg] = useState('#1e293b');
  const [orgDarkText, setOrgDarkText] = useState('#f8fafc');
  const [orgDarkBorder, setOrgDarkBorder] = useState('#334155');

  // 3. Dashboard layout & elements
  const [orgSidebarMode, setOrgSidebarMode] = useState<'light' | 'dark' | 'brand'>('light');
  const [orgBrandTitle, setOrgBrandTitle] = useState('');
  const [orgLogoHeight, setOrgLogoHeight] = useState(32);
  const [orgShowPoweredBy, setOrgShowPoweredBy] = useState(true);

  // Loading Screen Configuration
  const [orgLoadingText, setOrgLoadingText] = useState('Loading your experience...');
  const [orgSpinnerStyle, setOrgSpinnerStyle] = useState<'classic' | 'pulse' | 'bars'>('classic');
  const [orgFadeDuration, setOrgFadeDuration] = useState(300);

  // 4. Typography Scale & Borders
  const [orgFontFamily, setOrgFontFamily] = useState('Inter');
  const [orgFontSizeScale, setOrgFontSizeScale] = useState<'compact' | 'standard' | 'large'>('standard');
  const [orgBorderRadius, setOrgBorderRadius] = useState<'none' | 'sm' | 'md' | 'lg' | 'full'>('lg');

  // 5. Email Custom Branding
  const [orgSupportEmail, setOrgSupportEmail] = useState('');
  const [orgEmailHeaderLogo, setOrgEmailHeaderLogo] = useState('');
  const [orgEmailHeaderColor, setOrgEmailHeaderColor] = useState('#0284c7');
  const [orgEmailHeaderAlign, setOrgEmailHeaderAlign] = useState<'left' | 'center' | 'right'>('center');
  const [orgEmailFooterText, setOrgEmailFooterText] = useState('');
  const [orgEmailSocialFB, setOrgEmailSocialFB] = useState('');
  const [orgEmailSocialTW, setOrgEmailSocialTW] = useState('');
  const [orgEmailSocialLI, setOrgEmailSocialLI] = useState('');
  const [orgEmailSocialIG, setOrgEmailSocialIG] = useState('');
  const [orgEmailButtonBg, setOrgEmailButtonBg] = useState('#0284c7');
  const [orgEmailButtonText, setOrgEmailButtonText] = useState('#ffffff');
  const [orgEmailBanner, setOrgEmailBanner] = useState('#0f172a');

  // 6. PDF Branding Settings
  const [orgPdfInvoiceLogo, setOrgPdfInvoiceLogo] = useState('');
  const [orgPdfInvoicePrimary, setOrgPdfInvoicePrimary] = useState('#0284c7');
  const [orgPdfInvoiceNotes, setOrgPdfInvoiceNotes] = useState('');
  const [orgPdfInvoiceSig, setOrgPdfInvoiceSig] = useState('');
  const [orgPdfBankDetails, setOrgPdfBankDetails] = useState('');
  const [orgPdfCertBorder, setOrgPdfCertBorder] = useState('#0284c7');
  const [orgPdfCertSig, setOrgPdfCertSig] = useState('');
  const [orgPdfCertLogo, setOrgPdfCertLogo] = useState('');
  const [orgPdfCertTitle, setOrgPdfCertTitle] = useState('Certificate of Achievement');
  const [orgPdfCertPattern, setOrgPdfCertPattern] = useState<'none' | 'classic' | 'modern'>('classic');
  const [orgPdfReportLogo, setOrgPdfReportLogo] = useState('');
  const [orgPdfReportHeader, setOrgPdfReportHeader] = useState('#0f172a');
  const [orgPdfReportPageNum, setOrgPdfReportPageNum] = useState(true);
  const [orgPdfReportConfidential, setOrgPdfReportConfidential] = useState('CONFIDENTIAL');

  // Core Subcription Info
  const [orgLoginTitle, setOrgLoginTitle] = useState('');
  const [orgLoginSubtitle, setOrgLoginSubtitle] = useState('');
  const [orgPlan, setOrgPlan] = useState('FREE');
  const [orgLimits, setOrgLimits] = useState<any>(null);
  const [orgTrial, setOrgTrial] = useState(false);
  const [orgExpires, setOrgExpires] = useState('');

  // 9. Website Builder Settings
  const [websiteEnabled, setWebsiteEnabled] = useState(true);
  const [websiteHeroTitle, setWebsiteHeroTitle] = useState('');
  const [websiteHeroSubtitle, setWebsiteHeroSubtitle] = useState('');
  const [websiteHeroBgUrl, setWebsiteHeroBgUrl] = useState('');
  const [websiteHeroCtaText, setWebsiteHeroCtaText] = useState('');
  const [websiteHeroCtaLink, setWebsiteHeroCtaLink] = useState('');

  const [websiteAboutTitle, setWebsiteAboutTitle] = useState('');
  const [websiteAboutDesc, setWebsiteAboutDesc] = useState('');
  const [websiteAboutYear, setWebsiteAboutYear] = useState<number>(2024);
  const [websiteAboutHighlights, setWebsiteAboutHighlights] = useState<string>('');

  const [websiteTeamJSON, setWebsiteTeamJSON] = useState<string>('[]');
  const [websiteGalleryJSON, setWebsiteGalleryJSON] = useState<string>('[]');
  const [websiteTestimonialsJSON, setWebsiteTestimonialsJSON] = useState<string>('[]');

  const [websiteSeoTitle, setWebsiteSeoTitle] = useState('');
  const [websiteSeoDesc, setWebsiteSeoDesc] = useState('');
  const [websiteSeoKeywords, setWebsiteSeoKeywords] = useState('');
  const [websiteSeoOgImage, setWebsiteSeoOgImage] = useState('');

  const [websiteAnalyticsGaId, setWebsiteAnalyticsGaId] = useState('');
  const [websiteAnalyticsPixelId, setWebsiteAnalyticsPixelId] = useState('');
  const [websiteAnalyticsScript, setWebsiteAnalyticsScript] = useState('');

  // Local UX previews
  const [showLoadingPreview, setShowLoadingPreview] = useState(false);
  const [previewThemeMode, setPreviewThemeMode] = useState<'light' | 'dark'>('light');
  const [orgSubTab, setOrgSubTab] = useState<'profile' | 'branding' | 'themes' | 'typography' | 'email' | 'pdf' | 'preview' | 'team' | 'website'>('profile');

  // Team Invitations tab states
  const [teamInvitations, setTeamInvitations] = useState<any[]>([]);
  const [teamInvitesLoading, setTeamInvitesLoading] = useState(false);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [newInviteRole, setNewInviteRole] = useState('HUB_MEMBER');
  const [inviteError, setInviteError] = useState<string | null>(null);

  const fetchTeamInvitations = async () => {
    try {
      setTeamInvitesLoading(true);
      const res = await axiosInstance.get('/onboarding/invitations');
      setTeamInvitations(res.data.data || []);
    } catch (err: any) {
      console.error('Failed to load team invitations', err);
    } finally {
      setTeamInvitesLoading(false);
    }
  };

  useEffect(() => {
    if (orgSubTab === 'team' && activeTab === 'organization') {
      fetchTeamInvitations();
    }
  }, [orgSubTab, activeTab]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInviteEmail) return;
    setInviteError(null);
    try {
      await axiosInstance.post('/onboarding/invitations', {
        email: newInviteEmail,
        role: newInviteRole
      });
      setNewInviteEmail('');
      fetchTeamInvitations();
    } catch (err: any) {
      setInviteError(err.message || 'Failed to dispatch invitation');
    }
  };

  const handleRevokeInvite = async (id: string) => {
    try {
      await axiosInstance.delete(`/onboarding/invitations/${id}`);
      fetchTeamInvitations();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke invitation');
    }
  };

  // Fetch tenant details on selection
  const fetchTenantInfo = async () => {
    try {
      setOrgLoading(true);
      const tenantId = user?.tenantId || 'weventurehub';
      const res = await fetch(`/api/v1/organizations/${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('weventure_jwt_token')}`
        }
      });
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          const org = body.data;
          setOrgName(org.name);
          setOrgDesc(org.description || '');
          setOrgTimezone(org.settings.timezone);
          setOrgCurrency(org.settings.currency);
          setOrgLanguage(org.settings.language);
          
          // Logos & Favicons
          setOrgLogoUrl(org.branding.logoUrl || '');
          setOrgDarkLogoUrl(org.branding.darkLogoUrl || '');
          setOrgFaviconUrl(org.branding.faviconUrl || '');
          setOrgLoginBackground(org.branding.loginBranding.backgroundImageUrl || '');

          // Themes & Colors
          setOrgPrimaryColor(org.branding.primaryColor || '#0284c7');
          setOrgSecondaryColor(org.branding.secondaryColor || '#0f172a');
          setOrgAccentColor(org.branding.accentColor || '#0ea5e9');
          setOrgThemeMode(org.branding.themeMode || 'light');

          // Semantic Colors
          setOrgSuccessColor(org.branding.semanticColors?.success || '#10b981');
          setOrgWarningColor(org.branding.semanticColors?.warning || '#f59e0b');
          setOrgInfoColor(org.branding.semanticColors?.info || '#3b82f6');
          setOrgDangerColor(org.branding.semanticColors?.danger || '#ef4444');

          // Light Theme Details
          setOrgLightBg(org.branding.lightTheme?.background || '#f8fafc');
          setOrgLightCardBg(org.branding.lightTheme?.cardBackground || '#ffffff');
          setOrgLightText(org.branding.lightTheme?.text || '#0f172a');
          setOrgLightBorder(org.branding.lightTheme?.border || '#e2e8f0');

          // Dark Theme Details
          setOrgDarkBg(org.branding.darkTheme?.background || '#0f172a');
          setOrgDarkCardBg(org.branding.darkTheme?.cardBackground || '#1e293b');
          setOrgDarkText(org.branding.darkTheme?.text || '#f8fafc');
          setOrgDarkBorder(org.branding.darkTheme?.border || '#334155');

          // Dashboard customization
          setOrgSidebarMode(org.branding.dashboardBranding?.sidebarMode || 'light');
          setOrgBrandTitle(org.branding.dashboardBranding?.brandTitle || '');
          setOrgLogoHeight(org.branding.dashboardBranding?.logoHeight || 32);
          setOrgShowPoweredBy(org.branding.dashboardBranding?.showPoweredBy !== false);

          // Loading Customization
          setOrgLoadingText(org.branding.loadingScreen?.loadingText || 'Loading your experience...');
          setOrgSpinnerStyle(org.branding.loadingScreen?.spinnerStyle || 'classic');
          setOrgFadeDuration(org.branding.loadingScreen?.fadeDuration || 300);

          // Typography scale
          setOrgFontFamily(org.branding.typography?.fontFamily || 'Inter');
          setOrgFontSizeScale(org.branding.typography?.fontSizeScale || 'standard');
          setOrgBorderRadius(org.branding.typography?.borderRadius || 'lg');

          // Support & Email Template parameters
          setOrgSupportEmail(org.branding.emailBranding.supportEmail || 'support@weventurehub.com');
          setOrgEmailHeaderLogo(org.branding.emailBranding.headerLogoUrl || '');
          setOrgEmailHeaderColor(org.branding.emailBranding.headerColor || '#0284c7');
          setOrgEmailHeaderAlign(org.branding.emailBranding.headerAlignment || 'center');
          setOrgEmailFooterText(org.branding.emailBranding.footerText || `Sent with confidence by ${org.name}`);
          setOrgEmailSocialFB(org.branding.emailBranding.socialFacebook || '');
          setOrgEmailSocialTW(org.branding.emailBranding.socialTwitter || '');
          setOrgEmailSocialLI(org.branding.emailBranding.socialLinkedIn || '');
          setOrgEmailSocialIG(org.branding.emailBranding.socialInstagram || '');
          setOrgEmailButtonBg(org.branding.emailBranding.buttonBgColor || '#0284c7');
          setOrgEmailButtonText(org.branding.emailBranding.buttonTextColor || '#ffffff');
          setOrgEmailBanner(org.branding.emailBranding.bannerColor || '#0f172a');

          // Invoice, PDF reports, Certificates
          setOrgPdfInvoiceLogo(org.branding.pdfBranding?.invoiceHeaderLogoUrl || '');
          setOrgPdfInvoicePrimary(org.branding.pdfBranding?.invoicePrimaryColor || '#0284c7');
          setOrgPdfInvoiceNotes(org.branding.pdfBranding?.invoiceNotes || 'Thank you for your business. For any invoice queries, contact accounting.');
          setOrgPdfInvoiceSig(org.branding.pdfBranding?.invoiceSignatureUrl || '');
          setOrgPdfBankDetails(org.branding.pdfBranding?.bankTransferDetails || 'Acme bank transfers');
          setOrgPdfCertBorder(org.branding.pdfBranding?.certificateBorderColor || '#0284c7');
          setOrgPdfCertSig(org.branding.pdfBranding?.certificateSignatureUrl || '');
          setOrgPdfCertLogo(org.branding.pdfBranding?.certificateLogoUrl || '');
          setOrgPdfCertTitle(org.branding.pdfBranding?.certificateTitle || 'Certificate of Achievement');
          setOrgPdfCertPattern(org.branding.pdfBranding?.certificateBackgroundPattern || 'classic');
          setOrgPdfReportLogo(org.branding.pdfBranding?.reportCoverLogoUrl || '');
          setOrgPdfReportHeader(org.branding.pdfBranding?.reportHeaderColor || '#0f172a');
          setOrgPdfReportPageNum(org.branding.pdfBranding?.reportFooterPageNumbering !== false);
          setOrgPdfReportConfidential(org.branding.pdfBranding?.reportConfidentialityLabel || 'CONFIDENTIAL');

          setOrgLoginTitle(org.branding.loginBranding.title);
          setOrgLoginSubtitle(org.branding.loginBranding.subtitle);
          setOrgPlan(org.subscription.plan);
          setOrgLimits(org.subscription.limits);
          setOrgTrial(org.subscription.isTrial);
          setOrgExpires(org.subscription.expiresAt);

          const web = org.website || {};
          setWebsiteEnabled(web.enabled !== false);
          setWebsiteHeroTitle(web.hero?.title || 'Custom Tailored Workspace & Events Hub');
          setWebsiteHeroSubtitle(web.hero?.subtitle || 'Establish, coordinate, and host premium workspace boards and interactive user experiences.');
          setWebsiteHeroBgUrl(web.hero?.backgroundImageUrl || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200');
          setWebsiteHeroCtaText(web.hero?.ctaText || 'Explore Experiences');
          setWebsiteHeroCtaLink(web.hero?.ctaLink || '#events');

          setWebsiteAboutTitle(web.about?.title || 'Our Narrative');
          setWebsiteAboutDesc(web.about?.description || 'We are committed to delivering outstanding workspace bookings and event management solutions tailored to ambitious operations.');
          setWebsiteAboutYear(web.about?.foundingYear || 2024);
          setWebsiteAboutHighlights(web.about?.highlights?.join(', ') || 'Tailored boardrooms, High-speed fiber web, Active workshops, Professional hospitality');

          setWebsiteTeamJSON(JSON.stringify(web.team || [
            {
              name: 'Sarah Jenkins',
              role: 'Managing Director & Curator',
              bio: 'Sarah has coordinated top-tier premium tech workspaces for over a decade.',
              photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400'
            },
            {
              name: 'Marcus Vance',
              role: 'Chief Hospitality Officer',
              bio: 'Marcus manages our workspace member services and on-site event execution.',
              photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400'
            }
          ], null, 2));

          setWebsiteGalleryJSON(JSON.stringify(web.gallery || [
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
          ], null, 2));

          setWebsiteTestimonialsJSON(JSON.stringify(web.testimonials || [
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
          ], null, 2));

          setWebsiteSeoTitle(web.seo?.metaTitle || org.name);
          setWebsiteSeoDesc(web.seo?.metaDescription || org.description || '');
          setWebsiteSeoKeywords(web.seo?.metaKeywords?.join(', ') || 'workspace, events, booking');
          setWebsiteSeoOgImage(web.seo?.ogImage || org.branding?.logoUrl || '');

          setWebsiteAnalyticsGaId(web.analytics?.googleAnalyticsId || '');
          setWebsiteAnalyticsPixelId(web.analytics?.pixelId || '');
          setWebsiteAnalyticsScript(web.analytics?.customScript || '');
        }
      }
    } catch (err) {
      console.error('Failed to load tenant configurations', err);
    } finally {
      setOrgLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'organization') {
      fetchTenantInfo();
    }
  }, [activeTab]);

  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setOrgLoading(true);
      const tenantId = user?.tenantId || 'weventurehub';

      // 1. Update basic details
      let res = await fetch(`/api/v1/organizations/${tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('weventure_jwt_token')}`,
        },
        body: JSON.stringify({
          name: orgName,
          description: orgDesc,
        }),
      });
      if (!res.ok) throw new Error('Failed to update organization profile');

      // 2. Update settings
      res = await fetch(`/api/v1/organizations/${tenantId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('weventure_jwt_token')}`,
        },
        body: JSON.stringify({
          timezone: orgTimezone,
          currency: orgCurrency,
          language: orgLanguage,
        }),
      });
      if (!res.ok) throw new Error('Failed to update localization rules');

      // 3. Update branding presets with ALL 24 customization variables
      res = await fetch(`/api/v1/organizations/${tenantId}/branding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('weventure_jwt_token')}`,
        },
        body: JSON.stringify({
          primaryColor: orgPrimaryColor,
          secondaryColor: orgSecondaryColor,
          accentColor: orgAccentColor,
          logoUrl: orgLogoUrl,
          darkLogoUrl: orgDarkLogoUrl,
          faviconUrl: orgFaviconUrl,
          themeMode: orgThemeMode,
          
          semanticColors: {
            success: orgSuccessColor,
            warning: orgWarningColor,
            info: orgInfoColor,
            danger: orgDangerColor,
          },

          lightTheme: {
            background: orgLightBg,
            cardBackground: orgLightCardBg,
            text: orgLightText,
            border: orgLightBorder,
          },

          darkTheme: {
            background: orgDarkBg,
            cardBackground: orgDarkCardBg,
            text: orgDarkText,
            border: orgDarkBorder,
          },

          dashboardBranding: {
            sidebarMode: orgSidebarMode,
            brandTitle: orgBrandTitle,
            logoHeight: Number(orgLogoHeight),
            showPoweredBy: orgShowPoweredBy,
          },

          loadingScreen: {
            loadingText: orgLoadingText,
            spinnerStyle: orgSpinnerStyle,
            fadeDuration: Number(orgFadeDuration),
          },

          typography: {
            fontFamily: orgFontFamily,
            fontSizeScale: orgFontSizeScale,
            borderRadius: orgBorderRadius,
          },

          emailBranding: {
            supportEmail: orgSupportEmail,
            headerColor: orgEmailHeaderColor,
            headerLogoUrl: orgEmailHeaderLogo,
            headerAlignment: orgEmailHeaderAlign,
            footerText: orgEmailFooterText,
            socialFacebook: orgEmailSocialFB,
            socialTwitter: orgEmailSocialTW,
            socialLinkedIn: orgEmailSocialLI,
            socialInstagram: orgEmailSocialIG,
            buttonBgColor: orgEmailButtonBg,
            buttonTextColor: orgEmailButtonText,
            bannerColor: orgEmailBanner,
          },

          loginBranding: {
            title: orgLoginTitle,
            subtitle: orgLoginSubtitle,
            backgroundImageUrl: orgLoginBackground,
          },

          pdfBranding: {
            invoiceHeaderLogoUrl: orgPdfInvoiceLogo,
            invoicePrimaryColor: orgPdfInvoicePrimary,
            invoiceNotes: orgPdfInvoiceNotes,
            invoiceSignatureUrl: orgPdfInvoiceSig,
            bankTransferDetails: orgPdfBankDetails,
            certificateBorderColor: orgPdfCertBorder,
            certificateSignatureUrl: orgPdfCertSig,
            certificateLogoUrl: orgPdfCertLogo,
            certificateTitle: orgPdfCertTitle,
            certificateBackgroundPattern: orgPdfCertPattern,
            reportCoverLogoUrl: orgPdfReportLogo,
            reportHeaderColor: orgPdfReportHeader,
            reportFooterPageNumbering: orgPdfReportPageNum,
            reportConfidentialityLabel: orgPdfReportConfidential,
          }
        }),
      });
      if (!res.ok) throw new Error('Failed to save branding presets');

      // 4. Update website builder settings
      let parsedTeam = [];
      let parsedGallery = [];
      let parsedTestimonials = [];
      try {
        parsedTeam = JSON.parse(websiteTeamJSON);
      } catch (e) {
        throw new Error('Invalid JSON format in Team config. Please verify team structure.');
      }
      try {
        parsedGallery = JSON.parse(websiteGalleryJSON);
      } catch (e) {
        throw new Error('Invalid JSON format in Gallery config. Please verify gallery structure.');
      }
      try {
        parsedTestimonials = JSON.parse(websiteTestimonialsJSON);
      } catch (e) {
        throw new Error('Invalid JSON format in Testimonials config. Please verify testimonials structure.');
      }

      res = await fetch(`/api/v1/organizations/${tenantId}/website`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('weventure_jwt_token')}`,
        },
        body: JSON.stringify({
          enabled: websiteEnabled,
          hero: {
            title: websiteHeroTitle,
            subtitle: websiteHeroSubtitle,
            backgroundImageUrl: websiteHeroBgUrl,
            ctaText: websiteHeroCtaText,
            ctaLink: websiteHeroCtaLink,
          },
          about: {
            title: websiteAboutTitle,
            description: websiteAboutDesc,
            foundingYear: Number(websiteAboutYear),
            highlights: websiteAboutHighlights.split(',').map(s => s.trim()).filter(Boolean),
          },
          team: parsedTeam,
          gallery: parsedGallery,
          testimonials: parsedTestimonials,
          seo: {
            metaTitle: websiteSeoTitle,
            metaDescription: websiteSeoDesc,
            metaKeywords: websiteSeoKeywords.split(',').map(s => s.trim()).filter(Boolean),
            ogImage: websiteSeoOgImage,
          },
          analytics: {
            googleAnalyticsId: websiteAnalyticsGaId,
            pixelId: websiteAnalyticsPixelId,
            customScript: websiteAnalyticsScript,
          }
        }),
      });
      if (!res.ok) throw new Error('Failed to save public website configurations');

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      fetchTenantInfo();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setOrgLoading(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(updateUserProfile({ firstName, lastName }));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const activeBtnClass = "w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#84CC16] text-[#111111] shadow-sm transition-all hover:bg-[#A3E635]";
  const inactiveBtnClass = "w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827] transition text-left";

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display font-bold text-2xl text-[#111827]">Account Settings</h1>
        <p className="text-sm text-[#4B5563] mt-1">Manage corporate user identities, communications, and security protocols.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Settings Navigation sidebar */}
        <div className="space-y-1">
          <button 
            onClick={() => setActiveTab('profile')}
            className={activeTab === 'profile' ? activeBtnClass : inactiveBtnClass}
          >
            <User className="w-4 h-4" />
            <span>Profile Data</span>
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={activeTab === 'security' ? activeBtnClass : inactiveBtnClass}
          >
            <Shield className="w-4 h-4" />
            <span>Security & API Keys</span>
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={activeTab === 'notifications' ? activeBtnClass : inactiveBtnClass}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>
          
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'TENANT_ADMIN') && (
            <button 
              onClick={() => setActiveTab('organization')}
              className={activeTab === 'organization' ? activeBtnClass : inactiveBtnClass}
            >
              <Building2 className="w-4 h-4" />
              <span>My Organization</span>
            </button>
          )}
        </div>

        {/* Configurations Forms */}
        <div className="md:col-span-3 space-y-6">
          
          {savedSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center space-x-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Configurations saved successfully!</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-6">
              <div>
                <h3 className="font-display font-bold text-lg text-[#111827]">User Profile Credentials</h3>
                <p className="text-xs text-[#4B5563] mt-0.5">Primary information displayed across event rosters and booking logs.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="First Name" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                  />
                  <Input 
                    label="Last Name" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                  />
                </div>

                <Input 
                  label="Registered Corporate Email" 
                  value={user?.email || 'alex.chen@work.com'} 
                  disabled 
                  helperText="Email changes require security validation keys."
                />

                <div className="pt-4 border-t border-[#E5E7EB] flex justify-end">
                  <Button type="submit" className="flex items-center gap-1.5 text-xs font-bold px-4">
                    <Save className="w-4 h-4" />
                    <span>Save Profile</span>
                  </Button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-6">
              <div>
                <h3 className="font-display font-bold text-lg text-[#111827]">API Keys & Isolation Security</h3>
                <p className="text-xs text-[#4B5563] mt-0.5">Authorization secrets and server credentials used to separation tenant environments.</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="p-2.5 bg-[#F3F4F6] rounded-xl text-[#4B5563]">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-[#111827]">Tenant Identifier</span>
                      <span className="text-[10px] font-mono text-[#4B5563] uppercase font-bold">{user?.tenantId || 'weventurehub'}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 text-[8px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md tracking-wider">ACTIVE</span>
                </div>

                <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="p-2.5 bg-[#F3F4F6] rounded-xl text-[#4B5563]">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-[#111827]">Database Partition</span>
                      <span className="text-[10px] font-mono text-[#4B5563]">Cluster 0 | Isolated Sandbox Pool</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 text-[8px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md tracking-wider">SECURED</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-6">
              <div>
                <h3 className="font-display font-bold text-lg text-[#111827]">Notification Preferences</h3>
                <p className="text-xs text-[#4B5563] mt-0.5">Control where and how you receive alerts and event logs.</p>
              </div>

              <form onSubmit={handleSaveNotifications} className="space-y-6">
                <div className="divide-y divide-[#E5E7EB]">
                  
                  {/* Category: Bookings */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-[#111827]">Workspace Bookings</span>
                      <p className="text-[11px] text-[#4B5563] mt-0.5">Alerts when rooms/hotdesks are booked, approved, or cancelled.</p>
                    </div>
                    <div className="flex items-center space-x-4 shrink-0">
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={prefEmailBookings} 
                          onChange={(e) => setPrefEmailBookings(e.target.checked)} 
                          className="w-4 h-4 rounded text-[#65A30D] focus:ring-[#84CC16]" 
                        />
                        <Mail className="w-3.5 h-3.5 text-[#4B5563]" />
                        <span className="text-xs font-semibold text-[#111827]">Email</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={prefAppBookings} 
                          onChange={(e) => setPrefAppBookings(e.target.checked)} 
                          className="w-4 h-4 rounded text-[#65A30D] focus:ring-[#84CC16]" 
                        />
                        <AppWindow className="w-3.5 h-3.5 text-[#4B5563]" />
                        <span className="text-xs font-semibold text-[#111827]">In-App</span>
                      </label>
                    </div>
                  </div>

                  {/* Category: Events */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-[#111827]">Event Registrations</span>
                      <p className="text-[11px] text-[#4B5563] mt-0.5">Admission tickets, QR passes, event schedule changes.</p>
                    </div>
                    <div className="flex items-center space-x-4 shrink-0">
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={prefEmailEvents} 
                          onChange={(e) => setPrefEmailEvents(e.target.checked)} 
                          className="w-4 h-4 rounded text-[#65A30D] focus:ring-[#84CC16]" 
                        />
                        <Mail className="w-3.5 h-3.5 text-[#4B5563]" />
                        <span className="text-xs font-semibold text-[#111827]">Email</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={prefAppEvents} 
                          onChange={(e) => setPrefAppEvents(e.target.checked)} 
                          className="w-4 h-4 rounded text-[#65A30D] focus:ring-[#84CC16]" 
                        />
                        <AppWindow className="w-3.5 h-3.5 text-[#4B5563]" />
                        <span className="text-xs font-semibold text-[#111827]">In-App</span>
                      </label>
                    </div>
                  </div>

                  {/* Category: Payments */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-[#111827]">Invoices & Ledger Logs</span>
                      <p className="text-[11px] text-[#4B5563] mt-0.5">Billing receipts, monthly charges, retry warnings.</p>
                    </div>
                    <div className="flex items-center space-x-4 shrink-0">
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={prefEmailPayments} 
                          onChange={(e) => setPrefEmailPayments(e.target.checked)} 
                          className="w-4 h-4 rounded text-[#65A30D] focus:ring-[#84CC16]" 
                        />
                        <Mail className="w-3.5 h-3.5 text-[#4B5563]" />
                        <span className="text-xs font-semibold text-[#111827]">Email</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={prefAppPayments} 
                          onChange={(e) => setPrefAppPayments(e.target.checked)} 
                          className="w-4 h-4 rounded text-[#65A30D] focus:ring-[#84CC16]" 
                        />
                        <AppWindow className="w-3.5 h-3.5 text-[#4B5563]" />
                        <span className="text-xs font-semibold text-[#111827]">In-App</span>
                      </label>
                    </div>
                  </div>

                  {/* Category: Announcements */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-[#111827]">Community Announcements</span>
                      <p className="text-[11px] text-[#4B5563] mt-0.5">Global bulletins, operator news, platform announcements.</p>
                    </div>
                    <div className="flex items-center space-x-4 shrink-0">
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={prefEmailAnnouncements} 
                          onChange={(e) => setPrefEmailAnnouncements(e.target.checked)} 
                          className="w-4 h-4 rounded text-[#65A30D] focus:ring-[#84CC16]" 
                        />
                        <Mail className="w-3.5 h-3.5 text-[#4B5563]" />
                        <span className="text-xs font-semibold text-[#111827]">Email</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={prefAppAnnouncements} 
                          onChange={(e) => setPrefAppAnnouncements(e.target.checked)} 
                          className="w-4 h-4 rounded text-[#65A30D] focus:ring-[#84CC16]" 
                        />
                        <AppWindow className="w-3.5 h-3.5 text-[#4B5563]" />
                        <span className="text-xs font-semibold text-[#111827]">In-App</span>
                      </label>
                    </div>
                  </div>

                </div>

                <div className="pt-4 border-t border-[#E5E7EB] flex justify-end">
                  <Button type="submit" className="flex items-center gap-1.5 text-xs font-bold px-4">
                    <Save className="w-4 h-4" />
                    <span>Save Preferences</span>
                  </Button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'organization' && (
            <div className="space-y-6">
              {orgLoading ? (
                <div className="p-12 text-center text-xs text-[#4B5563] flex flex-col items-center justify-center space-y-2 bg-white border border-[#E5E7EB] p-6 rounded-2xl">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                  <span>Loading corporate tenant variables...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* White-Label Interactive Sub-navigation */}
                  <div className="flex flex-wrap gap-1.5 p-1 bg-[#F3F4F6] rounded-xl border border-[#E5E7EB]">
                    <button
                      type="button"
                      onClick={() => setOrgSubTab('profile')}
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        orgSubTab === 'profile'
                          ? 'bg-white text-[#65A30D] shadow-xs border border-[#E5E7EB]'
                          : 'text-neutral-slate-500 hover:text-neutral-slate-700 dark:hover:text-neutral-slate-300'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>1. Profile & locales</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrgSubTab('branding')}
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        orgSubTab === 'branding'
                          ? 'bg-white text-[#65A30D] shadow-xs border border-[#E5E7EB]'
                          : 'text-neutral-slate-500 hover:text-neutral-slate-700 dark:hover:text-neutral-slate-300'
                      }`}
                    >
                      <Image className="w-3.5 h-3.5" />
                      <span>2. Logos & Screen</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrgSubTab('themes')}
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        orgSubTab === 'themes'
                          ? 'bg-white text-[#65A30D] shadow-xs border border-[#E5E7EB]'
                          : 'text-neutral-slate-500 hover:text-neutral-slate-700 dark:hover:text-neutral-slate-300'
                      }`}
                    >
                      <Palette className="w-3.5 h-3.5" />
                      <span>3. Themes & Palettes</span>
                    </button>

                     <button
                      type="button"
                      onClick={() => setOrgSubTab('typography')}
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        orgSubTab === 'typography'
                          ? 'bg-white text-[#65A30D] shadow-xs border border-[#E5E7EB]'
                          : 'text-neutral-slate-500 hover:text-neutral-slate-700 dark:hover:text-neutral-slate-300'
                      }`}
                    >
                      <Type className="w-3.5 h-3.5" />
                      <span>4. Typography & Radii</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrgSubTab('email')}
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        orgSubTab === 'email'
                          ? 'bg-white text-[#65A30D] shadow-xs border border-[#E5E7EB]'
                          : 'text-neutral-slate-500 hover:text-neutral-slate-700 dark:hover:text-neutral-slate-300'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>5. Email Customizer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrgSubTab('pdf')}
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        orgSubTab === 'pdf'
                          ? 'bg-white text-[#65A30D] shadow-xs border border-[#E5E7EB]'
                          : 'text-neutral-slate-500 hover:text-neutral-slate-700 dark:hover:text-neutral-slate-300'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>6. PDF Documents</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrgSubTab('preview')}
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        orgSubTab === 'preview'
                          ? 'bg-white text-emerald-600 shadow-xs border border-[#E5E7EB]'
                          : 'text-neutral-slate-500 hover:text-neutral-slate-700 dark:hover:text-neutral-slate-300'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-500" />
                      <span>7. Live Visual Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrgSubTab('team')}
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        orgSubTab === 'team'
                          ? 'bg-white text-purple-600 shadow-xs border border-[#E5E7EB]'
                          : 'text-neutral-slate-500 hover:text-neutral-slate-700 dark:hover:text-neutral-slate-300'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 text-purple-500" />
                      <span>8. Team Invitations</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrgSubTab('website')}
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        orgSubTab === 'website'
                          ? 'bg-white text-indigo-600 shadow-xs border border-[#E5E7EB]'
                          : 'text-neutral-slate-500 hover:text-neutral-slate-700 dark:hover:text-neutral-slate-300'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5 text-indigo-500" />
                      <span>9. Public Website</span>
                    </button>
                  </div>

                  <form onSubmit={handleSaveOrganization} className="space-y-6 text-xs font-semibold">
                    
                    {/* TAB 1: Organization Profile & Localization */}
                    {orgSubTab === 'profile' && (
                      <div className="space-y-6">
                        <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-6">
                          <div>
                            <h3 className="font-display font-bold text-lg text-gray-900 flex items-center space-x-2">
                              <Building2 className="w-5 h-5 text-brand-primary" />
                              <span>Corporate Tenant Profile Settings</span>
                            </h3>
                            <p className="text-xs text-neutral-slate-400 mt-0.5">Control company identity details of your tenant workspace.</p>
                          </div>

                          <div className="space-y-4">
                            <Input 
                              label="Organization Name" 
                              value={orgName} 
                              onChange={(e) => setOrgName(e.target.value)} 
                              required
                            />

                            <div className="space-y-1">
                              <label className="text-xs text-neutral-slate-500">Corporate Mission Description</label>
                              <textarea
                                value={orgDesc}
                                onChange={(e) => setOrgDesc(e.target.value)}
                                placeholder="Brief description about company mission or workspace network..."
                                className="w-full h-20 p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:outline-hidden focus:ring-1 focus:ring-brand-primary text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-6">
                          <div>
                            <h3 className="font-display font-bold text-lg text-gray-900 flex items-center space-x-2">
                              <Globe className="w-5 h-5 text-brand-primary" />
                              <span>Localization & Regional Prefs</span>
                            </h3>
                            <p className="text-xs text-neutral-slate-400 mt-0.5">Define standard currency, timezones, and interface languages inside your workspace partition.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1">Standard Timezone</label>
                              <select
                                value={orgTimezone}
                                onChange={(e) => setOrgTimezone(e.target.value)}
                                className="w-full p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:outline-hidden text-xs"
                              >
                                <option value="UTC">UTC (Universal Coordinated)</option>
                                <option value="America/New_York">EST (New York)</option>
                                <option value="Europe/London">GMT (London)</option>
                                <option value="Europe/Paris">CET (Paris)</option>
                                <option value="Asia/Tokyo">JST (Tokyo)</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1">Accounting Currency</label>
                              <select
                                value={orgCurrency}
                                onChange={(e) => setOrgCurrency(e.target.value)}
                                className="w-full p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:outline-hidden text-xs"
                              >
                                <option value="USD">USD ($ - US Dollar)</option>
                                <option value="EUR">EUR (€ - Euro)</option>
                                <option value="GBP">GBP (£ - British Pound)</option>
                                <option value="JPY">JPY (¥ - Japanese Yen)</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1">Interface Language</label>
                              <select
                                value={orgLanguage}
                                onChange={(e) => setOrgLanguage(e.target.value)}
                                className="w-full p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:outline-hidden text-xs"
                              >
                                <option value="en">English (US)</option>
                                <option value="fr">French (FR)</option>
                                <option value="ja">Japanese (JP)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: Branding Logos & Loading Screen */}
                    {orgSubTab === 'branding' && (
                      <div className="space-y-6">
                        <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-6">
                          <div>
                            <h3 className="font-display font-bold text-lg text-gray-900 flex items-center space-x-2">
                              <Image className="w-5 h-5 text-brand-primary" />
                              <span>Corporate Logo Resources & Custom Backgrounds</span>
                            </h3>
                            <p className="text-xs text-neutral-slate-400 mt-0.5">Control asset assets served to users in light, dark, and background contexts.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input 
                              label="Corporate Logo URL (Light Mode)" 
                              value={orgLogoUrl} 
                              onChange={(e) => setOrgLogoUrl(e.target.value)} 
                              placeholder="https://example.com/assets/logo-light.png"
                            />
                            <Input 
                              label="Corporate Logo URL (Dark Mode)" 
                              value={orgDarkLogoUrl} 
                              onChange={(e) => setOrgDarkLogoUrl(e.target.value)} 
                              placeholder="https://example.com/assets/logo-dark.png"
                            />
                            <Input 
                              label="Tenant Favicon URL (.ico/.png)" 
                              value={orgFaviconUrl} 
                              onChange={(e) => setOrgFaviconUrl(e.target.value)} 
                              placeholder="https://example.com/favicon.ico"
                            />
                            <Input 
                              label="Login Screen Background Image URL" 
                              value={orgLoginBackground} 
                              onChange={(e) => setOrgLoginBackground(e.target.value)} 
                              placeholder="https://images.unsplash.com/photo-1497366216548-37526070297c"
                            />
                          </div>
                        </div>

                        <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-6">
                          <div>
                            <h3 className="font-display font-bold text-lg text-gray-900 flex items-center space-x-2">
                              <Sliders className="w-5 h-5 text-brand-primary" />
                              <span>Dashboard Branding & Navigation</span>
                            </h3>
                            <p className="text-xs text-neutral-slate-400 mt-0.5">Configure live panel layouts, branding titles, heights, and credits.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1">Sidebar Color Mode</label>
                              <select
                                value={orgSidebarMode}
                                onChange={(e) => setOrgSidebarMode(e.target.value as any)}
                                className="w-full p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:outline-hidden text-xs"
                              >
                                <option value="light">Light Mode Minimal</option>
                                <option value="dark">Dark Theme Sleek</option>
                                <option value="brand">Primary Brand Theme</option>
                              </select>
                            </div>

                            <div className="md:col-span-2">
                              <Input 
                                label="Custom Brand Title" 
                                value={orgBrandTitle} 
                                onChange={(e) => setOrgBrandTitle(e.target.value)} 
                                placeholder="e.g. Acme DevHub (uses company name if blank)"
                              />
                            </div>

                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1.5">Brand Logo Height ({orgLogoHeight}px)</label>
                              <input 
                                type="range" 
                                min="16" 
                                max="64" 
                                value={orgLogoHeight} 
                                onChange={(e) => setOrgLogoHeight(Number(e.target.value))}
                                className="w-full accent-brand-primary h-2 bg-neutral-slate-100 rounded-lg cursor-pointer"
                              />
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 bg-[#F9FAFB]/40 p-3.5 border border-gray-200 rounded-xl">
                            <input 
                              type="checkbox" 
                              id="orgShowPoweredBy"
                              checked={orgShowPoweredBy} 
                              onChange={(e) => setOrgShowPoweredBy(e.target.checked)} 
                              className="w-4 h-4 rounded text-brand-primary" 
                            />
                            <label htmlFor="orgShowPoweredBy" className="text-xs text-gray-700 font-bold cursor-pointer">
                              Display "Powered by Event&Workspace SaaS" white-label watermark credits in footer
                            </label>
                          </div>
                        </div>

                        <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-6">
                          <div>
                            <h3 className="font-display font-bold text-lg text-gray-900 flex items-center space-x-2">
                              <Sliders className="w-5 h-5 text-brand-primary" />
                              <span>Custom SaaS Loading Screen Customizer</span>
                            </h3>
                            <p className="text-xs text-neutral-slate-400 mt-0.5">Define loader message, dynamic spinner geometries, and screen transitions.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input 
                              label="SaaS Loader Text" 
                              value={orgLoadingText} 
                              onChange={(e) => setOrgLoadingText(e.target.value)} 
                              placeholder="Loading WeVentureHub..."
                            />
                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1">Spinner Indicator Style</label>
                              <select
                                value={orgSpinnerStyle}
                                onChange={(e) => setOrgSpinnerStyle(e.target.value as any)}
                                className="w-full p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:outline-hidden text-xs"
                              >
                                <option value="classic">Classic Spinning Circle</option>
                                <option value="pulse">Glowing Pulse Wave</option>
                                <option value="bars">Bouncing Wave Bars</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1.5">Fade Transition Duration ({orgFadeDuration}ms)</label>
                              <input 
                                type="range" 
                                min="100" 
                                max="2000" 
                                step="50"
                                value={orgFadeDuration} 
                                onChange={(e) => setOrgFadeDuration(Number(e.target.value))}
                                className="w-full accent-brand-primary h-2 bg-neutral-slate-100 rounded-lg cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 3: Themes & Palettes */}
                    {orgSubTab === 'themes' && (
                      <div className="space-y-6">
                        <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-6">
                          <div>
                            <h3 className="font-display font-bold text-lg text-gray-900 flex items-center space-x-2">
                              <Palette className="w-5 h-5 text-brand-primary" />
                              <span>Enterprise Identity Color Palette</span>
                            </h3>
                            <p className="text-xs text-neutral-slate-400 mt-0.5">Control brand accents, secondary base colors, and theme modes.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1">Theme Delivery Mode</label>
                              <select
                                value={orgThemeMode}
                                onChange={(e) => setOrgThemeMode(e.target.value as any)}
                                className="w-full p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:outline-hidden text-xs"
                              >
                                <option value="light">Enforced Light Theme Only</option>
                                <option value="dark">Enforced Dark Theme Only</option>
                                <option value="auto">System Match Auto Preference</option>
                                <option value="custom">Fully Custom Accent Layout</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1">Primary Color Accent</label>
                              <div className="flex items-center space-x-2 bg-[#F9FAFB] p-1.5 border-[#E5E7EB] rounded-xl">
                                <input
                                  type="color"
                                  value={orgPrimaryColor}
                                  onChange={(e) => setOrgPrimaryColor(e.target.value)}
                                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 shrink-0"
                                />
                                <span className="font-mono text-xs">{orgPrimaryColor}</span>
                              </div>
                            </div>

                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1">Secondary Brand Slate</label>
                              <div className="flex items-center space-x-2 bg-[#F9FAFB] p-1.5 border-[#E5E7EB] rounded-xl">
                                <input
                                  type="color"
                                  value={orgSecondaryColor}
                                  onChange={(e) => setOrgSecondaryColor(e.target.value)}
                                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 shrink-0"
                                />
                                <span className="font-mono text-xs">{orgSecondaryColor}</span>
                              </div>
                            </div>

                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1">Vibrant Accent Highlight</label>
                              <div className="flex items-center space-x-2 bg-[#F9FAFB] p-1.5 border-[#E5E7EB] rounded-xl">
                                <input
                                  type="color"
                                  value={orgAccentColor}
                                  onChange={(e) => setOrgAccentColor(e.target.value)}
                                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 shrink-0"
                                />
                                <span className="font-mono text-xs">{orgAccentColor}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Semantic Colors */}
                        <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-6">
                          <div>
                            <h3 className="font-display font-bold text-lg text-gray-900 flex items-center space-x-2">
                              <Sparkles className="w-5 h-5 text-brand-primary" />
                              <span>Semantic & Status Color System</span>
                            </h3>
                            <p className="text-xs text-neutral-slate-400 mt-0.5">Override colors used for alerts, bookings, error triggers, and event status codes.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1">Success Accent (Green)</label>
                              <div className="flex items-center space-x-2 bg-[#F9FAFB] p-1.5 border-[#E5E7EB] rounded-xl">
                                <input
                                  type="color"
                                  value={orgSuccessColor}
                                  onChange={(e) => setOrgSuccessColor(e.target.value)}
                                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 shrink-0"
                                />
                                <span className="font-mono text-xs">{orgSuccessColor}</span>
                              </div>
                            </div>

                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1">Warning Accent (Amber)</label>
                              <div className="flex items-center space-x-2 bg-[#F9FAFB] p-1.5 border-[#E5E7EB] rounded-xl">
                                <input
                                  type="color"
                                  value={orgWarningColor}
                                  onChange={(e) => setOrgWarningColor(e.target.value)}
                                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 shrink-0"
                                />
                                <span className="font-mono text-xs">{orgWarningColor}</span>
                              </div>
                            </div>

                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1">Information Accent (Blue)</label>
                              <div className="flex items-center space-x-2 bg-[#F9FAFB] p-1.5 border-[#E5E7EB] rounded-xl">
                                <input
                                  type="color"
                                  value={orgInfoColor}
                                  onChange={(e) => setOrgInfoColor(e.target.value)}
                                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 shrink-0"
                                />
                                <span className="font-mono text-xs">{orgInfoColor}</span>
                              </div>
                            </div>

                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1">Danger Accent (Red)</label>
                              <div className="flex items-center space-x-2 bg-[#F9FAFB] p-1.5 border-[#E5E7EB] rounded-xl">
                                <input
                                  type="color"
                                  value={orgDangerColor}
                                  onChange={(e) => setOrgDangerColor(e.target.value)}
                                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 shrink-0"
                                />
                                <span className="font-mono text-xs">{orgDangerColor}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Theme Detailed Elements */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Light Theme Overrides */}
                          <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-6">
                            <h4 className="font-display font-bold text-sm text-gray-800 flex items-center space-x-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                              <span>Light Mode Canvas Overrides</span>
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] text-neutral-slate-400 block mb-1">Canvas Background</label>
                                <input type="color" value={orgLightBg} onChange={(e) => setOrgLightBg(e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border-0 p-0" />
                              </div>
                              <div>
                                <label className="text-[10px] text-neutral-slate-400 block mb-1">Card Container background</label>
                                <input type="color" value={orgLightCardBg} onChange={(e) => setOrgLightCardBg(e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border-0 p-0" />
                              </div>
                              <div>
                                <label className="text-[10px] text-neutral-slate-400 block mb-1">Primary Body Text</label>
                                <input type="color" value={orgLightText} onChange={(e) => setOrgLightText(e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border-0 p-0" />
                              </div>
                              <div>
                                <label className="text-[10px] text-neutral-slate-400 block mb-1">Divider Borders</label>
                                <input type="color" value={orgLightBorder} onChange={(e) => setOrgLightBorder(e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border-0 p-0" />
                              </div>
                            </div>
                          </div>

                          {/* Dark Theme Overrides */}
                          <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-6">
                            <h4 className="font-display font-bold text-sm text-gray-800 flex items-center space-x-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                              <span>Dark Mode Canvas Overrides</span>
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] text-neutral-slate-400 block mb-1">Canvas Background</label>
                                <input type="color" value={orgDarkBg} onChange={(e) => setOrgDarkBg(e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border-0 p-0" />
                              </div>
                              <div>
                                <label className="text-[10px] text-neutral-slate-400 block mb-1">Card Container background</label>
                                <input type="color" value={orgDarkCardBg} onChange={(e) => setOrgDarkCardBg(e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border-0 p-0" />
                              </div>
                              <div>
                                <label className="text-[10px] text-neutral-slate-400 block mb-1">Primary Body Text</label>
                                <input type="color" value={orgDarkText} onChange={(e) => setOrgDarkText(e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border-0 p-0" />
                              </div>
                              <div>
                                <label className="text-[10px] text-neutral-slate-400 block mb-1">Divider Borders</label>
                                <input type="color" value={orgDarkBorder} onChange={(e) => setOrgDarkBorder(e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border-0 p-0" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 4: Typography scale & borders */}
                    {orgSubTab === 'typography' && (
                      <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-6">
                        <div>
                          <h3 className="font-display font-bold text-lg text-gray-900 flex items-center space-x-2">
                            <Type className="w-5 h-5 text-brand-primary" />
                            <span>Corporate Typography & Corner Radii Scale</span>
                          </h3>
                          <p className="text-xs text-neutral-slate-400 mt-0.5">Control font family pairs, visual sizing factors, and structural border roundings.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="text-xs text-neutral-slate-500 block mb-1">Primary Font Family</label>
                            <select
                              value={orgFontFamily}
                              onChange={(e) => setOrgFontFamily(e.target.value)}
                              className="w-full p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:outline-hidden text-xs"
                            >
                              <option value="Inter">Inter (Swiss Modern Sans)</option>
                              <option value="Space Grotesk">Space Grotesk (Tech Geometric)</option>
                              <option value="Outfit">Outfit (Clean Executive)</option>
                              <option value="Poppins">Poppins (Friendly Rounded)</option>
                              <option value="JetBrains Mono">JetBrains Mono (Technical Console)</option>
                              <option value="Playfair Display">Playfair Display (Serif Literary)</option>
                            </select>
                            <p className="text-[10px] text-neutral-slate-400 mt-1.5">Applies across dashboards, headings, charts, and system reports.</p>
                          </div>

                          <div>
                            <label className="text-xs text-neutral-slate-500 block mb-1">Base Font Size Factor</label>
                            <select
                              value={orgFontSizeScale}
                              onChange={(e) => setOrgFontSizeScale(e.target.value as any)}
                              className="w-full p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:outline-hidden text-xs"
                            >
                              <option value="compact">Compact (Optimized dense spacing)</option>
                              <option value="standard">Standard (Balanced SaaS baseline)</option>
                              <option value="large">Large (Spacious editorial comfort)</option>
                            </select>
                            <p className="text-[10px] text-neutral-slate-400 mt-1.5">Increases or decreases base size dimensions across active workspace panels.</p>
                          </div>

                          <div>
                            <label className="text-xs text-neutral-slate-500 block mb-1">Container Border Radius (Corner rounding)</label>
                            <select
                              value={orgBorderRadius}
                              onChange={(e) => setOrgBorderRadius(e.target.value as any)}
                              className="w-full p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:outline-hidden text-xs"
                            >
                              <option value="none">Sharp Corners (0px - Brutalist flat)</option>
                              <option value="sm">Subtle Rounded (4px - Classic micro)</option>
                              <option value="md">Medium Rounded (8px - Clean structural)</option>
                              <option value="lg">Large Bento Rounding (16px - High-end soft)</option>
                              <option value="full">Hyper rounded (pill shapes)</option>
                            </select>
                            <p className="text-[10px] text-neutral-slate-400 mt-1.5">Sets standard card rounding parameters, input fields, and UI buttons.</p>
                          </div>
                        </div>

                        {/* Real-time typography mock preview */}
                        <div className="p-5 border border-dashed border-gray-200 rounded-2xl bg-[#F9FAFB]">
                          <span className="text-[9px] uppercase tracking-wider text-neutral-slate-400 font-black block mb-3">Instant Typography Specimen</span>
                          <div style={{ fontFamily: orgFontFamily === 'Playfair Display' ? 'Playfair Display, serif' : orgFontFamily === 'JetBrains Mono' ? 'JetBrains Mono, monospace' : 'inherit' }} className="space-y-2">
                            <h5 className="font-bold text-lg text-gray-900 tracking-tight">
                              The quick brown fox jumps over the lazy dog
                            </h5>
                            <p className="text-xs text-neutral-slate-500 leading-relaxed max-w-xl">
                              White-label variables allow this SaaS tenant hub to render fully compliant client experiences instantly. This specimen simulates font-family pairs and leading margins within your currently active Event Workspace cluster.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 5: Email Custom branding */}
                    {orgSubTab === 'email' && (
                      <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-6">
                        <div>
                          <h3 className="font-display font-bold text-lg text-gray-900 flex items-center space-x-2">
                            <Mail className="w-5 h-5 text-brand-primary" />
                            <span>Tenant Custom Transactional Email Customizer</span>
                          </h3>
                          <p className="text-xs text-neutral-slate-400 mt-0.5">Control HTML headers, copyright statements, color themes, and social links for client emails.</p>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input 
                              label="Email Header Custom Logo URL" 
                              value={orgEmailHeaderLogo} 
                              onChange={(e) => setOrgEmailHeaderLogo(e.target.value)} 
                              placeholder="https://example.com/assets/email-header.png"
                            />
                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1">Email Brand Banner Color</label>
                              <div className="flex items-center space-x-2 bg-[#F9FAFB] p-1.5 border-[#E5E7EB] rounded-xl">
                                <input
                                  type="color"
                                  value={orgEmailHeaderColor}
                                  onChange={(e) => setOrgEmailHeaderColor(e.target.value)}
                                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 shrink-0"
                                />
                                <span className="font-mono text-xs">{orgEmailHeaderColor}</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1">Logo Alignment</label>
                              <select
                                value={orgEmailHeaderAlign}
                                onChange={(e) => setOrgEmailHeaderAlign(e.target.value as any)}
                                className="w-full p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:outline-hidden text-xs"
                              >
                                <option value="left">Left Aligned</option>
                                <option value="center">Centered Header</option>
                                <option value="right">Right Aligned</option>
                              </select>
                            </div>

                            <div className="md:col-span-2">
                              <Input 
                                label="Custom Footer Copyright Notice" 
                                value={orgEmailFooterText} 
                                onChange={(e) => setOrgEmailFooterText(e.target.value)} 
                                placeholder="© Acme Corp. Sent from secure partition. Legal terms apply."
                              />
                            </div>
                          </div>

                          {/* Email Social Media Channels */}
                          <div className="border-t border-gray-200/80 pt-4 space-y-4">
                            <h4 className="font-bold text-xs text-gray-700">Social Account Footer Handles</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="flex items-center space-x-2">
                                <Facebook className="w-4 h-4 text-neutral-slate-400 shrink-0" />
                                <input type="text" value={orgEmailSocialFB} onChange={(e) => setOrgEmailSocialFB(e.target.value)} placeholder="https://facebook.com/acme" className="w-full p-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs" />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Twitter className="w-4 h-4 text-neutral-slate-400 shrink-0" />
                                <input type="text" value={orgEmailSocialTW} onChange={(e) => setOrgEmailSocialTW(e.target.value)} placeholder="https://twitter.com/acme" className="w-full p-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs" />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Linkedin className="w-4 h-4 text-neutral-slate-400 shrink-0" />
                                <input type="text" value={orgEmailSocialLI} onChange={(e) => setOrgEmailSocialLI(e.target.value)} placeholder="https://linkedin.com/company/acme" className="w-full p-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs" />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Instagram className="w-4 h-4 text-neutral-slate-400 shrink-0" />
                                <input type="text" value={orgEmailSocialIG} onChange={(e) => setOrgEmailSocialIG(e.target.value)} placeholder="https://instagram.com/acme" className="w-full p-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs" />
                              </div>
                            </div>
                          </div>

                          {/* Email Theme Accents */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-200/80 pt-4">
                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1">Primary Email Button Background</label>
                              <div className="flex items-center space-x-2 bg-[#F9FAFB] p-1.5 border-[#E5E7EB] rounded-xl">
                                <input type="color" value={orgEmailButtonBg} onChange={(e) => setOrgEmailButtonBg(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 shrink-0" />
                                <span className="font-mono text-xs">{orgEmailButtonBg}</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1">Email Button Label Text</label>
                              <div className="flex items-center space-x-2 bg-[#F9FAFB] p-1.5 border-[#E5E7EB] rounded-xl">
                                <input type="color" value={orgEmailButtonText} onChange={(e) => setOrgEmailButtonText(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 shrink-0" />
                                <span className="font-mono text-xs">{orgEmailButtonText}</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1">Footer Accent Strip Banner</label>
                              <div className="flex items-center space-x-2 bg-[#F9FAFB] p-1.5 border-[#E5E7EB] rounded-xl">
                                <input type="color" value={orgEmailBanner} onChange={(e) => setOrgEmailBanner(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 shrink-0" />
                                <span className="font-mono text-xs">{orgEmailBanner}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 6: Document (PDF) Branding */}
                    {orgSubTab === 'pdf' && (
                      <div className="space-y-6">
                        {/* Section A: Invoices */}
                        <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-6">
                          <h4 className="font-display font-bold text-sm text-gray-900 flex items-center space-x-2 border-b border-gray-200/60 pb-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
                            <span>SaaS PDF Invoice Branding Settings</span>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input 
                              label="Invoice Header Logo URL" 
                              value={orgPdfInvoiceLogo} 
                              onChange={(e) => setOrgPdfInvoiceLogo(e.target.value)} 
                              placeholder="https://example.com/assets/invoice-header.png"
                            />
                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1">Invoice Theme Color</label>
                              <div className="flex items-center space-x-2 bg-[#F9FAFB] p-1.5 border-[#E5E7EB] rounded-xl">
                                <input type="color" value={orgPdfInvoicePrimary} onChange={(e) => setOrgPdfInvoicePrimary(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 shrink-0" />
                                <span className="font-mono text-xs">{orgPdfInvoicePrimary}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-neutral-slate-500">Invoice Terms & Notes</label>
                              <textarea
                                value={orgPdfInvoiceNotes}
                                onChange={(e) => setOrgPdfInvoiceNotes(e.target.value)}
                                className="w-full h-16 p-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs"
                                placeholder="Payment terms, late fee schedules, etc..."
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-neutral-slate-500">Corporate Bank Transfer Details</label>
                              <textarea
                                value={orgPdfBankDetails}
                                onChange={(e) => setOrgPdfBankDetails(e.target.value)}
                                className="w-full h-16 p-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs"
                                placeholder="IBAN, Swift Codes, routing numbers..."
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Input 
                                label="Accounting Controller Signature Image URL" 
                                value={orgPdfInvoiceSig} 
                                onChange={(e) => setOrgPdfInvoiceSig(e.target.value)} 
                                placeholder="https://example.com/assets/signature.png"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Section B: Certificates */}
                        <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-6">
                          <h4 className="font-display font-bold text-sm text-gray-900 flex items-center space-x-2 border-b border-gray-200/60 pb-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span>Event Achievement Certificate customizer</span>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input 
                              label="Certificate Custom Header title" 
                              value={orgPdfCertTitle} 
                              onChange={(e) => setOrgPdfCertTitle(e.target.value)} 
                              placeholder="e.g. Certificate of Graduation"
                            />
                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1">Border Accent Color</label>
                              <div className="flex items-center space-x-2 bg-[#F9FAFB] p-1.5 border-[#E5E7EB] rounded-xl">
                                <input type="color" value={orgPdfCertBorder} onChange={(e) => setOrgPdfCertBorder(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 shrink-0" />
                                <span className="font-mono text-xs">{orgPdfCertBorder}</span>
                              </div>
                            </div>
                            <Input 
                              label="Certificate Brand Logo URL" 
                              value={orgPdfCertLogo} 
                              onChange={(e) => setOrgPdfCertLogo(e.target.value)} 
                              placeholder="https://example.com/assets/cert-logo.png"
                            />
                            <Input 
                              label="Authorized Seal/Signature URL" 
                              value={orgPdfCertSig} 
                              onChange={(e) => setOrgPdfCertSig(e.target.value)} 
                              placeholder="https://example.com/assets/authorized-signature.png"
                            />
                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1">Background Pattern style</label>
                              <select
                                value={orgPdfCertPattern}
                                onChange={(e) => setOrgPdfCertPattern(e.target.value as any)}
                                className="w-full p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:outline-hidden text-xs"
                              >
                                <option value="none">Flat Minimal Ivory background</option>
                                <option value="classic">Classic Victorian border lines</option>
                                <option value="modern">Modern Geometric mesh lines</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Section C: Reports */}
                        <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-6">
                          <h4 className="font-display font-bold text-sm text-gray-900 flex items-center space-x-2 border-b border-gray-200/60 pb-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <span>Executive Report & Analytics PDFs</span>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input 
                              label="Report Front Cover Logo URL" 
                              value={orgPdfReportLogo} 
                              onChange={(e) => setOrgPdfReportLogo(e.target.value)} 
                              placeholder="https://example.com/assets/report-cover.png"
                            />
                            <div>
                              <label className="text-xs text-neutral-slate-500 block mb-1">Report Header Base Color</label>
                              <div className="flex items-center space-x-2 bg-[#F9FAFB] p-1.5 border-[#E5E7EB] rounded-xl">
                                <input type="color" value={orgPdfReportHeader} onChange={(e) => setOrgPdfReportHeader(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 shrink-0" />
                                <span className="font-mono text-xs">{orgPdfReportHeader}</span>
                              </div>
                            </div>
                            <Input 
                              label="Confidentiality Status Label" 
                              value={orgPdfReportConfidential} 
                              onChange={(e) => setOrgPdfReportConfidential(e.target.value)} 
                              placeholder="e.g. STRICTLY PRIVATE & PROPRIETARY"
                            />
                            <div className="flex items-center space-x-3 bg-[#F9FAFB]/40 p-3.5 border border-gray-200 rounded-xl">
                              <input 
                                type="checkbox" 
                                id="orgPdfReportPageNum"
                                checked={orgPdfReportPageNum} 
                                onChange={(e) => setOrgPdfReportPageNum(e.target.checked)} 
                                className="w-4 h-4 rounded text-brand-primary" 
                              />
                              <label htmlFor="orgPdfReportPageNum" className="text-xs text-gray-700 font-bold cursor-pointer">
                                Enforce legal dynamic footer page-numbering sequences
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 7: Live Real-Time Previews */}
                    {orgSubTab === 'preview' && (
                      <div className="space-y-6 relative">
                        
                        {/* Loading screen preview container relative */}
                        {showLoadingPreview && (
                          <div className="p-12 bg-white border border-gray-200 rounded-2xl shadow-sm text-neutral-slate-900 flex flex-col items-center justify-center space-y-4 relative min-h-[220px] transition-all">
                            <button
                              type="button"
                              onClick={() => setShowLoadingPreview(false)}
                              className="absolute top-4 right-4 bg-neutral-slate-100 hover:bg-neutral-slate-200 border border-neutral-slate-200 px-2.5 py-1 text-[10px] font-bold rounded-lg text-neutral-slate-700"
                            >
                              Dismiss Loading Simulation
                            </button>
                            
                            {orgSpinnerStyle === 'classic' && (
                              <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                            )}
                            
                            {orgSpinnerStyle === 'pulse' && (
                              <div className="w-8 h-8 rounded-full bg-brand-primary animate-ping" />
                            )}

                            {orgSpinnerStyle === 'bars' && (
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-6 bg-brand-primary rounded animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-2 h-6 bg-brand-primary rounded animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-2 h-6 bg-brand-primary rounded animate-bounce" />
                              </div>
                            )}

                            <span className="text-sm font-semibold tracking-wide animate-pulse" style={{ fontFamily: orgFontFamily }}>
                              {orgLoadingText}
                            </span>
                            <span className="text-[10px] text-neutral-slate-500 font-mono">Simulating transition duration: {orgFadeDuration}ms</span>
                          </div>
                        )}

                        <div className="bg-[#F9FAFB] p-4 rounded-2xl border border-neutral-200 border-gray-200 space-y-4">
                          <div className="flex items-center justify-between border-b border-neutral-200 border-gray-200 pb-3">
                            <div>
                              <h4 className="font-display font-bold text-sm text-neutral-900 dark:text-white">Active Simulation Controllers</h4>
                              <p className="text-[10px] text-neutral-slate-400 mt-0.5">Interact with branding rules using visual toggles.</p>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => setShowLoadingPreview(true)}
                                className="flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-extrabold rounded-lg"
                              >
                                <Play className="w-3.5 h-3.5 text-brand-primary" />
                                <span>Simulate Loading</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setPreviewThemeMode(prev => prev === 'light' ? 'dark' : 'light')}
                                className="flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white text-[11px] font-extrabold rounded-lg"
                              >
                                <Palette className="w-3.5 h-3.5" />
                                <span>Preview: {previewThemeMode.toUpperCase()} Theme</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* PREVIEW A: Dynamic Mock Login */}
                            <div className="border border-neutral-200 border-gray-200 rounded-xl overflow-hidden shadow-xs flex flex-col justify-between min-h-[300px] relative">
                              <span className="absolute top-2 left-2 bg-neutral-900/80 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase z-10">MOCK LOGIN PREVIEW</span>
                              
                              <div 
                                className="absolute inset-0 bg-cover bg-center" 
                                style={{ 
                                  backgroundImage: orgLoginBackground ? `url(${orgLoginBackground})` : 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)',
                                  filter: 'brightness(0.4)'
                                }}
                              />

                              <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 text-center">
                                <div className="bg-white/95 p-5 rounded-2xl shadow-xl w-full max-w-[240px] space-y-3" style={{ borderRadius: orgBorderRadius === 'none' ? '0px' : orgBorderRadius === 'sm' ? '4px' : orgBorderRadius === 'md' ? '8px' : orgBorderRadius === 'lg' ? '12px' : '9999px' }}>
                                  
                                  {orgLogoUrl && (
                                    <img src={orgLogoUrl} alt="Logo" className="mx-auto" style={{ height: `${Math.min(orgLogoHeight, 28)}px` }} referrerPolicy="no-referrer" />
                                  )}

                                  <div>
                                    <h5 className="font-bold text-xs text-gray-900 leading-tight" style={{ fontFamily: orgFontFamily }}>
                                      {orgLoginTitle || orgName}
                                    </h5>
                                    <p className="text-[9px] text-neutral-slate-400 mt-0.5">{orgLoginSubtitle}</p>
                                  </div>

                                  <div className="space-y-1 text-left">
                                    <div className="h-6 bg-[#F3F4F6] rounded" />
                                    <div className="h-6 bg-[#F3F4F6] rounded" />
                                  </div>

                                  <button
                                    type="button"
                                    className="w-full py-1.5 text-[10px] font-black text-white text-center shadow-xs"
                                    style={{ 
                                      backgroundColor: orgPrimaryColor,
                                      borderRadius: orgBorderRadius === 'none' ? '0px' : orgBorderRadius === 'sm' ? '4px' : orgBorderRadius === 'md' ? '6px' : orgBorderRadius === 'lg' ? '10px' : '9999px'
                                    }}
                                  >
                                    Authorize Access
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* PREVIEW B: Dynamic Mock Dashboard Layout */}
                            <div className="border border-neutral-200 border-gray-200 rounded-xl overflow-hidden shadow-xs min-h-[300px] flex flex-col relative bg-[#F3F4F6]">
                              <span className="absolute top-2 left-2 bg-neutral-900/80 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase z-10">MOCK SIDEBAR PREVIEW</span>
                              
                              <div className="flex h-full">
                                {/* Mock Sidebar */}
                                <div 
                                  className="w-2/5 p-3 flex flex-col justify-between border-r border-neutral-200/40 border-gray-200 transition-colors"
                                  style={{
                                    backgroundColor: orgSidebarMode === 'light' ? '#ffffff' : orgSidebarMode === 'dark' ? '#0f172a' : orgPrimaryColor,
                                    color: orgSidebarMode === 'light' ? '#0f172a' : '#ffffff'
                                  }}
                                >
                                  <div className="space-y-4">
                                    {/* Sidebar Brand Logo */}
                                    <div className="flex items-center space-x-1.5 pb-2 border-b border-neutral-200/10 border-gray-100">
                                      {orgSidebarMode === 'light' ? (
                                        orgLogoUrl ? <img src={orgLogoUrl} alt="Logo" style={{ height: `${Math.min(orgLogoHeight, 22)}px` }} referrerPolicy="no-referrer" /> : <div className="w-5 h-5 rounded-md" style={{ backgroundColor: orgPrimaryColor }} />
                                      ) : (
                                        orgDarkLogoUrl ? <img src={orgDarkLogoUrl} alt="Logo" style={{ height: `${Math.min(orgLogoHeight, 22)}px` }} referrerPolicy="no-referrer" /> : <div className="w-5 h-5 bg-white rounded-md" />
                                      )}
                                      <span className="text-[10px] font-black truncate max-w-[55px]" style={{ fontFamily: orgFontFamily }}>
                                        {orgBrandTitle || orgName}
                                      </span>
                                    </div>

                                    {/* Nav link items */}
                                    <div className="space-y-1">
                                      <div className="h-5 rounded flex items-center px-1.5 text-[9px] font-extrabold bg-gray-100/10">
                                        Active events
                                      </div>
                                      <div className="h-5 rounded flex items-center px-1.5 text-[9px]">
                                        Workspaces
                                      </div>
                                      <div className="h-5 rounded flex items-center px-1.5 text-[9px]">
                                        Accounting
                                      </div>
                                    </div>
                                  </div>

                                  {/* Custom credits */}
                                  {orgShowPoweredBy && (
                                    <span className="text-[7px] text-neutral-slate-400/80 block mt-auto text-center truncate">Powered by EventSaaS</span>
                                  )}
                                </div>

                                {/* Mock Content Area */}
                                <div className="w-3/5 p-3 flex flex-col justify-between">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center bg-white bg-[#F9FAFB] p-1.5 rounded-lg border border-neutral-200/40">
                                      <span className="text-[8px] font-extrabold">Control Cluster</span>
                                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: orgPrimaryColor }} />
                                    </div>
                                    <div className="h-12 bg-white bg-[#F9FAFB] rounded-lg border border-neutral-200/40" />
                                    <div className="grid grid-cols-2 gap-1.5">
                                      <div className="h-8 bg-white bg-[#F9FAFB] rounded border border-neutral-200/40" />
                                      <div className="h-8 bg-white bg-[#F9FAFB] rounded border border-neutral-200/40" />
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-between text-[7px] text-neutral-400">
                                    <span>Version 5.1</span>
                                    <span>Partition active</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* PREVIEW C: Dynamic Custom Themes & Alerts */}
                            <div 
                              className="border rounded-xl p-4 shadow-xs min-h-[300px] flex flex-col justify-between relative transition-all"
                              style={{
                                backgroundColor: previewThemeMode === 'light' ? orgLightBg : orgDarkBg,
                                borderColor: previewThemeMode === 'light' ? orgLightBorder : orgDarkBorder,
                                color: previewThemeMode === 'light' ? orgLightText : orgDarkText,
                              }}
                            >
                              <span className="absolute top-2 left-2 bg-neutral-900/80 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase z-10">THEME INTERFACES</span>
                              
                              <div className="space-y-3.5 mt-4">
                                <span className="text-[9px] uppercase tracking-wider text-neutral-slate-400 font-extrabold block">ALERT SYSTEM MOCKUPS</span>
                                
                                {/* Semantic Alerts */}
                                <div className="p-2 border rounded-lg text-[9px] flex items-center space-x-2" style={{ backgroundColor: `${orgSuccessColor}15`, borderColor: orgSuccessColor, color: orgSuccessColor }}>
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: orgSuccessColor }} />
                                  <span>Event completed successfully!</span>
                                </div>

                                <div className="p-2 border rounded-lg text-[9px] flex items-center space-x-2" style={{ backgroundColor: `${orgWarningColor}15`, borderColor: orgWarningColor, color: orgWarningColor }}>
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: orgWarningColor }} />
                                  <span>Subscription limit alert</span>
                                </div>

                                <div className="p-2 border rounded-lg text-[9px] flex items-center space-x-2" style={{ backgroundColor: `${orgDangerColor}15`, borderColor: orgDangerColor, color: orgDangerColor }}>
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: orgDangerColor }} />
                                  <span>Error: booking cancelled</span>
                                </div>

                                {/* Custom Themed Card */}
                                <div 
                                  className="p-3 border rounded-xl space-y-2"
                                  style={{
                                    backgroundColor: previewThemeMode === 'light' ? orgLightCardBg : orgDarkCardBg,
                                    borderColor: previewThemeMode === 'light' ? orgLightBorder : orgDarkBorder
                                  }}
                                >
                                  <span className="text-[9px] font-bold">Dynamic Component Card</span>
                                  <div className="flex space-x-2">
                                    <button type="button" className="px-2 py-1 text-[8px] font-extrabold text-white rounded-lg shadow-xs" style={{ backgroundColor: orgPrimaryColor }}>
                                      Primary
                                    </button>
                                    <button type="button" className="px-2 py-1 text-[8px] font-extrabold text-white rounded-lg shadow-xs" style={{ backgroundColor: orgSecondaryColor }}>
                                      Secondary
                                    </button>
                                    <button type="button" className="px-2 py-1 text-[8px] font-extrabold text-white rounded-lg shadow-xs" style={{ backgroundColor: orgAccentColor }}>
                                      Accent
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <span className="text-[8px] text-neutral-slate-400 mt-2 font-mono uppercase text-center block">
                                Border Rounding Scale: {orgBorderRadius.toUpperCase()}
                              </span>
                            </div>

                          </div>
                        </div>
                      </div>
                    )}

                    {orgSubTab === 'team' && (
                      <div className="space-y-6">
                        <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-6">
                          <div>
                            <h3 className="font-display font-bold text-lg text-gray-900 flex items-center space-x-2">
                              <Users className="w-5 h-5 text-brand-primary" />
                              <span>Organization Team Invitations</span>
                            </h3>
                            <p className="text-xs text-neutral-slate-400 mt-0.5">Invite new staff members or administrators, manage pending tokens, and audit membership access.</p>
                          </div>

                          <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl space-y-4">
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Dispatch Team Invitation</h4>
                            
                            {inviteError && (
                              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                                {inviteError}
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                              <div>
                                <label className="block text-xs font-semibold text-neutral-slate-500 mb-1">Colleague Email</label>
                                <input
                                  type="email"
                                  value={newInviteEmail}
                                  onChange={e => setNewInviteEmail(e.target.value)}
                                  placeholder="coworker@company.com"
                                  className="w-full px-3 py-2 text-xs rounded-lg border-[#E5E7EB] bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-neutral-slate-500 mb-1">Access Role</label>
                                <select
                                  value={newInviteRole}
                                  onChange={e => setNewInviteRole(e.target.value)}
                                  className="w-full px-3 py-2 text-xs rounded-lg border-[#E5E7EB] bg-white font-bold"
                                >
                                  <option value="STAFF">Staff Operator</option>
                                  <option value="HUB_MEMBER">Hub Member</option>
                                  <option value="TENANT_ADMIN">Tenant Co-Admin</option>
                                </select>
                              </div>
                              <Button type="button" onClick={handleSendInvite} className="h-[34px] text-xs font-bold">
                                <span>Send Invitation</span>
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Dispatched Invitations Registry</h4>
                            {teamInvitesLoading ? (
                              <div className="text-center py-6 text-xs text-neutral-slate-400">Loading registry...</div>
                            ) : teamInvitations.length === 0 ? (
                              <div className="p-6 text-center border border-dashed border-gray-200 rounded-xl text-xs text-neutral-slate-400">
                                No invitations currently registered.
                              </div>
                            ) : (
                              <div className="border-[#E5E7EB] rounded-xl overflow-hidden divide-y divide-neutral-slate-200 divide-gray-200">
                                {teamInvitations.map((inv) => (
                                  <div key={inv._id || inv.id} className="p-4 flex items-center justify-between bg-[#F9FAFB] text-xs">
                                    <div className="space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <span className="font-bold text-gray-900">{inv.email}</span>
                                        <span className="px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase tracking-wider">
                                          {inv.role}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-neutral-slate-400 font-mono">
                                        Token: {inv.token} • Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                                      </p>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                                        inv.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 animate-pulse' :
                                        inv.status === 'EXPIRED' ? 'bg-neutral-200 text-neutral-600' :
                                        'bg-amber-50 text-amber-700'
                                      }`}>
                                        {inv.status}
                                      </span>

                                      {inv.status === 'PENDING' && (
                                        <button
                                          type="button"
                                          onClick={() => handleRevokeInvite(inv._id || inv.id)}
                                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                                        >
                                          <Trash2 className="w-4.5 h-4.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {orgSubTab === 'team' && (
                      <div className="space-y-6">
                        <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-6">
                          <div>
                            <h3 className="font-display font-bold text-lg text-gray-900 flex items-center space-x-2">
                              <Users className="w-5 h-5 text-brand-primary" />
                              <span>Organization Team Invitations</span>
                            </h3>
                            <p className="text-xs text-neutral-slate-400 mt-0.5">Invite new staff members or administrators, manage pending tokens, and audit membership access.</p>
                          </div>

                          <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl space-y-4">
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Dispatch Team Invitation</h4>
                            
                            {inviteError && (
                              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                                {inviteError}
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                              <div>
                                <label className="block text-xs font-semibold text-neutral-slate-500 mb-1">Colleague Email</label>
                                <input
                                  type="email"
                                  value={newInviteEmail}
                                  onChange={e => setNewInviteEmail(e.target.value)}
                                  placeholder="coworker@company.com"
                                  className="w-full px-3 py-2 text-xs rounded-lg border-[#E5E7EB] bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-neutral-slate-500 mb-1">Access Role</label>
                                <select
                                  value={newInviteRole}
                                  onChange={e => setNewInviteRole(e.target.value)}
                                  className="w-full px-3 py-2 text-xs rounded-lg border-[#E5E7EB] bg-white font-bold"
                                >
                                  <option value="STAFF">Staff Operator</option>
                                  <option value="HUB_MEMBER">Hub Member</option>
                                  <option value="TENANT_ADMIN">Tenant Co-Admin</option>
                                </select>
                              </div>
                              <Button type="button" onClick={handleSendInvite} className="h-[34px] text-xs font-bold">
                                <span>Send Invitation</span>
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Dispatched Invitations Registry</h4>
                            {teamInvitesLoading ? (
                              <div className="text-center py-6 text-xs text-neutral-slate-400">Loading registry...</div>
                            ) : teamInvitations.length === 0 ? (
                              <div className="p-6 text-center border border-dashed border-gray-200 rounded-xl text-xs text-neutral-slate-400">
                                No invitations currently registered.
                              </div>
                            ) : (
                              <div className="border-[#E5E7EB] rounded-xl overflow-hidden divide-y divide-neutral-slate-200 divide-gray-200">
                                {teamInvitations.map((inv) => (
                                  <div key={inv._id || inv.id} className="p-4 flex items-center justify-between bg-[#F9FAFB] text-xs">
                                    <div className="space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <span className="font-bold text-gray-900">{inv.email}</span>
                                        <span className="px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase tracking-wider">
                                          {inv.role}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-neutral-slate-400 font-mono">
                                        Token: {inv.token} • Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                                      </p>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                                        inv.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 animate-pulse' :
                                        inv.status === 'EXPIRED' ? 'bg-neutral-200 text-neutral-600' :
                                        'bg-amber-50 text-amber-700'
                                      }`}>
                                        {inv.status}
                                      </span>

                                      {inv.status === 'PENDING' && (
                                        <button
                                          type="button"
                                          onClick={() => handleRevokeInvite(inv._id || inv.id)}
                                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                                        >
                                          <Trash2 className="w-4.5 h-4.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {orgSubTab === 'website' && (
                      <div className="space-y-6">
                        {/* Section 1: Hero & Enablement */}
                        <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-display font-bold text-lg text-gray-900 flex items-center space-x-2">
                                <Globe className="w-5 h-5 text-indigo-500" />
                                <span>Public Organization Website Settings</span>
                              </h3>
                              <p className="text-xs text-neutral-slate-400 mt-0.5">Establish a professional public website with no coding required.</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                id="websiteEnabled"
                                checked={websiteEnabled}
                                onChange={(e) => setWebsiteEnabled(e.target.checked)}
                                className="w-4 h-4 rounded text-brand-primary" 
                              />
                              <label htmlFor="websiteEnabled" className="text-xs font-bold text-gray-700">
                                Enable Public Website
                              </label>
                            </div>
                          </div>

                          <div className="p-3 bg-indigo-50/40 bg-indigo-50/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 rounded-xl flex items-center justify-between text-xs font-bold">
                            <span>Your public-facing website live URL:</span>
                            <a 
                              href={`/#/organizers/${user?.tenantId || 'weventurehub'}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="underline text-brand-primary hover:text-brand-primary-hover font-mono bg-white px-3 py-1 rounded-md shadow-xs border"
                            >
                              {window.location.origin}/#/organizers/{user?.tenantId || 'weventurehub'}
                            </a>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b pb-2">Hero Section Content</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Input 
                                label="Hero Primary Title" 
                                value={websiteHeroTitle} 
                                onChange={(e) => setWebsiteHeroTitle(e.target.value)} 
                                placeholder="Custom Tailored Workspace & Events Hub"
                              />
                              <Input 
                                label="Hero Subtitle / Description" 
                                value={websiteHeroSubtitle} 
                                onChange={(e) => setWebsiteHeroSubtitle(e.target.value)} 
                                placeholder="Establish, coordinate, and host premium workspace boards..."
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Input 
                                label="Hero Background Image URL" 
                                value={websiteHeroBgUrl} 
                                onChange={(e) => setWebsiteHeroBgUrl(e.target.value)} 
                                placeholder="https://images.unsplash.com/photo-..."
                              />
                              <Input 
                                label="Call-To-Action (CTA) Text" 
                                value={websiteHeroCtaText} 
                                onChange={(e) => setWebsiteHeroCtaText(e.target.value)} 
                                placeholder="Explore Experiences"
                              />
                              <Input 
                                label="Call-To-Action (CTA) Redirection Link" 
                                value={websiteHeroCtaLink} 
                                onChange={(e) => setWebsiteHeroCtaLink(e.target.value)} 
                                placeholder="#events"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Section 2: About narratives */}
                        <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-4">
                          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b pb-2">About Narrative Section</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                              <Input 
                                label="About Title Header" 
                                value={websiteAboutTitle} 
                                onChange={(e) => setWebsiteAboutTitle(e.target.value)} 
                                placeholder="Our Narrative"
                              />
                            </div>
                            <Input 
                              label="Founding Year" 
                              type="number" 
                              value={websiteAboutYear} 
                              onChange={(e) => setWebsiteAboutYear(Number(e.target.value))} 
                              placeholder="2024"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-neutral-slate-500">About Narrative Description</label>
                            <textarea
                              value={websiteAboutDesc}
                              onChange={(e) => setWebsiteAboutDesc(e.target.value)}
                              placeholder="We are committed to delivering outstanding workspace bookings..."
                              className="w-full h-24 p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                            />
                          </div>
                          <Input 
                            label="Key Selling Highlights (separated with commas)" 
                            value={websiteAboutHighlights} 
                            onChange={(e) => setWebsiteAboutHighlights(e.target.value)} 
                            placeholder="Tailored boardrooms, High-speed fiber web, Active workshops"
                          />
                        </div>

                        {/* Section 3: Team list JSON config */}
                        <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-4">
                          <div>
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Dynamic Team Members (JSON Configuration)</h4>
                            <p className="text-[10px] text-neutral-slate-400 mt-1">Provide an array of objects containing name, role, bio, and photoUrl.</p>
                          </div>
                          <textarea
                            value={websiteTeamJSON}
                            onChange={(e) => setWebsiteTeamJSON(e.target.value)}
                            className="w-full h-32 p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                          />
                        </div>

                        {/* Section 4: Gallery list JSON config */}
                        <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-4">
                          <div>
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Interactive Gallery Mosaic (JSON Configuration)</h4>
                            <p className="text-[10px] text-neutral-slate-400 mt-1">Provide an array of objects containing url and caption.</p>
                          </div>
                          <textarea
                            value={websiteGalleryJSON}
                            onChange={(e) => setWebsiteGalleryJSON(e.target.value)}
                            className="w-full h-32 p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                          />
                        </div>

                        {/* Section 5: Testimonials list JSON config */}
                        <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-4">
                          <div>
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Testimonials Carousel (JSON Configuration)</h4>
                            <p className="text-[10px] text-neutral-slate-400 mt-1">Provide an array of objects containing name, role, text, rating, and avatarUrl.</p>
                          </div>
                          <textarea
                            value={websiteTestimonialsJSON}
                            onChange={(e) => setWebsiteTestimonialsJSON(e.target.value)}
                            className="w-full h-32 p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                          />
                        </div>

                        {/* Section 6: SEO & Meta Tag overrides */}
                        <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-4">
                          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b pb-2">SEO Search Engine Optimization</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input 
                              label="SEO Page Meta Title Override" 
                              value={websiteSeoTitle} 
                              onChange={(e) => setWebsiteSeoTitle(e.target.value)} 
                              placeholder="Premium Workspace Hub"
                            />
                            <Input 
                              label="SEO OpenGraph Preview Image URL" 
                              value={websiteSeoOgImage} 
                              onChange={(e) => setWebsiteSeoOgImage(e.target.value)} 
                              placeholder="https://example.com/social-preview.png"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs text-neutral-slate-500">SEO Page Meta Description</label>
                              <textarea
                                value={websiteSeoDesc}
                                onChange={(e) => setWebsiteSeoDesc(e.target.value)}
                                placeholder="Schedule premium boardrooms and conference centers easily..."
                                className="w-full h-20 p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-neutral-slate-500 font-bold block mb-1">SEO Keywords (comma separated)</label>
                              <textarea
                                value={websiteSeoKeywords}
                                onChange={(e) => setWebsiteSeoKeywords(e.target.value)}
                                placeholder="workspace, events, booking, tech hub, boardrooms"
                                className="w-full h-20 p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Section 7: Analytics Integration */}
                        <div className="bento-card bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-4">
                          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b pb-2">Analytics & Pixels Integration</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input 
                              label="Google Analytics Measurement ID (G-XXXXXX)" 
                              value={websiteAnalyticsGaId} 
                              onChange={(e) => setWebsiteAnalyticsGaId(e.target.value)} 
                              placeholder="G-12345678"
                            />
                            <Input 
                              label="Facebook Pixel ID" 
                              value={websiteAnalyticsPixelId} 
                              onChange={(e) => setWebsiteAnalyticsPixelId(e.target.value)} 
                              placeholder="1234567890"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-neutral-slate-500 font-bold">Custom Javascript Script Injection (e.g. Chat widgets, tracking codes)</label>
                            <textarea
                              value={websiteAnalyticsScript}
                              onChange={(e) => setWebsiteAnalyticsScript(e.target.value)}
                              placeholder="// Insert custom widget codes here..."
                              className="w-full h-24 bg-[#F9FAFB] p-2.5 border-[#E5E7EB] rounded-xl font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Subscription & Expire details */}
                    <div className="bento-card bg-[#F9FAFB] border border-[#E5E7EB] p-6 rounded-2xl shadow-xs space-y-6">
                      <div className="flex items-center justify-between border-b border-gray-200/60 pb-3">
                        <div>
                          <h3 className="font-display font-bold text-lg text-gray-900 flex items-center space-x-2">
                            <CreditCard className="w-5 h-5 text-brand-primary" />
                            <span>Tenant Subscription Plan</span>
                          </h3>
                          <p className="text-xs text-neutral-slate-400 mt-0.5">Plan limits, quotas, and feature flags enforced on this organization space.</p>
                        </div>
                        <span className="px-4 py-1 bg-brand-primary text-white text-xs font-black rounded-lg uppercase tracking-wider">{orgPlan} PLAN</span>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl">
                          <span className="text-[9px] text-neutral-slate-400 uppercase tracking-wider block font-bold">Workspace Quota</span>
                          <span className="text-lg font-display font-black block mt-1 text-gray-900">
                            {orgLimits?.maxWorkspaces || 5} max
                          </span>
                        </div>
                        <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl">
                          <span className="text-[9px] text-neutral-slate-400 uppercase tracking-wider block font-bold">Event Capacity</span>
                          <span className="text-lg font-display font-black block mt-1 text-gray-900">
                            {orgLimits?.maxEvents || 10} max
                          </span>
                        </div>
                        <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl">
                          <span className="text-[9px] text-neutral-slate-400 uppercase tracking-wider block font-bold">Registered Members</span>
                          <span className="text-lg font-display font-black block mt-1 text-gray-900">
                            {orgLimits?.maxUsers || 10} max
                          </span>
                        </div>
                      </div>

                      {orgTrial && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/25 border border-amber-200/40 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold flex items-center space-x-2.5">
                          <CloudLightning className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>This organization is currently on a trial package. Expiring at: {orgExpires ? new Date(orgExpires).toLocaleDateString() : 'N/A'}.</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="submit" className="flex items-center gap-1.5 text-xs font-bold px-5 py-2.5">
                        <Save className="w-4 h-4" />
                        <span>Save Tenant White-Label Configuration</span>
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          <div className="bento-card bg-rose-50/5 border border-rose-100 p-6 rounded-2xl">
            <h3 className="font-display font-bold text-lg text-rose-600 mb-2">Danger Zone</h3>
            <p className="text-xs text-neutral-slate-400 mb-6">Irreversible destructive actions scoped under this tenant block.</p>
            
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700">Delete My Tenant Data</h4>
                <p className="text-[11px] text-rose-600 mt-1">This will permanently purge this entire partitioned organization.</p>
              </div>
              <Button variant="danger" size="sm" className="font-bold">
                Purge Organization
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
