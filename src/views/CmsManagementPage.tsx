import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Globe, 
  FileText, 
  HelpCircle, 
  Menu as MenuIcon, 
  Building2, 
  Save, 
  Plus, 
  Trash2, 
  Edit2, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Layers, 
  Image, 
  Users, 
  Clock, 
  Eye, 
  EyeOff
} from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { axiosInstance } from '../lib/axiosInstance';

export default function CmsManagementPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'homepage' | 'about' | 'faqs' | 'company' | 'navigation'>('homepage');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // --- 1. HOMEPAGE CMS ---
  const { data: homepageData, isLoading: hpLoading } = useQuery({
    queryKey: ['cmsHomepage'],
    queryFn: async () => {
      const res = await axiosInstance.get('/cms/homepage');
      return res.data.data.homepage;
    }
  });

  const [hpForm, setHpForm] = useState<any>(null);

  React.useEffect(() => {
    if (homepageData) {
      setHpForm(homepageData);
    }
  }, [homepageData]);

  const saveHomepageMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axiosInstance.put('/cms/homepage', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cmsHomepage'] });
      queryClient.invalidateQueries({ queryKey: ['homepageConfig'] });
      showToast('Homepage CMS updated successfully!');
    }
  });

  // --- 2. ABOUT PAGE CMS ---
  const { data: aboutData, isLoading: aboutLoading } = useQuery({
    queryKey: ['cmsAbout'],
    queryFn: async () => {
      const res = await axiosInstance.get('/cms/about');
      return res.data.data.about;
    }
  });

  const [aboutForm, setAboutForm] = useState<any>(null);

  React.useEffect(() => {
    if (aboutData) {
      setAboutForm(aboutData);
    }
  }, [aboutData]);

  const saveAboutMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axiosInstance.put('/cms/about', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cmsAbout'] });
      queryClient.invalidateQueries({ queryKey: ['aboutCms'] });
      showToast('About Page CMS updated successfully!');
    }
  });

  // --- 3. FAQS CMS ---
  const { data: faqsData, isLoading: faqsLoading } = useQuery({
    queryKey: ['cmsFaqs'],
    queryFn: async () => {
      const res = await axiosInstance.get('/cms/faqs?includeUnpublished=true');
      return res.data.data.faqs || [];
    }
  });

  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState('General');
  const [faqPublished, setFaqPublished] = useState(true);

  const saveFaqMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingFaq) {
        return (await axiosInstance.put(`/cms/faqs/${editingFaq.id || editingFaq._id}`, payload)).data;
      }
      return (await axiosInstance.post('/cms/faqs', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cmsFaqs'] });
      queryClient.invalidateQueries({ queryKey: ['publicFaqs'] });
      setFaqModalOpen(false);
      showToast(editingFaq ? 'FAQ updated!' : 'FAQ created!');
    }
  });

  const deleteFaqMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await axiosInstance.delete(`/cms/faqs/${id}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cmsFaqs'] });
      showToast('FAQ deleted.');
    }
  });

  // --- 4. COMPANY INFO CMS ---
  const { data: companyData, isLoading: companyLoading } = useQuery({
    queryKey: ['cmsCompany'],
    queryFn: async () => {
      const res = await axiosInstance.get('/cms/company');
      return res.data.data.company;
    }
  });

  const [companyForm, setCompanyForm] = useState<any>(null);

  React.useEffect(() => {
    if (companyData) {
      setCompanyForm(companyData);
    }
  }, [companyData]);

  const saveCompanyMutation = useMutation({
    mutationFn: async (payload: any) => {
      return (await axiosInstance.put('/cms/company', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cmsCompany'] });
      queryClient.invalidateQueries({ queryKey: ['companyInfo'] });
      showToast('Company info updated successfully!');
    }
  });

  // --- 5. NAVIGATION CMS ---
  const { data: navData, isLoading: navLoading } = useQuery({
    queryKey: ['cmsNavigation'],
    queryFn: async () => {
      const res = await axiosInstance.get('/cms/navigation');
      return res.data.data.menus || [];
    }
  });

  const [navForm, setNavForm] = useState<any[]>([]);

  React.useEffect(() => {
    if (navData) {
      setNavForm(navData);
    }
  }, [navData]);

  const saveNavMutation = useMutation({
    mutationFn: async (menu: any) => {
      return (await axiosInstance.put('/cms/navigation', menu)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cmsNavigation'] });
      queryClient.invalidateQueries({ queryKey: ['publicNavigationMenus'] });
      showToast('Navigation menu updated successfully!');
    }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-900">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <Globe className="w-6 h-6 text-brand-primary" />
            <h1 className="font-display font-bold text-2xl text-slate-900">Website Content Management System (CMS)</h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Manage public website text, landing hero sections, About page history, FAQs, navigation, and contact info in real-time.
          </p>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('homepage')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'homepage' ? 'bg-brand-primary text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Homepage Hero & Sections</span>
        </button>

        <button
          onClick={() => setActiveTab('about')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'about' ? 'bg-brand-primary text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>About Us & Vision</span>
        </button>

        <button
          onClick={() => setActiveTab('faqs')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'faqs' ? 'bg-brand-primary text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>FAQ Registry</span>
        </button>

        <button
          onClick={() => setActiveTab('company')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'company' ? 'bg-brand-primary text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Company & Contact Info</span>
        </button>

        <button
          onClick={() => setActiveTab('navigation')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'navigation' ? 'bg-brand-primary text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <MenuIcon className="w-4 h-4" />
          <span>Dynamic Menus</span>
        </button>
      </div>

      {/* --- TAB 1: HOMEPAGE CMS --- */}
      {activeTab === 'homepage' && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
          <h2 className="font-bold text-lg text-slate-900 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-brand-primary" />
            <span>Homepage CMS Config</span>
          </h2>

          {hpLoading || !hpForm ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-primary" /></div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); saveHomepageMutation.mutate(hpForm); }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hero Title</label>
                  <Input 
                    value={hpForm.heroTitle || ''} 
                    onChange={(e) => setHpForm({ ...hpForm, heroTitle: e.target.value })} 
                    className="!bg-white !border-slate-300 !text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hero Image URL</label>
                  <Input 
                    value={hpForm.heroImageUrl || ''} 
                    onChange={(e) => setHpForm({ ...hpForm, heroImageUrl: e.target.value })} 
                    className="!bg-white !border-slate-300 !text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hero Subtitle</label>
                <textarea
                  rows={2}
                  value={hpForm.heroSubtitle || ''}
                  onChange={(e) => setHpForm({ ...hpForm, heroSubtitle: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hero CTA Button Text</label>
                  <Input 
                    value={hpForm.heroCtaText || ''} 
                    onChange={(e) => setHpForm({ ...hpForm, heroCtaText: e.target.value })} 
                    className="!bg-white !border-slate-300 !text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hero CTA Link Path</label>
                  <Input 
                    value={hpForm.heroCtaLink || ''} 
                    onChange={(e) => setHpForm({ ...hpForm, heroCtaLink: e.target.value })} 
                    className="!bg-white !border-slate-300 !text-slate-900"
                  />
                </div>
              </div>

              {/* Promotion Banner */}
              <div className="border-t border-slate-200 pt-4 space-y-4">
                <h3 className="font-bold text-sm text-brand-primary">Special Promotion Banner</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Promo Title</label>
                    <Input 
                      value={hpForm.promotionTitle || ''} 
                      onChange={(e) => setHpForm({ ...hpForm, promotionTitle: e.target.value })} 
                      className="!bg-white !border-slate-300 !text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Promo Price / Offer</label>
                    <Input 
                      value={hpForm.promotionPrice || ''} 
                      onChange={(e) => setHpForm({ ...hpForm, promotionPrice: e.target.value })} 
                      className="!bg-white !border-slate-300 !text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={saveHomepageMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm"
                >
                  {saveHomepageMutation.isPending ? 'Saving...' : 'Save Homepage Content'}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* --- TAB 2: ABOUT PAGE CMS --- */}
      {activeTab === 'about' && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
          <h2 className="font-bold text-lg text-slate-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-brand-primary" />
            <span>About Us & Company History</span>
          </h2>

          {aboutLoading || !aboutForm ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-primary" /></div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); saveAboutMutation.mutate(aboutForm); }} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Description</label>
                <textarea
                  rows={2}
                  value={aboutForm.companyDescription || ''}
                  onChange={(e) => setAboutForm({ ...aboutForm, companyDescription: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company Mission Statement</label>
                  <textarea
                    rows={3}
                    value={aboutForm.mission || ''}
                    onChange={(e) => setAboutForm({ ...aboutForm, mission: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company Vision Statement</label>
                  <textarea
                    rows={3}
                    value={aboutForm.vision || ''}
                    onChange={(e) => setAboutForm({ ...aboutForm, vision: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company History & Milestone Summary</label>
                <textarea
                  rows={3}
                  value={aboutForm.history || ''}
                  onChange={(e) => setAboutForm({ ...aboutForm, history: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-brand-primary"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={saveAboutMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm"
                >
                  {saveAboutMutation.isPending ? 'Saving...' : 'Save About Page Content'}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* --- TAB 3: FAQS CMS --- */}
      {activeTab === 'faqs' && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-slate-900 flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-brand-primary" />
              <span>FAQ Knowledge Base Management</span>
            </h2>

            <Button
              onClick={() => {
                setEditingFaq(null);
                setFaqQuestion('');
                setFaqAnswer('');
                setFaqCategory('General');
                setFaqPublished(true);
                setFaqModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-1 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add FAQ</span>
            </Button>
          </div>

          {faqsLoading ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-primary" /></div>
          ) : (
            <div className="space-y-4">
              {faqsData.map((faq: any) => (
                <div key={faq.id || faq._id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-4 shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold uppercase">
                        {faq.category}
                      </span>
                      {faq.isPublished ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold">
                          Draft
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-slate-900">{faq.question}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{faq.answer}</p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingFaq(faq);
                        setFaqQuestion(faq.question);
                        setFaqAnswer(faq.answer);
                        setFaqCategory(faq.category || 'General');
                        setFaqPublished(faq.isPublished ?? true);
                        setFaqModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1 text-xs shadow-sm"
                      title="Edit FAQ"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => deleteFaqMutation.mutate(faq.id || faq._id)}
                      className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-600 transition-colors"
                      title="Delete FAQ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit Modal */}
          {faqModalOpen && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-900">
                <h3 className="font-bold text-base text-slate-900">{editingFaq ? 'Edit FAQ Item' : 'Create New FAQ Item'}</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Question</label>
                    <Input 
                      value={faqQuestion} 
                      onChange={(e) => setFaqQuestion(e.target.value)} 
                      className="!bg-white !border-slate-300 !text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Answer</label>
                    <textarea
                      rows={3}
                      value={faqAnswer}
                      onChange={(e) => setFaqAnswer(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-brand-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                    <Input 
                      value={faqCategory} 
                      onChange={(e) => setFaqCategory(e.target.value)} 
                      className="!bg-white !border-slate-300 !text-slate-900"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="faqPub"
                      checked={faqPublished} 
                      onChange={(e) => setFaqPublished(e.target.checked)} 
                      className="rounded bg-white border-slate-300 text-brand-primary focus:ring-0"
                    />
                    <label htmlFor="faqPub" className="text-xs text-slate-700 font-bold">Publish FAQ immediately on website</label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button onClick={() => setFaqModalOpen(false)} className="bg-slate-200 text-slate-700 hover:bg-slate-300 px-4 py-2 rounded-xl text-xs font-bold">
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => saveFaqMutation.mutate({ question: faqQuestion, answer: faqAnswer, category: faqCategory, isPublished: faqPublished })}
                    disabled={saveFaqMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm"
                  >
                    {saveFaqMutation.isPending ? 'Saving...' : 'Save FAQ'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: COMPANY INFO CMS --- */}
      {activeTab === 'company' && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
          <h2 className="font-bold text-lg text-slate-900 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-brand-primary" />
            <span>Company Branding & Contact Details</span>
          </h2>

          {companyLoading || !companyForm ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-primary" /></div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); saveCompanyMutation.mutate(companyForm); }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company Name</label>
                  <Input 
                    value={companyForm.companyName || ''} 
                    onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })} 
                    className="!bg-white !border-slate-300 !text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tagline</label>
                  <Input 
                    value={companyForm.tagline || ''} 
                    onChange={(e) => setCompanyForm({ ...companyForm, tagline: e.target.value })} 
                    className="!bg-white !border-slate-300 !text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Office Address</label>
                <Input 
                  value={companyForm.officeAddress || ''} 
                  onChange={(e) => setCompanyForm({ ...companyForm, officeAddress: e.target.value })} 
                  className="!bg-white !border-slate-300 !text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Phone Number</label>
                  <Input 
                    value={companyForm.phoneNumbers?.[0] || ''} 
                    onChange={(e) => setCompanyForm({ ...companyForm, phoneNumbers: [e.target.value] })} 
                    className="!bg-white !border-slate-300 !text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Support Email</label>
                  <Input 
                    value={companyForm.emailAddresses?.[0] || ''} 
                    onChange={(e) => setCompanyForm({ ...companyForm, emailAddresses: [e.target.value] })} 
                    className="!bg-white !border-slate-300 !text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Working Hours</label>
                  <Input 
                    value={companyForm.workingHours || ''} 
                    onChange={(e) => setCompanyForm({ ...companyForm, workingHours: e.target.value })} 
                    className="!bg-white !border-slate-300 !text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Line</label>
                  <Input 
                    value={companyForm.emergencyContact || ''} 
                    onChange={(e) => setCompanyForm({ ...companyForm, emergencyContact: e.target.value })} 
                    className="!bg-white !border-slate-300 !text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={saveCompanyMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm"
                >
                  {saveCompanyMutation.isPending ? 'Saving...' : 'Save Company Details'}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* --- TAB 5: NAVIGATION MENU CMS --- */}
      {activeTab === 'navigation' && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
          <h2 className="font-bold text-lg text-slate-900 flex items-center space-x-2">
            <MenuIcon className="w-5 h-5 text-brand-primary" />
            <span>Dynamic Navigation Menus</span>
          </h2>

          {navLoading ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-primary" /></div>
          ) : (
            <div className="space-y-6">
              {navForm.map((menu: any, menuIdx: number) => (
                <div key={menu.menuLocation} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h3 className="font-bold text-sm text-brand-primary uppercase tracking-wider">
                      {menu.menuLocation} Navigation Links
                    </h3>
                    <Button
                      onClick={() => {
                        const updated = [...navForm];
                        updated[menuIdx].items.push({ label: 'New Link', path: '/new-page', isVisible: true, sortOrder: updated[menuIdx].items.length + 1 });
                        setNavForm(updated);
                      }}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Menu Item</span>
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {menu.items.map((item: any, itemIdx: number) => (
                      <div key={itemIdx} className="flex items-center space-x-3 bg-slate-50 border border-slate-200 p-3 rounded-lg">
                        <Input 
                          value={item.label} 
                          onChange={(e) => {
                            const updated = [...navForm];
                            updated[menuIdx].items[itemIdx].label = e.target.value;
                            setNavForm(updated);
                          }}
                          className="!bg-white !border-slate-300 !text-slate-900 text-xs w-48"
                          placeholder="Label"
                        />
                        <Input 
                          value={item.path} 
                          onChange={(e) => {
                            const updated = [...navForm];
                            updated[menuIdx].items[itemIdx].path = e.target.value;
                            setNavForm(updated);
                          }}
                          className="!bg-white !border-slate-300 !text-slate-900 text-xs flex-grow"
                          placeholder="Path (e.g. /workspaces)"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...navForm];
                            updated[menuIdx].items[itemIdx].isVisible = !updated[menuIdx].items[itemIdx].isVisible;
                            setNavForm(updated);
                          }}
                          className={`p-2 rounded-lg text-xs font-bold flex items-center space-x-1 ${
                            item.isVisible ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {item.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...navForm];
                            updated[menuIdx].items.splice(itemIdx, 1);
                            setNavForm(updated);
                          }}
                          className="p-2 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={() => saveNavMutation.mutate(menu)}
                      disabled={saveNavMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm"
                    >
                      Save {menu.menuLocation} Menu
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
