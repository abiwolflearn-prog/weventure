import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  FileText, 
  Save, 
  CheckCircle2, 
  Upload, 
  Clock, 
  AlertCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { axiosInstance } from '../../lib/axiosInstance';

interface CompanyInfoTabProps {
  onSuccessToast?: (msg: string) => void;
}

export const CompanyInfoTab: React.FC<CompanyInfoTabProps> = ({ onSuccessToast }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState('WeVentureHub');
  const [legalName, setLegalName] = useState('WE VENTURE HOLDINGS PLC');
  const [tagline, setTagline] = useState('The Premier Entrepreneurship & Coworking Hub in Addis Ababa');
  const [description, setDescription] = useState('WeVentureHub empowers African startups, founders, and enterprises with world-class workspaces and event acceleration.');
  const [phone, setPhone] = useState('091 124 3503');
  const [secondaryPhone, setSecondaryPhone] = useState('+251 91 124 3503');
  const [email, setEmail] = useState('info@weventurehub.com');
  const [billingEmail, setBillingEmail] = useState('billing@weventurehub.com');
  const [website, setWebsite] = useState('https://weventurehub.com');
  const [officeAddress, setOfficeAddress] = useState('Bole Road, Sur Construction Building, 2nd Floor, Addis Ababa, Ethiopia');
  const [city, setCity] = useState('Addis Ababa');
  const [country, setCountry] = useState('Ethiopia');
  const [tinNumber, setTinNumber] = useState('0082788884');
  const [vatRegNo, setVatRegNo] = useState('23130180002');
  const [businessRegInfo, setBusinessRegInfo] = useState('Trade License No. 04/2/18944/16 • Ministry of Trade & Regional Integration');
  const [workingHours, setWorkingHours] = useState('Mon - Sat: 8:00 AM - 10:00 PM | Sun: Closed');
  const [logoUrl, setLogoUrl] = useState('/logo.png');
  const [googleMapUrl, setGoogleMapUrl] = useState('https://maps.google.com/?q=Bole+Road+Addis+Ababa');

  // Social Links
  const [facebook, setFacebook] = useState('https://facebook.com/weventurehub');
  const [twitter, setTwitter] = useState('https://twitter.com/weventurehub');
  const [linkedin, setLinkedin] = useState('https://linkedin.com/company/weventurehub');
  const [telegram, setTelegram] = useState('https://t.me/weventurehub');

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/cms/company-info');
      const data = res.data?.data;
      if (data) {
        if (data.companyName) setCompanyName(data.companyName);
        if (data.legalName) setLegalName(data.legalName);
        if (data.tagline) setTagline(data.tagline);
        if (data.description) setDescription(data.description);
        if (data.phoneNumbers && data.phoneNumbers.length > 0) {
          setPhone(data.phoneNumbers[0] || '091 124 3503');
          if (data.phoneNumbers.length > 1) setSecondaryPhone(data.phoneNumbers[1]);
        }
        if (data.emailAddresses && data.emailAddresses.length > 0) {
          setEmail(data.emailAddresses[0] || 'info@weventurehub.com');
          if (data.emailAddresses.length > 1) setBillingEmail(data.emailAddresses[1]);
        }
        if (data.website) setWebsite(data.website);
        if (data.officeAddress) setOfficeAddress(data.officeAddress);
        if (data.city) setCity(data.city);
        if (data.country) setCountry(data.country);
        if (data.tinNumber) setTinNumber(data.tinNumber);
        if (data.vatRegNo) setVatRegNo(data.vatRegNo);
        if (data.businessRegistrationInfo) setBusinessRegInfo(data.businessRegistrationInfo);
        if (data.workingHours) setWorkingHours(data.workingHours);
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (data.googleMapEmbedUrl) setGoogleMapUrl(data.googleMapEmbedUrl);
        if (data.socialMediaLinks) {
          if (data.socialMediaLinks.facebook) setFacebook(data.socialMediaLinks.facebook);
          if (data.socialMediaLinks.twitter) setTwitter(data.socialMediaLinks.twitter);
          if (data.socialMediaLinks.linkedin) setLinkedin(data.socialMediaLinks.linkedin);
          if (data.socialMediaLinks.telegram) setTelegram(data.socialMediaLinks.telegram);
        }
      }
    } catch (err: any) {
      console.warn('Could not load company info, using platform defaults', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const payload = {
        companyName,
        legalName,
        tagline,
        description,
        phoneNumbers: [phone, secondaryPhone].filter(Boolean),
        emailAddresses: [email, billingEmail].filter(Boolean),
        website,
        officeAddress,
        city,
        country,
        tinNumber,
        vatRegNo,
        businessRegistrationInfo: businessRegInfo,
        workingHours,
        logoUrl,
        googleMapEmbedUrl: googleMapUrl,
        socialMediaLinks: {
          facebook,
          twitter,
          linkedin,
          telegram,
        },
      };

      await axiosInstance.put('/cms/company-info', payload);
      setSavedSuccess(true);
      if (onSuccessToast) onSuccessToast('Company information successfully updated');
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save company information.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3"></div>
        <span>Loading company configuration...</span>
      </div>
    );
  }

  return (
    <form id="company-info-form" onSubmit={handleSave} className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#84CC16]/10 text-[#65A30D] rounded-2xl flex items-center justify-center border border-[#84CC16]/30 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-[#111111] dark:text-white tracking-tight">WeVentureHub Company Profile</h2>
              <p className="text-[#6B7280] dark:text-slate-400 text-sm mt-0.5 font-medium">
                Official entity information automatically applied to Quotations, Invoices, Receipts, and Website headers.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#84CC16]/15 border border-[#84CC16]/30 px-3 py-1.5 rounded-full text-[#65A30D] text-xs font-bold select-none">
            <ShieldCheck className="w-4 h-4" />
            <span>Single-Organization Authoritative Profile</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-4 bg-[#84CC16]/15 border border-[#84CC16]/40 rounded-xl text-[#65A30D] text-sm flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Company information updated and synchronized across all platform documents!</span>
        </div>
      )}

      {/* Grid Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Identity */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-slate-800">
            <Building2 className="w-5 h-5 text-[#84CC16]" />
            <h3 className="text-base font-bold text-[#111111] dark:text-white">Organization Identity</h3>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
              Brand / Display Name *
            </label>
            <Input
              id="company-name-input"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="WeVentureHub"
              required
            />
            <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-1 font-medium">Visible on platform navigation and public website.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
              Registered Legal Entity Name *
            </label>
            <Input
              id="legal-name-input"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="WE VENTURE HOLDINGS PLC"
              required
            />
            <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-1 font-medium">Official name used on settlement bank accounts and tax invoices.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
              Tagline / Subtitle
            </label>
            <Input
              id="tagline-input"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="The Premier Entrepreneurship & Coworking Hub in Addis Ababa"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
              About Description
            </label>
            <textarea
              id="description-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111111] dark:text-white focus:ring-2 focus:ring-[#84CC16]/20 focus:border-[#84CC16] focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
              Official Logo URL
            </label>
            <div className="flex gap-2">
              <Input
                id="logo-url-input"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="/logo.png"
              />
              {logoUrl && (
                <div className="w-12 h-12 border border-neutral-200 dark:border-slate-700 rounded-[14px] p-1.5 flex items-center justify-center bg-neutral-50 dark:bg-slate-800 shrink-0">
                  <img src={logoUrl} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tax & Commercial Registration */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-slate-800">
            <FileText className="w-5 h-5 text-[#84CC16]" />
            <h3 className="text-base font-bold text-[#111111] dark:text-white">Tax & Legal Registration</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Tax Identification (TIN) *
              </label>
              <Input
                id="tin-number-input"
                value={tinNumber}
                onChange={(e) => setTinNumber(e.target.value)}
                placeholder="0082788884"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                VAT Registration No. *
              </label>
              <Input
                id="vat-reg-input"
                value={vatRegNo}
                onChange={(e) => setVatRegNo(e.target.value)}
                placeholder="23130180002"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
              Business Registration & Trade License Information
            </label>
            <Input
              id="business-reg-input"
              value={businessRegInfo}
              onChange={(e) => setBusinessRegInfo(e.target.value)}
              placeholder="Trade License No. 04/2/18944/16 • Ministry of Trade and Regional Integration"
            />
            <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-1 font-medium">Appears on official WeVentureHub commercial agreements and quotations.</p>
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-slate-800 space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Operating / Hub Working Hours
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="working-hours-input"
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111111] dark:text-white focus:ring-2 focus:ring-[#84CC16]/20 focus:border-[#84CC16] focus:outline-none transition-all"
                  placeholder="Mon - Sat: 8:00 AM - 10:00 PM | Sun: Closed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Official Website
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="website-input"
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111111] dark:text-white focus:ring-2 focus:ring-[#84CC16]/20 focus:border-[#84CC16] focus:outline-none transition-all"
                  placeholder="https://weventurehub.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Physical Address */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-slate-800">
            <MapPin className="w-5 h-5 text-[#84CC16]" />
            <h3 className="text-base font-bold text-[#111111] dark:text-white">Physical Location & Contact</h3>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
              Office Street Address *
            </label>
            <Input
              id="office-address-input"
              value={officeAddress}
              onChange={(e) => setOfficeAddress(e.target.value)}
              placeholder="Bole Road, Sur Construction Building, 2nd Floor, Addis Ababa, Ethiopia"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                City *
              </label>
              <Input
                id="city-input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Addis Ababa"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Country *
              </label>
              <Input
                id="country-input"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Ethiopia"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Primary Phone *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="phone-input"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111111] dark:text-white focus:ring-2 focus:ring-[#84CC16]/20 focus:border-[#84CC16] focus:outline-none transition-all"
                  placeholder="091 124 3503"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Secondary Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="secondary-phone-input"
                  type="text"
                  value={secondaryPhone}
                  onChange={(e) => setSecondaryPhone(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111111] dark:text-white focus:ring-2 focus:ring-[#84CC16]/20 focus:border-[#84CC16] focus:outline-none transition-all"
                  placeholder="+251 91 124 3503"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Primary Support Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111111] dark:text-white focus:ring-2 focus:ring-[#84CC16]/20 focus:border-[#84CC16] focus:outline-none transition-all"
                  placeholder="info@weventurehub.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Billing & Accounts Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="billing-email-input"
                  type="email"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111111] dark:text-white focus:ring-2 focus:ring-[#84CC16]/20 focus:border-[#84CC16] focus:outline-none transition-all"
                  placeholder="billing@weventurehub.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social Links & Map */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-slate-800">
            <Globe className="w-5 h-5 text-[#84CC16]" />
            <h3 className="text-base font-bold text-[#111111] dark:text-white">Social Channels & Maps</h3>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
              LinkedIn Page URL
            </label>
            <Input
              id="linkedin-input"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/company/weventurehub"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
              Telegram Channel / Community
            </label>
            <Input
              id="telegram-input"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="https://t.me/weventurehub"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
              Facebook Page URL
            </label>
            <Input
              id="facebook-input"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="https://facebook.com/weventurehub"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
              Google Maps Location Link
            </label>
            <Input
              id="google-maps-input"
              value={googleMapUrl}
              onChange={(e) => setGoogleMapUrl(e.target.value)}
              placeholder="https://maps.google.com/?q=..."
            />
          </div>
        </div>
      </div>

      {/* Save Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-slate-800">
        <Button
          id="save-company-info-btn"
          type="submit"
          disabled={saving}
          variant="primary"
          className="flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Company Information</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
