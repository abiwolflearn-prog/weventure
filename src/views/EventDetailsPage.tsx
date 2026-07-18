import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Tag, 
  ArrowLeft, 
  Share2, 
  Download, 
  ShieldAlert, 
  Info, 
  User, 
  Star, 
  CheckCircle,
  Copy,
  Clock,
  ExternalLink,
  MessageSquare,
  ThumbsUp,
  Award
} from 'lucide-react';
import { axiosInstance } from '../lib/axiosInstance';
import { Button } from '../components/Button';
import { motion } from 'framer-motion';

export default function EventDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recommendations
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Reviews input states
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Social Share State
  const [copiedLink, setCopiedLink] = useState(false);

  // Following state (linked with localStorage)
  const [isFollowing, setIsFollowing] = useState(false);

  // Fetch detailed event
  const fetchEventData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get(`/public/events/slug/${slug}`);
      const data = res.data.data;
      setEvent(data);

      // Check following status
      if (data?.organizer?.id) {
        const followingList = JSON.parse(localStorage.getItem('weventurehub_following') || '[]');
        setIsFollowing(followingList.includes(data.organizer.id));
      }

      // Fetch recommended events
      if (data) {
        const recRes = await axiosInstance.get('/public/events/recommendations', {
          params: { eventId: data.id, category: data.category, limit: 3 }
        });
        setRecommendations(recRes.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to load event details:', err);
      setError('Event not found or has been unpublished by the host.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [slug]);

  // SEO: Dynamic Meta Tags and JSON-LD Structured Data
  useEffect(() => {
    if (!event) return;

    // 1. Dynamic Title
    document.title = event.seo?.metaTitle || `${event.title} | Public Event Marketplace`;

    // 2. Dynamic Description & Keywords
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', event.seo?.metaDescription || event.description);

    // 3. Structured Data injection
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": event.title,
      "startDate": event.schedule?.startDate,
      "endDate": event.schedule?.endDate,
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "eventStatus": "https://schema.org/EventScheduled",
      "location": {
        "@type": "Place",
        "name": event.organizer?.name || "Premium Venue",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Workspace Hub, Central Business District",
          "addressLocality": "Downtown",
          "addressRegion": "Global Metro",
          "addressCountry": "US"
        }
      },
      "image": [
        event.media?.bannerUrl
      ],
      "description": event.description,
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "USD",
        "lowPrice": event.tickets?.length > 0 ? Math.min(...event.tickets.map((t: any) => t.price)) : 0,
        "highPrice": event.tickets?.length > 0 ? Math.max(...event.tickets.map((t: any) => t.price)) : 0,
        "offerCount": event.tickets?.length || 0
      },
      "organizer": {
        "@type": "Organization",
        "name": event.organizer?.name || "WeVentureHub Partner",
        "url": window.location.origin
      }
    };

    const scriptId = 'event-structured-data';
    let scriptTag = document.getElementById(scriptId);
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptTag);
    }
    scriptTag.innerHTML = JSON.stringify(structuredData);

    return () => {
      // Clean up metadata elements
      const tag = document.getElementById(scriptId);
      if (tag) tag.remove();
    };
  }, [event]);

  // Toggle organizer follow status
  const handleFollowToggle = () => {
    if (!event?.organizer?.id) return;
    const followingList = JSON.parse(localStorage.getItem('weventurehub_following') || '[]');
    let newList;
    if (isFollowing) {
      newList = followingList.filter((id: string) => id !== event.organizer.id);
      setIsFollowing(false);
    } else {
      newList = [...followingList, event.organizer.id];
      setIsFollowing(true);
    }
    localStorage.setItem('weventurehub_following', JSON.stringify(newList));
  };

  // Submit dynamic review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName || !reviewerEmail || !comment) return;

    try {
      setReviewSubmitting(true);
      await axiosInstance.post(`/public/events/${event.id}/reviews`, {
        reviewerName,
        reviewerEmail,
        rating,
        comment
      });
      setReviewSuccess(true);
      setReviewerName('');
      setReviewerEmail('');
      setComment('');
      setRating(5);
      
      // Refresh event reviews
      fetchEventData();
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Export event to calendar format (.ics file download)
  const handleCalendarExport = () => {
    if (!event) return;

    const start = new Date(event.schedule?.startDate).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const end = new Date(event.schedule?.endDate).toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//WeVentureHub//Multi-Tenant SaaS//EN",
      "BEGIN:VEVENT",
      `UID:${event.id}@weventurehub.com`,
      `DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d\d\d/g, "")}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`,
      `LOCATION:${event.organizer?.name || "Corporate Hub Center"}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `${event.slug}-invite.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy details link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="text-center py-32 space-y-4 max-w-xl mx-auto text-white">
        <Clock className="w-8 h-8 animate-spin text-brand-accent mx-auto" />
        <p className="text-sm font-semibold text-neutral-slate-400">Retrieving secure event blueprints...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6 text-white bg-[#111111]">
        <div className="w-12 h-12 rounded-full bg-rose-950/80 text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display font-bold text-xl text-white">Event Unavailable</h1>
          <p className="text-xs text-neutral-slate-400 leading-relaxed">{error || 'This public event could not be verified.'}</p>
        </div>
        <Link to="/events">
          <Button variant="success" className="text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-2" />
            <span>Return to Event Discovery</span>
          </Button>
        </Link>
      </div>
    );
  }

  const startDateFormatted = new Date(event.schedule?.startDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const startTimeFormatted = new Date(event.schedule?.startDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const endTimeFormatted = new Date(event.schedule?.endDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-[#111111] min-h-screen py-8 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation back and header */}
        <div className="flex items-center justify-between">
          <Link to="/events" className="text-xs font-bold text-neutral-slate-400 hover:text-brand-accent transition flex items-center space-x-1.5">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Event Discovery</span>
          </Link>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyLink}
              className="p-2 bg-[#181818] border border-neutral-800 rounded-xl hover:border-neutral-700 transition-all text-neutral-slate-300 flex items-center space-x-1.5 text-xs font-bold"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={handleCalendarExport}
              className="p-2 bg-[#181818] border border-neutral-800 rounded-xl hover:border-neutral-700 transition-all text-neutral-slate-300 flex items-center space-x-1.5 text-xs font-bold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main info panel */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#181818] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
              
              {/* Event Image */}
              <div className="aspect-video bg-neutral-900 relative">
                {event.media?.bannerUrl ? (
                  <img
                    src={event.media.bannerUrl}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-brand-accent/5 text-brand-accent">
                    <Calendar className="w-14 h-14" />
                  </div>
                )}
                <span className="absolute bottom-4 left-4 px-3 py-1.5 bg-neutral-900/90 backdrop-blur-md text-brand-accent text-[11px] font-black rounded-lg uppercase tracking-wider">
                  {event.category}
                </span>
              </div>

              {/* Event Meta Content */}
              <div className="p-6 md:p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {event.tags?.map((tag: string) => (
                      <span key={tag} className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 text-neutral-slate-400 rounded-lg text-[10px] font-bold">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <h1 className="font-display font-extrabold text-2xl md:text-3.5xl text-white tracking-tight leading-tight">
                    {event.title}
                  </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b border-neutral-800 py-6">
                  <div className="flex items-start space-x-3 text-xs">
                    <Calendar className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                    <div>
                      <span className="block font-bold text-white">{startDateFormatted}</span>
                      <span className="text-neutral-slate-400 font-medium">Time: {startTimeFormatted} - {endTimeFormatted} ({event.schedule?.timezone || 'UTC'})</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 text-xs">
                    <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="block font-bold text-white">Workspace Venue Location</span>
                      <span className="text-neutral-slate-400 font-medium">{event.organizer?.name || "Corporate Host"}, Room A</span>
                    </div>
                  </div>
                </div>

                {/* About event details */}
                <div className="space-y-3">
                  <h3 className="font-display font-bold text-lg text-white">About this Experience</h3>
                  <div className="text-xs text-neutral-slate-300 leading-relaxed whitespace-pre-line">
                    {event.description}
                  </div>
                </div>

                {/* Multi-Sessions Section */}
                {event.sessions && event.sessions.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-neutral-800">
                    <h3 className="font-display font-bold text-lg text-white flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-brand-accent" />
                      <span>Experience Itinerary ({event.sessions.length} sessions)</span>
                    </h3>
                    <div className="space-y-3">
                      {event.sessions.map((sess: any, idx: number) => {
                        const sDate = new Date(sess.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const eDate = new Date(sess.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                          <div key={sess._id || idx} className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-white">{sess.title}</span>
                              <span className="text-[10px] font-mono font-bold text-brand-accent px-2 py-0.5 bg-brand-accent/10 rounded">
                                {sDate} - {eDate}
                              </span>
                            </div>
                            {sess.description && (
                              <p className="text-[11px] text-neutral-slate-400">{sess.description}</p>
                            )}
                            {sess.location && (
                              <span className="text-[10px] text-neutral-slate-500 font-semibold block mt-1">📌 {sess.location}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Event Reviews Section */}
            <div className="bg-[#181818] border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-white">Attendee Reviews</h3>
                  <p className="text-xs text-neutral-slate-400">Read verified reviews or submit your experience.</p>
                </div>

                <div className="text-right">
                  <div className="flex items-center space-x-1 justify-end text-amber-500">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="font-extrabold text-lg text-white">{event.reviewStats?.averageRating || '5.0'}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-neutral-slate-400 block">{event.reviewStats?.totalReviews || 0} reviews</span>
                </div>
              </div>

              {/* Submit Review form */}
              <form onSubmit={handleReviewSubmit} className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-neutral-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <MessageSquare className="w-4 h-4 text-brand-accent" />
                  <span>Write Review</span>
                </h4>

                {reviewSuccess && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-900 text-emerald-400 rounded-xl text-xs font-medium flex items-center space-x-2">
                    <CheckCircle className="w-4.5 h-4.5" />
                    <span>Review successfully recorded! Thanks for sharing.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-slate-400 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jean Dupont"
                      value={reviewerName}
                      onChange={e => setReviewerName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-800 bg-[#181818] text-white focus:border-brand-accent focus:ring-brand-accent/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-slate-400 mb-1">Email Address (Kept Private)</label>
                    <input
                      type="type"
                      required
                      placeholder="jean.dupont@company.com"
                      value={reviewerEmail}
                      onChange={e => setReviewerEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-800 bg-[#181818] text-white focus:border-brand-accent focus:ring-brand-accent/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-slate-400 mb-1.5">Experience Rating</label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="text-amber-500 hover:scale-110 transition"
                      >
                        <Star className={`w-6 h-6 ${star <= rating ? 'fill-current' : 'text-neutral-700'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-slate-400 mb-1">Your Comment</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Tell us about the speakers, topic, or venue accommodations..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-800 bg-[#181818] text-white focus:border-brand-accent focus:ring-brand-accent/20"
                  />
                </div>

                <Button type="submit" variant="success" isLoading={reviewSubmitting} className="text-xs font-bold py-2">
                  Post My Review
                </Button>
              </form>

              {/* Reviews Feed */}
              <div className="space-y-4 divide-y divide-neutral-800">
                {event.reviews && event.reviews.length > 0 ? (
                  event.reviews.map((rev: any) => (
                    <div key={rev.id} className="pt-4 flex items-start space-x-3 text-xs">
                      <div className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-neutral-slate-400" />
                      </div>
                      <div className="space-y-1 flex-grow">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{rev.reviewerName}</span>
                          <span className="text-[10px] text-neutral-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-0.5 text-amber-500 py-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-neutral-800'}`} />
                          ))}
                        </div>
                        <p className="text-neutral-slate-300 leading-relaxed font-light">{rev.comment}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-slate-400 text-center py-6">No reviews submitted yet for this experience. Be the first!</p>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar - tickets and organization */}
          <div className="space-y-6">
            
            {/* Admissions Board */}
            <div className="bg-[#181818] border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-6">
              <div>
                <h3 className="font-display font-extrabold text-lg text-white">Get Admissions Tickets</h3>
                <p className="text-[11px] text-neutral-slate-400">Select an entrance tier and register your corporate profile.</p>
              </div>

              <div className="space-y-4">
                {event.tickets && event.tickets.length > 0 ? (
                  event.tickets.map((ticket: any) => (
                    <div key={ticket.id} className="p-4 border border-neutral-800 rounded-2xl space-y-3 bg-neutral-900">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-white text-xs">{ticket.name}</span>
                        <span className="font-mono font-black text-brand-accent text-sm">
                          {ticket.price === 0 ? 'Free' : `$${ticket.price} ${ticket.currency || 'USD'}`}
                        </span>
                      </div>
                      {ticket.description && (
                        <p className="text-[10px] text-neutral-slate-400">{ticket.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-slate-400 font-mono">
                        <span>Min: {ticket.settings?.minOrderQty || 1} • Max: {ticket.settings?.maxOrderQty || 10}</span>
                        <span>
                          {ticket.capacity?.isUnlimited ? 'Unlimited Capacity' : `Only ${ticket.capacity?.maxQuantity - ticket.capacity?.soldQuantity} left`}
                        </span>
                      </div>

                      <Button
                        onClick={() => navigate(`/login?eventId=${event.id}&ticketId=${ticket.id}`)}
                        variant="success"
                        className="w-full text-xs font-bold py-2"
                      >
                        Book Admission
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-4 border border-dashed border-neutral-800 rounded-2xl text-center space-y-2 bg-neutral-900/30">
                    <span className="text-brand-accent font-bold uppercase text-xs tracking-wider">Free Direct Entrance</span>
                    <p className="text-[10px] text-neutral-slate-400">This experience does not require specific tickets. Simply join us on schedule!</p>
                    <Button
                      onClick={() => navigate('/login')}
                      variant="success"
                      className="w-full text-xs font-bold mt-2"
                    >
                      Register My Attendance
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Organizer Profile Card */}
            {event.organizer && event.organizer.id !== 'weventurehub' && (
              <div className="bg-[#181818] border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 overflow-hidden shrink-0 flex items-center justify-center text-brand-accent font-bold border border-brand-accent/20">
                    {event.organizer.branding?.logoUrl ? (
                      <img 
                        src={event.organizer.branding.logoUrl} 
                        alt={event.organizer.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      event.organizer.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-slate-400 font-bold uppercase tracking-wider block font-mono">Presented By</span>
                    <Link to={`/organizers/${event.organizer.id}`} className="font-display font-bold text-white hover:text-brand-accent transition">
                      {event.organizer.name}
                    </Link>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-slate-300 leading-relaxed line-clamp-3">
                  {event.organizer.description || 'Enterprise operator coordinating workspaces, boardroom reservations, and premium corporate events.'}
                </p>

                <div className="pt-2 flex items-center space-x-2">
                  <button
                    onClick={handleFollowToggle}
                    className={`w-full py-2 text-xs font-bold rounded-xl border transition-all ${
                      isFollowing
                        ? 'bg-neutral-850 border-neutral-700 text-neutral-300'
                        : 'bg-brand-accent border-brand-accent text-neutral-900 hover:opacity-90 font-black'
                    }`}
                  >
                    {isFollowing ? 'Following Organizer' : 'Follow Organizer'}
                  </button>
                  <Link 
                    to={`/organizers/${event.organizer.id}`}
                    className="p-2 bg-neutral-900 border border-neutral-800 text-neutral-slate-400 rounded-xl hover:bg-neutral-800 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* Platform Standard */}
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-sm space-y-2 text-neutral-slate-300">
              <span className="text-[10px] font-black tracking-widest text-brand-accent uppercase font-mono">Secure Sandbox</span>
              <p className="text-[11px] text-neutral-slate-400 font-light leading-relaxed">
                Tickets purchased are issued directly within our isolated multi-tenant network database. Your data stays private.
              </p>
            </div>

          </div>
        </div>

        {/* Recommended Events Panel */}
        {recommendations.length > 0 && (
          <div className="space-y-6 pt-6">
            <h3 className="font-display font-extrabold text-xl text-white">You Might Also Like</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec) => {
                const recDate = new Date(rec.schedule?.startDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });

                return (
                  <Link
                    to={`/events/${rec.slug}`}
                    key={rec.id}
                    className="group bg-[#181818] border border-neutral-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg hover:border-brand-accent/45 hover:scale-[1.01] transition duration-300 flex flex-col h-full"
                  >
                    <div className="aspect-video bg-neutral-900 overflow-hidden relative">
                      {rec.media?.bannerUrl ? (
                        <img
                          src={rec.media.bannerUrl}
                          alt={rec.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-brand-accent/5 text-brand-accent">
                          <Calendar className="w-8 h-8" />
                        </div>
                      )}
                      <span className="absolute top-3 left-3 px-2 py-0.5 bg-neutral-900/80 backdrop-blur-md text-brand-accent text-[9px] font-black rounded-lg uppercase tracking-wider border border-brand-accent/20">
                        {rec.category}
                      </span>
                    </div>

                    <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-neutral-slate-400 block">{recDate}</span>
                        <h4 className="font-display font-bold text-sm text-white group-hover:text-brand-accent transition truncate">
                          {rec.title}
                        </h4>
                      </div>
                      <span className="text-[11px] font-bold text-brand-accent flex items-center">
                        <span>View Details</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
