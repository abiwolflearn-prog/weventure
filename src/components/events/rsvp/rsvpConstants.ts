import { 
  Type, 
  AlignLeft, 
  AtSign, 
  Phone, 
  Hash, 
  Calendar, 
  Clock, 
  ChevronDown, 
  List, 
  CheckSquare, 
  CircleDot, 
  ToggleLeft, 
  FileUp, 
  Image as ImageIcon, 
  Building, 
  Briefcase, 
  MapPin, 
  Heading, 
  Minus, 
  MessageSquare, 
  Star, 
  PenTool, 
  ShieldCheck, 
  FileText, 
  EyeOff, 
  Code, 
  Globe, 
  Link as LinkIcon,
  HelpCircle,
  QrCode
} from 'lucide-react';
import { IRsvpFormField, IRsvpFormAppearance } from '../../../types';

export interface FieldTypeDefinition {
  id: string;
  label: string;
  description: string;
  icon: any;
  category: 'layout' | 'basic' | 'choice' | 'advanced' | 'legal' | 'system';
  defaultLabel: string;
  defaultPlaceholder?: string;
  defaultOptions?: string[];
  supportsOptions?: boolean;
  supportsPlaceholder?: boolean;
  supportsValidation?: boolean;
}

export const FIELD_TYPE_DEFINITIONS: FieldTypeDefinition[] = [
  // 1. LAYOUT
  {
    id: 'section_title',
    label: 'Section Heading',
    description: 'Divide form into distinct topic sections',
    icon: Heading,
    category: 'layout',
    defaultLabel: 'Participant Information',
  },
  {
    id: 'paragraph',
    label: 'Description Text',
    description: 'Formatted guide or instructions for attendees',
    icon: MessageSquare,
    category: 'layout',
    defaultLabel: 'Please complete all required fields below to secure your event pass.',
  },
  {
    id: 'divider',
    label: 'Visual Divider',
    description: 'Clean visual separator between form segments',
    icon: Minus,
    category: 'layout',
    defaultLabel: '',
  },

  // 2. BASIC INFO
  {
    id: 'text',
    label: 'Single-line Text',
    description: 'Short text input for names, titles, or answers',
    icon: Type,
    category: 'basic',
    defaultLabel: 'Full Name',
    defaultPlaceholder: 'e.g. Jane Doe',
    supportsPlaceholder: true,
    supportsValidation: true,
  },
  {
    id: 'email',
    label: 'Email Address',
    description: 'Validated email input with domain verification',
    icon: AtSign,
    category: 'basic',
    defaultLabel: 'Email Address',
    defaultPlaceholder: 'jane@example.com',
    supportsPlaceholder: true,
    supportsValidation: true,
  },
  {
    id: 'phone',
    label: 'Phone Number',
    description: 'Contact number with country code support',
    icon: Phone,
    category: 'basic',
    defaultLabel: 'Phone Number',
    defaultPlaceholder: '+1 (555) 000-0000',
    supportsPlaceholder: true,
    supportsValidation: true,
  },
  {
    id: 'textarea',
    label: 'Multi-line Textarea',
    description: 'Extended notes, bios, or expectations',
    icon: AlignLeft,
    category: 'basic',
    defaultLabel: 'Special Requirements / Notes',
    defaultPlaceholder: 'Let us know any dietary or accessibility requirements...',
    supportsPlaceholder: true,
    supportsValidation: true,
  },
  {
    id: 'number',
    label: 'Numeric Input',
    description: 'Numbers only (age, group size, experience years)',
    icon: Hash,
    category: 'basic',
    defaultLabel: 'Number of Guests',
    defaultPlaceholder: '1',
    supportsPlaceholder: true,
    supportsValidation: true,
  },
  {
    id: 'date',
    label: 'Date Selector',
    description: 'Calendar date picker for arrivals or birth dates',
    icon: Calendar,
    category: 'basic',
    defaultLabel: 'Date of Arrival',
    supportsValidation: true,
  },
  {
    id: 'time',
    label: 'Time Selector',
    description: 'Clock selector for session check-in time',
    icon: Clock,
    category: 'basic',
    defaultLabel: 'Preferred Arrival Time',
    supportsValidation: true,
  },
  {
    id: 'url',
    label: 'Website / Portfolio URL',
    description: 'Validated web URL for LinkedIn, GitHub, or company site',
    icon: LinkIcon,
    category: 'basic',
    defaultLabel: 'Portfolio / LinkedIn URL',
    defaultPlaceholder: 'https://linkedin.com/in/...',
    supportsPlaceholder: true,
    supportsValidation: true,
  },

  // 3. CHOICE FIELDS
  {
    id: 'dropdown',
    label: 'Dropdown Select',
    description: 'Compact single-choice dropdown list',
    icon: ChevronDown,
    category: 'choice',
    defaultLabel: 'How did you hear about this event?',
    defaultOptions: ['WeVentureHub Community', 'Social Media', 'Colleague / Friend', 'Email Newsletter', 'Search Engine'],
    supportsOptions: true,
    supportsPlaceholder: true,
  },
  {
    id: 'radio',
    label: 'Radio Group (Single Choice)',
    description: 'Visible single-choice radio buttons',
    icon: CircleDot,
    category: 'choice',
    defaultLabel: 'Attendance Format',
    defaultOptions: ['In-Person at WeVentureHub Hall', 'Virtual Livestream'],
    supportsOptions: true,
  },
  {
    id: 'checkbox',
    label: 'Checkbox Group (Multiple Choice)',
    description: 'Select multiple items from a defined list',
    icon: CheckSquare,
    category: 'choice',
    defaultLabel: 'Topics of Interest',
    defaultOptions: ['AI & Machine Learning', 'Startup Funding & Venture Capital', 'Product Design & UX', 'Networking & Growth'],
    supportsOptions: true,
  },
  {
    id: 'multiselect',
    label: 'Multi-select Tag List',
    description: 'Tag-based searchable multi-selection',
    icon: List,
    category: 'choice',
    defaultLabel: 'Session Tracks Attending',
    defaultOptions: ['Track A: Keynote & Panels', 'Track B: Hands-on Workshops', 'Track C: Pitch Competition', 'Track D: VIP Mixer'],
    supportsOptions: true,
  },
  {
    id: 'yes_no',
    label: 'Yes / No Toggle',
    description: 'Quick binary decision switch',
    icon: ToggleLeft,
    category: 'choice',
    defaultLabel: 'Do you require a parking spot at the venue?',
    defaultOptions: ['Yes', 'No'],
    supportsOptions: true,
  },

  // 4. ADVANCED
  {
    id: 'file',
    label: 'File Upload',
    description: 'Accept resumes, pitch decks, or receipts (PDF, DOC, ZIP)',
    icon: FileUp,
    category: 'advanced',
    defaultLabel: 'Upload Resume or Pitch Deck (PDF)',
    defaultPlaceholder: 'Choose file or drag & drop (Max 10MB)',
    supportsPlaceholder: true,
    supportsValidation: true,
  },
  {
    id: 'image',
    label: 'Photo / Avatar Upload',
    description: 'Attendee headshot or badge portrait',
    icon: ImageIcon,
    category: 'advanced',
    defaultLabel: 'Upload Attendee Badge Photo',
    defaultPlaceholder: 'JPG, PNG or WEBP (Max 5MB)',
    supportsPlaceholder: true,
  },
  {
    id: 'rating',
    label: 'Rating / Scale (1-5 Stars)',
    description: 'Visual 5-star evaluation or interest rating',
    icon: Star,
    category: 'advanced',
    defaultLabel: 'Rate your prior experience level in this topic',
    supportsValidation: true,
  },
  {
    id: 'hidden',
    label: 'Hidden Field',
    description: 'Pass tracking parameters or campaign UTM tags',
    icon: EyeOff,
    category: 'system',
    defaultLabel: 'UTM Campaign Source',
    defaultPlaceholder: 'campaign_v1',
  },

  // 5. LEGAL & CONSENT
  {
    id: 'consent',
    label: 'Consent & Disclaimer Checkbox',
    description: 'Explicit confirmation for terms, photography, or rules',
    icon: ShieldCheck,
    category: 'legal',
    defaultLabel: 'I agree to the Event Code of Conduct and Media Release policy.',
  },
  {
    id: 'terms',
    label: 'Terms & Conditions Agreement',
    description: 'Formal link and acceptance of WeVentureHub policies',
    icon: FileText,
    category: 'legal',
    defaultLabel: 'I have read and accept the WeVentureHub Terms of Service and Privacy Policy.',
  },
  {
    id: 'signature',
    label: 'Digital Signature',
    description: 'Attendee signs name or draws verification mark',
    icon: PenTool,
    category: 'legal',
    defaultLabel: 'Authorized Signature',
  },

  // 6. SYSTEM & PROFESSIONAL
  {
    id: 'company',
    label: 'Company / Organization',
    description: 'Employer, startup, or institutional affiliation',
    icon: Building,
    category: 'system',
    defaultLabel: 'Company / Organization',
    defaultPlaceholder: 'e.g. Acme Innovations',
    supportsPlaceholder: true,
  },
  {
    id: 'job_title',
    label: 'Job Title / Role',
    description: 'Professional position or student status',
    icon: Briefcase,
    category: 'system',
    defaultLabel: 'Job Title / Designation',
    defaultPlaceholder: 'e.g. Founder & CEO',
    supportsPlaceholder: true,
  },
  {
    id: 'address',
    label: 'Physical Address / City',
    description: 'Location, city, or billing address',
    icon: MapPin,
    category: 'system',
    defaultLabel: 'City & Country',
    defaultPlaceholder: 'e.g. San Francisco, USA',
    supportsPlaceholder: true,
  },
];

export const FORM_TEMPLATES = [
  {
    id: 'standard_meetup',
    name: 'General Event RSVP',
    label: 'General Event RSVP',
    category: 'General',
    description: 'Essential registration form for workshops, meetups, and talks.',
    fields: [
      { id: 'f_name', type: 'text' as const, label: 'Full Name', required: true, placeholder: 'Enter your full name', width: 'full' as const },
      { id: 'f_email', type: 'email' as const, label: 'Email Address', required: true, placeholder: 'jane@example.com', width: 'half' as const },
      { id: 'f_phone', type: 'phone' as const, label: 'Phone Number', required: false, placeholder: '+1 (555) 000-0000', width: 'half' as const },
      { id: 'f_company', type: 'company' as const, label: 'Company / Organization', required: false, placeholder: 'Where do you work?', width: 'half' as const },
      { id: 'f_role', type: 'job_title' as const, label: 'Job Title', required: false, placeholder: 'Your professional role', width: 'half' as const },
      { id: 'f_consent', type: 'consent' as const, label: 'I agree to the WeVentureHub Community Code of Conduct.', required: true, width: 'full' as const }
    ]
  },
  {
    id: 'tech_summit',
    name: 'Tech Summit & Conference',
    label: 'Tech Summit & Conference',
    category: 'Conference',
    description: 'Comprehensive registration with tracks, dietary, and company details.',
    fields: [
      { id: 'sec_1', type: 'section_title' as const, label: 'Attendee Credentials', width: 'full' as const },
      { id: 'f_name', type: 'text' as const, label: 'Full Name', required: true, placeholder: 'Enter your full name', width: 'half' as const },
      { id: 'f_email', type: 'email' as const, label: 'Work Email Address', required: true, placeholder: 'jane@company.com', width: 'half' as const },
      { id: 'f_company', type: 'company' as const, label: 'Company / Organization', required: true, placeholder: 'Company name', width: 'half' as const },
      { id: 'f_job', type: 'job_title' as const, label: 'Job Title', required: true, placeholder: 'e.g. CTO / Product Lead', width: 'half' as const },
      { id: 'sec_2', type: 'section_title' as const, label: 'Preferences & Logistics', width: 'full' as const },
      { id: 'f_format', type: 'radio' as const, label: 'Attendance Mode', required: true, options: ['In-Person (VIP Pass)', 'Virtual Livestream'], width: 'full' as const },
      { id: 'f_tracks', type: 'checkbox' as const, label: 'Breakout Sessions of Interest', required: false, options: ['Cloud Architecture', 'AI & Agents', 'Cybersecurity', 'Founder Pitch Showcase'], width: 'full' as const },
      { id: 'f_dietary', type: 'dropdown' as const, label: 'Dietary Preference', required: false, options: ['No Restrictions (Standard)', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher'], width: 'full' as const },
      { id: 'f_terms', type: 'terms' as const, label: 'I agree to the Conference Terms & Conditions.', required: true, width: 'full' as const }
    ]
  },
  {
    id: 'hackathon',
    name: 'Hackathon & Builder Challenge',
    label: 'Hackathon & Builder Challenge',
    category: 'Competition',
    description: 'Technical applicant vetting with GitHub, role, and team information.',
    fields: [
      { id: 'f_name', type: 'text' as const, label: 'Full Name', required: true, placeholder: 'Jane Doe', width: 'half' as const },
      { id: 'f_email', type: 'email' as const, label: 'Email Address', required: true, placeholder: 'jane@domain.com', width: 'half' as const },
      { id: 'f_github', type: 'url' as const, label: 'GitHub / Portfolio URL', required: true, placeholder: 'https://github.com/username', width: 'full' as const },
      { id: 'f_role', type: 'dropdown' as const, label: 'Primary Developer Skillset', required: true, options: ['Full-Stack Developer', 'Frontend Engineer', 'Backend & Cloud', 'AI / ML Engineer', 'UI/UX Designer', 'Product Manager'], width: 'full' as const },
      { id: 'f_experience', type: 'rating' as const, label: 'Self-Assessed Coding Experience (1-5)', required: true, width: 'full' as const },
      { id: 'f_team', type: 'radio' as const, label: 'Team Status', required: true, options: ['I already have a formed team', 'I want to be matched into a team during kickoff'], width: 'full' as const },
      { id: 'f_rules', type: 'consent' as const, label: 'I agree to the Hackathon Official Rules and Intellectual Property Guidelines.', required: true, width: 'full' as const }
    ]
  },
  {
    id: 'investor_pitch',
    name: 'Investor Pitch & Demo Day',
    label: 'Investor Pitch & Demo Day',
    category: 'Venture',
    description: 'Tailored for founders submitting pitch decks and startup details.',
    fields: [
      { id: 'f_founder_name', type: 'text' as const, label: 'Founder Full Name', required: true, placeholder: 'Full Name', width: 'half' as const },
      { id: 'f_founder_email', type: 'email' as const, label: 'Founder Email', required: true, placeholder: 'founder@startup.com', width: 'half' as const },
      { id: 'f_startup_name', type: 'company' as const, label: 'Startup Name', required: true, placeholder: 'e.g. NextGen Robotics', width: 'half' as const },
      { id: 'f_stage', type: 'dropdown' as const, label: 'Current Funding Stage', required: true, options: ['Pre-Seed / Bootstrapped', 'Seed ($500k - $2M)', 'Series A ($2M - $10M)', 'Growth / Series B+'], width: 'half' as const },
      { id: 'f_website', type: 'url' as const, label: 'Company Website / Pitch Deck URL', required: true, placeholder: 'https://startup.com', width: 'full' as const },
      { id: 'f_pitch_deck', type: 'file' as const, label: 'Upload Pitch Deck (PDF, max 10MB)', required: false, width: 'full' as const },
      { id: 'f_one_liner', type: 'textarea' as const, label: '30-Second Elevator Pitch', required: true, placeholder: 'We are building X to help Y achieve Z...', width: 'full' as const }
    ]
  }
];

export const FIELD_DEFINITIONS = FIELD_TYPE_DEFINITIONS;

export const PRESET_THEMES = [
  {
    id: 'weventure_classic',
    name: 'WeVenture Default',
    backgroundColor: '#F8FAFC',
    primaryColor: '#0F172A',
    textColor: '#1E293B',
    buttonColor: '#84CC16',
    cardBackground: '#FFFFFF',
    cardStyle: 'elevated' as const,
    borderRadius: 16,
  },
  {
    id: 'modern_dark',
    name: 'Midnight Slate',
    backgroundColor: '#0F172A',
    primaryColor: '#38BDF8',
    textColor: '#F8FAFC',
    buttonColor: '#0EA5E9',
    cardBackground: '#1E293B',
    cardStyle: 'elevated' as const,
    borderRadius: 20,
  },
  {
    id: 'emerald_clean',
    name: 'Forest Emerald',
    backgroundColor: '#F0FDF4',
    primaryColor: '#166534',
    textColor: '#14532D',
    buttonColor: '#15803D',
    cardBackground: '#FFFFFF',
    cardStyle: 'bordered' as const,
    borderRadius: 12,
  },
  {
    id: 'royal_indigo',
    name: 'Royal Indigo',
    backgroundColor: '#EEF2FF',
    primaryColor: '#3730A3',
    textColor: '#1E1B4B',
    buttonColor: '#4F46E5',
    cardBackground: '#FFFFFF',
    cardStyle: 'elevated' as const,
    borderRadius: 16,
  },
  {
    id: 'minimal_mono',
    name: 'Minimalist Mono',
    backgroundColor: '#FAFAFA',
    primaryColor: '#18181B',
    textColor: '#27272A',
    buttonColor: '#18181B',
    cardBackground: '#FFFFFF',
    cardStyle: 'flat' as const,
    borderRadius: 8,
  }
];

export const THEME_PRESETS = PRESET_THEMES.map(t => ({
  id: t.id,
  name: t.name,
  label: t.name,
  description: `Preset layout with ${t.primaryColor} and ${t.buttonColor} button.`,
  appearance: {
    backgroundColor: t.backgroundColor,
    primaryColor: t.primaryColor,
    textColor: t.textColor,
    buttonColor: t.buttonColor,
    accentColor: t.buttonColor,
    cardBackground: t.cardBackground,
    cardStyle: t.cardStyle,
    borderRadius: t.borderRadius,
  } as IRsvpFormAppearance
}));

