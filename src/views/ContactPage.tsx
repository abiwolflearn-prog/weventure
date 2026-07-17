import React, { useState } from 'react';
import { Mail, Phone, MapPin, Sparkles, CheckCircle, MessageSquare } from 'lucide-react';
import { Button } from '../components/Button';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setName('');
      setEmail('');
      setCompany('');
      setMessage('');
    }, 1000);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#EFF6FF] border border-[#DBEAFE] rounded-full text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>24/7 Global Help Desk</span>
          </span>
          <h1 className="font-display font-bold text-[36px] text-[#111827] tracking-tight leading-none">
            Get In Touch
          </h1>
          <p className="text-[14px] text-[#6B7280] max-w-2xl mx-auto leading-relaxed">
            Have questions about integrations, billing setups, workspace bookings, or API access? Our customer success team is here to support you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-stretch">
          
          {/* Support Info */}
          <div className="md:col-span-2 bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.01)] p-6 md:p-8 space-y-8 flex flex-col justify-between">
            <div className="space-y-6">
              <h3 className="font-display font-bold text-[18px] text-[#111827]">WeVentureHub Headquarters</h3>
              <p className="text-[13px] text-[#6B7280] leading-relaxed">
                Our customer relationship teams provide reservation support, organization onboarding, and premium workspace management assistance.
              </p>

              <div className="space-y-4 text-[13px] text-[#4B5563]">
                <div className="flex items-center space-x-3.5">
                  <MapPin className="w-5 h-5 text-[#2563EB] shrink-0" />
                  <span>100 Pine Street, San Francisco, CA 94111</span>
                </div>
                <div className="flex items-center space-x-3.5">
                  <Phone className="w-5 h-5 text-[#2563EB] shrink-0" />
                  <span>+1 (415) 555-0190</span>
                </div>
                <div className="flex items-center space-x-3.5">
                  <Mail className="w-5 h-5 text-[#2563EB] shrink-0" />
                  <span>support@weventurehub.com</span>
                </div>
              </div>
            </div>

            <div className="p-4.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[14px] text-[12px] text-[#4B5563] leading-relaxed font-semibold">
              💡 **Support SLA Promise:** All Premium Tier inquiries receive priority routing and resolution guarantees under 1 hour.
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-3 bg-white border border-[#E5E7EB] rounded-[24px] p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
            <form onSubmit={handleSubmit} className="space-y-5">
              <h3 className="font-display font-bold text-[18px] text-[#111827] flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-[#2563EB]" />
                <span>Submit Customer Query</span>
              </h3>

              {success && (
                <div className="p-4 bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] rounded-[12px] text-[13px] font-bold flex items-center space-x-2.5">
                  <CheckCircle className="w-5 h-5 shrink-0 text-[#10B981]" />
                  <span>Your message has been received! Our support dispatch will respond shortly.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#4B5563] block">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jean Dupont"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-[10px] text-[13px] text-[#111827] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] bg-white transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#4B5563] block">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jean.dupont@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-[10px] text-[13px] text-[#111827] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-[#4B5563] block">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-[10px] text-[13px] text-[#111827] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-[#4B5563] block">Technical message or query</label>
                <textarea
                  required
                  rows={4}
                  placeholder="How can we help optimize your workspace registries today?"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-[10px] text-[13px] text-[#111827] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] bg-white transition-all"
                />
              </div>

              <Button 
                type="submit" 
                isLoading={loading} 
                className="w-full text-[13px] font-bold py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[10px]"
              >
                Send Message
              </Button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
