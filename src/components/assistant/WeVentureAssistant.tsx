import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  X,
  Send,
  Globe,
  Sparkles,
  User,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  Maximize2,
  Minimize2,
  Calendar,
  Building2,
  HelpCircle,
  FileText,
  Rocket,
  Headphones,
  RefreshCw,
  MessageSquare,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { assistantApi, IAssistantMessage } from '../../lib/assistantApi';
import { useAppSelector } from '../../store';
import { getSocket } from '../../lib/socket';

export default function WeVentureAssistant() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  // Widget States
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [language, setLanguage] = useState<'en' | 'am' | 'om'>('en');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Chat States
  const [sessionId, setSessionId] = useState<string>(() => {
    return localStorage.getItem('weventure_assistant_session') || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  });
  const [messages, setMessages] = useState<IAssistantMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Ticket Form States
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketEmail, setTicketEmail] = useState(user?.email || '');
  const [ticketName, setTicketName] = useState(user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '');
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save Session ID
  useEffect(() => {
    localStorage.setItem('weventure_assistant_session', sessionId);
  }, [sessionId]);

  // Initial welcome message & Load History
  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await assistantApi.getHistory(sessionId);
        if (data?.conversation?.messages && data.conversation.messages.length > 0) {
          setMessages(data.conversation.messages);
        } else {
          // Default Brand Initial Greeting
          setMessages([
            {
              sender: 'assistant',
              text: getGreetingText('en'),
              language: 'en',
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        setMessages([
          {
            sender: 'assistant',
            text: getGreetingText('en'),
            language: 'en',
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    }
    loadHistory();
  }, [sessionId]);

  // Listen to Socket.io real-time assistant responses if available
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.on('assistant-message', (data: any) => {
        if (data?.message && data.message.sender !== 'user') {
          setMessages((prev) => [...prev, data.message]);
          setIsTyping(false);
        }
      });
      return () => {
        socket.off('assistant-message');
      };
    }
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const getGreetingText = (lang: 'en' | 'am' | 'om') => {
    if (lang === 'am') {
      return '👋 እንኳን ወደ WeVentureHub በደህና መጡ! እኔ WeVenture Assistant ነኝ። የስራ ቦታዎችን ለመያዝ፣ ለክስተቶች ለመመዝገብ፣ ደረሰኞችን ለመረዳት እና ጥያቄዎችዎን ለመመለስ እረዳዎታለሁ። ዛሬ እንዴት ልረዳዎት?';
    }
    if (lang === 'om') {
      return '👋 Baga nagaan gara WeVentureHub dhuftan! Ani WeVenture Assistant dha. Iddoo hojii qabachuuf, sagantaawwan irratti galmaa\'uuf, kaffaltii fi kaffaltiiwwan hubachuuf isin gargaaru nan danda\'a. Arra maaliin isin gargaaru?';
    }
    return "👋 Welcome to WeVentureHub! I'm WeVenture Assistant. I can help you book workspaces, register for events, explain invoices and agreements, and guide you through our services. How can I help you today?";
  };

  const handleLanguageChange = (newLang: 'en' | 'am' | 'om') => {
    setLanguage(newLang);
    setShowLanguageDropdown(false);
    // Add system message acknowledging language shift
    const systemNotice: IAssistantMessage = {
      sender: 'assistant',
      text: getGreetingText(newLang),
      language: newLang,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, systemNotice]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg: IAssistantMessage = {
      sender: 'user',
      text: query.trim(),
      language,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const data = await assistantApi.sendMessage(sessionId, query.trim(), language);
      setIsTyping(false);
      if (data?.reply) {
        setMessages((prev) => [...prev, data.reply]);
      }
    } catch (err) {
      setIsTyping(false);
      const errorReply: IAssistantMessage = {
        sender: 'assistant',
        text: 'I apologize, I am experiencing a temporary connection issue. You can click below to connect with a human support specialist directly!',
        language,
        timestamp: new Date().toISOString(),
        actions: [
          {
            type: 'SUPPORT_TICKET',
            label: 'Connect with Human Specialist',
          },
        ],
      };
      setMessages((prev) => [...prev, errorReply]);
    }
  };

  const handleFeedback = async (messageIndex: number, rating: 'thumbs_up' | 'thumbs_down') => {
    try {
      await assistantApi.submitFeedback(sessionId, rating === 'thumbs_up' ? 5 : 1);
      setMessages((prev) =>
        prev.map((msg, idx) => {
          if (idx === messageIndex) {
            return {
              ...msg,
              feedback: { rating },
            };
          }
          return msg;
        })
      );
    } catch (e) {
      // Ignore
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await assistantApi.createSupportTicket({
        sessionId,
        name: ticketName,
        email: ticketEmail,
        subject: ticketSubject || 'Assistant Handoff Request',
        message: ticketMessage || 'User requested human operator review from AI Assistant chat widget.',
      });
      setTicketSuccess(`Support Ticket created successfully! Ticket ID: ${res.ticketNumber}`);
      setTimeout(() => {
        setShowTicketModal(false);
        setTicketSuccess(null);
      }, 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit support ticket');
    }
  };

  const clearChat = () => {
    const newSess = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setSessionId(newSess);
    setMessages([
      {
        sender: 'assistant',
        text: getGreetingText(language),
        language,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <>
      {/* 1. Floating Action Widget Launcher */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end pointer-events-auto">
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="relative group"
            >
              {/* Unread badge / Welcome pill */}
              {hasUnread && (
                <div className="absolute -top-12 right-0 bg-neutral-slate-900 text-white text-xs px-3 py-1.5 rounded-full shadow-lg border border-neutral-slate-700 flex items-center gap-1.5 whitespace-nowrap animate-bounce">
                  <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Ask WeVenture AI</span>
                  <span className="w-2 h-2 rounded-full bg-brand-primary animate-ping" />
                </div>
              )}

              <button
                onClick={() => {
                  setIsOpen(true);
                  setHasUnread(false);
                }}
                className="relative w-12 h-12 sm:w-14 sm:h-14 bg-neutral-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-black transition-all transform hover:scale-105 border-2 border-brand-primary cursor-pointer group"
                title="Open WeVenture Assistant"
                id="weventure-assistant-launcher"
              >
                <div className="relative">
                  <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-brand-primary group-hover:rotate-12 transition-transform" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-brand-primary rounded-full border-2 border-neutral-slate-900" />
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Main Chat Window Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`bg-white shadow-2xl overflow-hidden flex flex-col transition-all duration-300 z-[60] ${
                isExpanded
                  ? 'fixed inset-2 sm:inset-6 md:inset-10 w-auto h-auto max-w-5xl mx-auto rounded-2xl border border-neutral-slate-200'
                  : 'fixed bottom-0 right-0 left-0 sm:left-auto sm:bottom-6 sm:right-6 w-full sm:w-[420px] h-[85vh] sm:h-[600px] max-h-[90vh] rounded-t-2xl sm:rounded-2xl border-t sm:border border-neutral-slate-200'
              }`}
            >
              {/* Header Bar */}
              <div className="bg-neutral-slate-900 text-white px-4 py-3.5 flex items-center justify-between border-b border-neutral-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-9 h-9 rounded-xl bg-neutral-slate-800 flex items-center justify-center border border-neutral-slate-700">
                    <Bot className="w-5 h-5 text-brand-primary" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-brand-primary rounded-full border-2 border-neutral-slate-900" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-display font-semibold text-sm text-white">WeVenture Assistant</h3>
                      <span className="bg-brand-primary/20 text-brand-primary text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                        AI
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-slate-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                      Online • Grounded with WeVentureHub DB
                    </p>
                  </div>
                </div>

                {/* Right Header Action Icons */}
                <div className="flex items-center gap-1">
                  {/* Multilingual Selector */}
                  <div className="relative">
                    <button
                      onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                      className="p-1.5 text-neutral-slate-400 hover:text-white rounded-lg hover:bg-neutral-slate-800 text-xs flex items-center gap-1 cursor-pointer"
                      title="Switch Language"
                    >
                      <Globe className="w-4 h-4 text-brand-primary" />
                      <span className="uppercase text-[11px] font-medium">{language}</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {showLanguageDropdown && (
                      <div className="absolute right-0 mt-1 w-36 bg-neutral-slate-800 border border-neutral-slate-700 rounded-xl shadow-xl py-1 z-50 text-xs">
                        <button
                          onClick={() => handleLanguageChange('en')}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-neutral-slate-700 ${
                            language === 'en' ? 'text-brand-primary font-bold' : 'text-neutral-slate-300'
                          }`}
                        >
                          <span>🇬🇧 English</span>
                          {language === 'en' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleLanguageChange('am')}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-neutral-slate-700 ${
                            language === 'am' ? 'text-brand-primary font-bold' : 'text-neutral-slate-300'
                          }`}
                        >
                          <span>🇪🇹 አማርኛ (Amharic)</span>
                          {language === 'am' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleLanguageChange('om')}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-neutral-slate-700 ${
                            language === 'om' ? 'text-brand-primary font-bold' : 'text-neutral-slate-300'
                          }`}
                        >
                          <span>🇪🇹 Afaan Oromoo</span>
                          {language === 'om' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={clearChat}
                    className="p-1.5 text-neutral-slate-400 hover:text-white rounded-lg hover:bg-neutral-slate-800 transition-colors"
                    title="Reset Chat Session"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1.5 text-neutral-slate-400 hover:text-white rounded-lg hover:bg-neutral-slate-800 transition-colors hidden sm:block"
                    title={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-neutral-slate-400 hover:text-white rounded-lg hover:bg-neutral-slate-800 transition-colors"
                    title="Close Assistant"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-neutral-slate-50/50 text-sm">
                {messages.map((msg, index) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-8 h-8 rounded-full bg-neutral-slate-900 text-brand-primary flex items-center justify-center shrink-0 border border-neutral-slate-700 mt-1">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div className={`max-w-[82%] ${isUser ? 'order-1' : 'order-2'}`}>
                        <div
                          className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-xs ${
                            isUser
                              ? 'bg-neutral-slate-900 text-white rounded-br-none'
                              : 'bg-white border border-neutral-slate-200 text-neutral-slate-900 rounded-bl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>

                          {/* Interactive Action Cards */}
                          {msg.actions && msg.actions.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-neutral-slate-100 flex flex-col gap-2">
                              {msg.actions.map((act, aIdx) => (
                                <button
                                  key={aIdx}
                                  onClick={() => {
                                    if (act.type === 'BOOK_WORKSPACE') {
                                      navigate('/workspaces');
                                      setIsOpen(false);
                                    } else if (act.type === 'REGISTER_EVENT') {
                                      navigate('/events');
                                      setIsOpen(false);
                                    } else if (act.type === 'SUPPORT_TICKET') {
                                      setShowTicketModal(true);
                                    } else if (act.type === 'PAYMENT_HELP') {
                                      handleSendMessage('Explain payment methods and invoices');
                                    }
                                  }}
                                  className="w-full text-left bg-brand-primary/10 hover:bg-brand-primary/20 text-neutral-slate-900 border border-brand-primary/30 font-medium px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all group/btn cursor-pointer"
                                >
                                  <span className="flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                                    {act.label || 'Take Action'}
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 text-brand-primary group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Timestamp & Feedback toolbar */}
                        <div
                          className={`flex items-center gap-2 mt-1 text-[10px] text-neutral-slate-400 ${
                            isUser ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {!isUser && (
                            <div className="flex items-center gap-1.5 ml-1">
                              <button
                                onClick={() => handleFeedback(index, 'thumbs_up')}
                                className={`hover:text-brand-primary ${
                                  msg.feedback?.rating === 'thumbs_up' ? 'text-brand-primary' : ''
                                }`}
                                title="Helpful"
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleFeedback(index, 'thumbs_down')}
                                className={`hover:text-red-500 ${
                                  msg.feedback?.rating === 'thumbs_down' ? 'text-red-500' : ''
                                }`}
                                title="Not helpful"
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {isUser && (
                        <div className="w-8 h-8 rounded-full bg-brand-primary text-neutral-slate-900 font-bold flex items-center justify-center shrink-0 mt-1">
                          {user?.firstName?.[0] || <User className="w-4 h-4" />}
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {/* AI Typing Animation */}
                {isTyping && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-neutral-slate-900 text-brand-primary flex items-center justify-center shrink-0 border border-neutral-slate-700">
                      <Bot className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-white border border-neutral-slate-200 text-neutral-slate-500 p-3 rounded-2xl rounded-bl-none flex items-center gap-1.5 text-xs">
                      <span>WeVenture Assistant is typing</span>
                      <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Starters */}
              <div className="px-3 py-2 bg-white border-t border-neutral-slate-100 overflow-x-auto whitespace-nowrap flex gap-1.5 no-scrollbar">
                <button
                  onClick={() => handleSendMessage('Find available hot desks and meeting rooms')}
                  className="px-2.5 py-1 bg-neutral-slate-100 hover:bg-neutral-slate-200 text-neutral-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                >
                  <Building2 className="w-3 h-3 text-brand-primary" />
                  Workspaces
                </button>
                <button
                  onClick={() => handleSendMessage('Show me upcoming startup events and workshops')}
                  className="px-2.5 py-1 bg-neutral-slate-100 hover:bg-neutral-slate-200 text-neutral-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                >
                  <Calendar className="w-3 h-3 text-brand-primary" />
                  Events
                </button>
                <button
                  onClick={() => handleSendMessage('Explain startup programs and incubation tracks')}
                  className="px-2.5 py-1 bg-neutral-slate-100 hover:bg-neutral-slate-200 text-neutral-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                >
                  <Rocket className="w-3 h-3 text-brand-primary" />
                  Startups
                </button>
                {isAuthenticated && (
                  <button
                    onClick={() => handleSendMessage('Show my bookings and unpaid invoices')}
                    className="px-2.5 py-1 bg-neutral-slate-100 hover:bg-neutral-slate-200 text-neutral-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                  >
                    <FileText className="w-3 h-3 text-brand-primary" />
                    My Account
                  </button>
                )}
                <button
                  onClick={() => setShowTicketModal(true)}
                  className="px-2.5 py-1 bg-brand-primary/10 hover:bg-brand-primary/20 text-neutral-slate-900 border border-brand-primary/30 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                >
                  <Headphones className="w-3 h-3 text-brand-primary" />
                  Human Support
                </button>
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-white border-t border-neutral-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={
                    language === 'am'
                      ? 'እባክዎን ጥያቄዎን እዚህ ይጻፉ...'
                      : language === 'om'
                      ? 'Gaaffii keessan asitti barreessaa...'
                      : 'Ask about workspaces, events, pricing...'
                  }
                  className="flex-1 bg-neutral-slate-100 text-neutral-slate-900 text-sm px-3.5 py-2.5 rounded-xl border border-transparent focus:border-brand-primary focus:bg-white focus:outline-none transition-all"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim()}
                  className="p-2.5 bg-neutral-slate-900 text-brand-primary hover:bg-black rounded-xl disabled:opacity-40 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Support Ticket / Human Handoff Modal */}
      <AnimatePresence>
        {showTicketModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-slate-200 relative"
            >
              <button
                onClick={() => setShowTicketModal(false)}
                className="absolute top-4 right-4 text-neutral-slate-400 hover:text-neutral-slate-900"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/20 text-brand-primary-hover flex items-center justify-center">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-neutral-slate-900">Request Human Support</h3>
                  <p className="text-xs text-neutral-slate-500">Connect directly with a WeVentureHub specialist</p>
                </div>
              </div>

              {ticketSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{ticketSuccess}</span>
                </div>
              ) : (
                <form onSubmit={handleCreateTicket} className="space-y-3.5 text-sm">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-slate-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={ticketName}
                      onChange={(e) => setTicketName(e.target.value)}
                      placeholder="e.g. Abebe Bikila"
                      className="w-full px-3 py-2 rounded-lg border border-neutral-slate-200 focus:border-brand-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-slate-700 mb-1">Your Email</label>
                    <input
                      type="email"
                      required
                      value={ticketEmail}
                      onChange={(e) => setTicketEmail(e.target.value)}
                      placeholder="abebe@example.com"
                      className="w-full px-3 py-2 rounded-lg border border-neutral-slate-200 focus:border-brand-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-slate-700 mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="e.g. Custom Office Pricing Inquiry"
                      className="w-full px-3 py-2 rounded-lg border border-neutral-slate-200 focus:border-brand-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-slate-700 mb-1">Message Details</label>
                    <textarea
                      rows={3}
                      required
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="How can our human support team assist you?"
                      className="w-full px-3 py-2 rounded-lg border border-neutral-slate-200 focus:border-brand-primary outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-neutral-slate-900 hover:bg-black text-white font-semibold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4 text-brand-primary" />
                    <span>Submit Support Ticket</span>
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
