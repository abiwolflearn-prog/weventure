import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail, Phone, MapPin, Sparkles, CheckCircle, MessageSquare, Clock } from 'lucide-react';
import { Button } from '../components/Button';
import { publicApi } from '../lib/publicApi';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: companyInfo } = useQuery({
    queryKey: ['companyInfoPublic'],
    queryFn: publicApi.getCompanyInfo,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await publicApi.submitInquiry({ name, email, message: company ? `[Company: ${company}] ${message}` : message });
      setSuccess(true);
      setName('');
      setEmail('');
      setCompany('');
      setMessage('');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to submit inquiry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111111] min-h-screen py-12 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-accent/10 border border-brand-accent/20 rounded-full text-[10px] font-bold text-brand-accent uppercase tracking-wider font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>24/7 Global Help Desk</span>
          </span>
          <h1 className="font-display font-bold text-[36px] text-white tracking-tight leading-none">
            Get In Touch
          </h1>
          <p className="text-[14px] text-neutral-slate-400 max-w-2xl mx-auto leading-relaxed">
            {companyInfo?.description || 'Have questions about integrations, billing setups, workspace bookings, or API access? Our customer success team is here to support you.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-stretch">
          
          {/* Support Info */}
          <div className="md:col-span-2 bg-[#181818] border border-neutral-800 rounded-[20px] shadow-2xl p-6 md:p-8 space-y-8 flex flex-col justify-between">
            <div className="space-y-6">
              <h3 className="font-display font-bold text-[18px] text-white">{companyInfo?.companyName || 'WeVentureHub'} Headquarters</h3>
              <p className="text-[13px] text-neutral-slate-300 leading-relaxed">
                {companyInfo?.tagline || 'Our customer relationship teams provide reservation support, organization onboarding, and premium workspace management assistance.'}
              </p>

              <div className="space-y-4 text-[13px] text-neutral-slate-300">
                <div className="flex items-start space-x-3.5">
                  <MapPin className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                  <span>{companyInfo?.officeAddress || 'Bole Road, Next to Sunshine Building, Addis Ababa, Ethiopia'}</span>
                </div>
                <div className="flex items-center space-x-3.5">
                  <Phone className="w-5 h-5 text-brand-accent shrink-0" />
                  <span>{companyInfo?.phoneNumbers?.[0] || '+251 911 234 567'}</span>
                </div>
                <div className="flex items-center space-x-3.5">
                  <Mail className="w-5 h-5 text-brand-accent shrink-0" />
                  <span>{companyInfo?.emailAddresses?.[0] || 'info@weventurehub.com'}</span>
                </div>
                {companyInfo?.workingHours && (
                  <div className="flex items-center space-x-3.5 text-xs text-neutral-400">
                    <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>{companyInfo.workingHours}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-[#111111] border border-neutral-800 rounded-[14px] text-[12px] text-neutral-slate-300 leading-relaxed font-semibold">
              💡 <span className="text-brand-accent font-bold">Emergency Line:</span> {companyInfo?.emergencyContact || '+251 911 000 000'}
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-3 bg-[#181818] border border-neutral-800 rounded-[24px] p-6 md:p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <h3 className="font-display font-bold text-[18px] text-white flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-brand-accent" />
                <span>Submit Customer Query</span>
              </h3>

              {success && (
                <div className="p-4 bg-emerald-950/80 border border-emerald-900 text-emerald-400 rounded-[12px] text-[13px] font-bold flex items-center space-x-2.5">
                  <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
                  <span>Your message has been received! Our support dispatch will respond shortly.</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-4 bg-rose-950/80 border border-rose-900 text-rose-400 rounded-[12px] text-[13px] font-bold">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-neutral-slate-400 block">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jean Dupont"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-neutral-800 rounded-[10px] text-[13px] text-white outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20 bg-[#111111] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-neutral-slate-400 block">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jean@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-neutral-800 rounded-[10px] text-[13px] text-white outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20 bg-[#111111] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-neutral-slate-400 block">Company / Organization (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. WeVenture Ltd"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-800 rounded-[10px] text-[13px] text-white outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20 bg-[#111111] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-neutral-slate-400 block">Message Details</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your request..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-800 rounded-[10px] text-[13px] text-white outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20 bg-[#111111] transition-all resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-accent hover:bg-brand-accent/90 text-white font-bold text-xs rounded-xl transition-all"
              >
                {loading ? 'Submitting Message...' : 'Send Message'}
              </Button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
