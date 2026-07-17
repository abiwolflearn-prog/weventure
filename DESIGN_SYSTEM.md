# WeVentureHub Enterprise Design System
**Version:** 1.0.0  
**Target Platform:** Web, Mobile, and Tablet Responsive SaaS  
**Aesthetic Profile:** Premium Startup, Modern SaaS, Glassmorphism, Minimal, Elegant, and Accessibility-Compliant  

---

## 1. Brand Personality & Archetype
WeVentureHub represents the intersection of innovation, physical spaces, and virtual collaboration.
* **The Innovator / Creator (Primary):** Driving forward-thinking ideas, incubation, and technological elevation.
* **The Connector / Facilitator (Secondary):** Bringing together founders, investors, sponsors, speakers, and corporate partners in a cohesive ecosystem.
* **The Expert / Professional (Tertiary):** Reliable, secure, and robust enterprise utility, trusted to power high-stakes meetings and multi-million dollar event transactions.

---

## 2. Core Design Principles
* **Spatial & Digital Fluidity:** Design cues must translate seamlessly between physical venue navigation (coworking, meeting rooms) and digital interaction (ticketing, dashboard).
* **Information Density & Clarity:** Enterprise dashboards require high density but must maintain visual rhythm. Every element should have breathing room (whitespace is an active ingredient).
* **Aesthetic Intentionality:** No arbitrary colors or generic styling. Every gradient, card border, and motion duration must be tied directly to the design tokens.
* **Accessibility-First:** Ensure all text, buttons, and notifications meet or exceed WCAG 2.1 AA and AAA standards for contrast, focus indication, and screen-reader usability.

---

## 3. Color System & Contrast Ratios
Our color system is configured for maximum vibrancy, premium contrast, and elegant digital presence.

| Color Token | Hex Code | Usage | WCAG Compliance (Contrast) |
| :--- | :--- | :--- | :--- |
| **Primary (Vibrant Indigo)** | `#5B2EFF` | Main brand color, primary buttons, active links, branding accents. | 4.8:1 against White (#FFFFFF) |
| **Secondary (Vibrant Orange)** | `#FF7A00` | Secondary highlights, urgency/warning elements, marketing accents, action buttons. | 4.6:1 against Dark Slate (#1F2937) |
| **Accent (Warm Amber)** | `#FFC857` | Highlight ratings, premium/VIP ticket tags, special statuses, gold badges. | 3.5:1 against Dark Slate (#1F2937) |
| **Background (Soft Slate)** | `#F8FAFC` | Main light-mode workspace background. | - |
| **Dark Text (Charcoal)** | `#1F2937` | Headings, primary body text, critical UI labels in light mode. | 11.5:1 against White |
| **Light Text (Slate Gray)** | `#4B5563` | Subheadings, secondary body text, disabled labels. | 6.4:1 against White |
| **White** | `#FFFFFF` | Card backgrounds, active tab containers, workspace cards. | - |

---

## 4. Light Theme Specifications
* **Page Canvas:** `#F8FAFC` (Soft Slate)
* **Card Backing:** `#FFFFFF` (Solid White)
* **Borders & Dividers:** `rgba(91, 46, 255, 0.08)` (Subtle Primary Tinted Border)
* **Interactive Default:** `#1F2937`
* **Interactive Hover:** `#5B2EFF` (Vibrant Indigo)
* **Shadow Profile:** Soft, multi-layered diffuse shadows that mimic realistic depth.

---

## 5. Dark Theme Specifications (Optional Preview Mode)
* **Page Canvas:** `#0F172A` (Deep Slate)
* **Card Backing:** `#1E293B` (Medium Dark Slate)
* **Borders & Dividers:** `rgba(255, 255, 255, 0.08)`
* **Interactive Default:** `#F8FAFC`
* **Interactive Hover:** `#5B2EFF` (Glowing Neon Purple)
* **Glow Effects:** Subtle 2px drop-shadows with primary glow (`rgba(91, 70, 255, 0.3)`) around primary UI controls.

---

## 6. Typography System
We pair **Inter** for maximum body text readability and UI precision with **Space Grotesk** for display-level high-tech editorial headings.

| Element | Font Family | Weight | size (px / rem) | Line Height | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Heading (H1)** | Space Grotesk | Bold (700) | 48px / 3.0rem | 1.15 | -0.02em |
| **Section Heading (H2)** | Space Grotesk | Semi-Bold (600) | 36px / 2.25rem | 1.2 | -0.015em |
| **Subsection Heading (H3)**| Space Grotesk | Medium (500) | 24px / 1.5rem | 1.25 | -0.01em |
| **Card Heading (H4)** | Inter | Semi-Bold (600) | 18px / 1.125rem | 1.3 | 0.0em |
| **Primary Body Text** | Inter | Regular (400) | 16px / 1.0rem | 1.5 | 0.01em |
| **Secondary Body / Label** | Inter | Medium (500) | 14px / 0.875rem | 1.4 | 0.015em |
| **Meta / Micro / Caption** | JetBrains Mono | Regular (400) | 12px / 0.75rem | 1.4 | 0.02em |

---

## 7. Font Pairing Recommendations
* **Primary Dashboard Pairing:** Use **Space Grotesk** for large layout titles and KPI statistics, and **Inter** for descriptions, list headers, data grid contents, and input fields.
* **Code/Analytics Pairing:** Use **JetBrains Mono** strictly for numbers, quantities, dates, UTC timestamps, API payloads, and check-in QR codes. This maintains a clean, highly technical "pro-grade" appearance.

---

## 8. Heading Scale (Tailwind Token Mapping)
```json
{
  "h1": "font-display text-4xl sm:text-5xl font-bold tracking-tight text-slate-900",
  "h2": "font-display text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900",
  "h3": "font-display text-xl sm:text-2xl font-medium tracking-tight text-slate-800",
  "h4": "font-sans text-lg font-semibold text-slate-800"
}
```

---

## 9. Body Text Scale (Tailwind Token Mapping)
```json
{
  "body-large": "text-lg font-normal text-slate-700 leading-relaxed",
  "body-base": "text-base font-normal text-slate-600 leading-normal",
  "body-small": "text-sm font-medium text-slate-500 leading-tight",
  "caption-mono": "font-mono text-xs text-slate-500 tracking-wide"
}
```

---

## 10. Spacing System (Golden Ratio-Based)
All margins, paddings, and layouts conform to a 4px grid.

* **xs (4px):** Micro gaps between icons and labels, fine alignment details.
* **sm (8px):** Padding for badges, inside gap in simple button/input tags.
* **md (16px):** Standard padding for table cells, small cards, inside lists.
* **lg (24px):** Standard padding for core cards, gap between structural elements.
* **xl (32px):** Generous padding for page headers, desktop section banners.
* **xxl (48px / 64px):** Outer page margins, container wrappers, vertical block separation.

---

## 11. Border Radius System
* **Rounded Base (4px):** Compact inputs, checkboxes, indicators.
* **Rounded Moderate (8px):** Default action buttons, badges, secondary cards.
* **Rounded Card (12px):** Grid panels, dialogue cards, event status displays.
* **Rounded Workspace (16px):** Primary dashboards, sidebars, modular container layouts.
* **Rounded Full (9999px):** Avatar pictures, floating search pills, active status pills.

---

## 12. Shadow System (Realistic Ambient Depth)
* **Shadow Flat / Inner:** `inset 0 2px 4px 0 rgba(0,0,0,0.02)` - Used for inputs.
* **Shadow Soft (sm):** `0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.03)`
* **Shadow Medium (md):** `0 4px 6px -1px rgba(91,46,255,0.03), 0 2px 4px -2px rgba(91,46,255,0.02)`
* **Shadow Premium (lg):** `0 10px 15px -3px rgba(91,46,255,0.05), 0 4px 6px -4px rgba(91,46,255,0.03)`
* **Shadow Floating (xl):** `0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)`

---

## 13. Iconography Style
* **Source:** Strictly Lucide React.
* **Stroke Weight:** Default to `1.75px` or `2px` for high legibility.
* **Sizing Rules:**
  - Micro Actions: `14px` x `14px` (stroke: `1.5px`)
  - Inline Labels / Badges: `16px` x `16px`
  - Core Navigation Actions: `20px` x `20px`
  - Large Hero Metrics: `32px` x `32px`

---

## 14. Illustration Style
* **Character/UI Art:** Highly stylized isometric vector graphics. Flat, clean vector fills featuring geometric grids, overlapping tinted glass elements, and bright gradients of indigo `#5B2EFF` and warm orange `#FF7A00`.
* **Decorative Accents:** Technical dots, delicate coordinate lines, bounding boxes, or wireframe blueprints that evoke the structure of coworking venues and meeting architectures.

---

## 15. Photography Style
* **Community Photos:** Real photos of modern founders, high-quality co-working spaces, and premium workspace desks. High-contrast lighting with a cool white base and pops of purple or warm yellow ambient light.
* **Portraits:** Professional, modern high-resolution corporate/founder headshots styled on clean solid neutral backgrounds.

---

## 16. Motion Design Guidelines
Animations are designed to emphasize spatial hierarchy, not create visual noise.
* **Directionality:** Content slides UP when appearing, indicating entry. Elements slide RIGHT/LEFT on tab transitions.
* **Physics:** Snappy, high-tension spring movements mimicking natural physical inertia.

---

## 17. Animation Timing Tokens (Framer Motion)
```json
{
  "timing-instant": "duration: 0.1s, ease: easeOut",
  "timing-snappy": "duration: 0.2s, ease: [0.16, 1, 0.3, 1]",
  "timing-smooth": "duration: 0.35s, ease: [0.25, 1, 0.5, 1]",
  "spring-snappy": "type: spring, stiffness: 300, damping: 25",
  "spring-bouncy": "type: spring, stiffness: 200, damping: 15"
}
```

---

## 18. Hover Effects (Tailwind Utility Mapping)
* **Primary Interactive Items:** `hover:bg-slate-50 active:scale-[0.98] transition-all duration-200`
* **Vibrant Cards:** `hover:border-indigo-500 hover:shadow-lg transition-all duration-300`
* **Primary Button Hover:** Scale up slightly (`scale-102`), shift gradient.

---

## 19. Focus States (WCAG Compliance)
* **Mandatory Rule:** Focus must be highly visible and utilize a dual-ring system to ensure visibility on all backgrounds.
* **Styling Class:** `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`

---

## 20. Loading States (Skeleton Specs)
* **Skeleton Animation:** A soft shimmer overlay (pulse skeleton) moving from left to right.
* **Colors:** Gray-100 base shifting to Gray-200 and back to Gray-100 over a 1.5s repeating infinite loop.

---

## 21. Empty States
* **Layout:** Vertical Stack, centrally aligned.
* **Composition:** Large 64px Lucide icon inside a circular soft background -> Heading (H3) -> Descriptive subtext -> Single high-contrast primary CTA button.

---

## 22. Error States
* **Main Indicator:** Crimson Red (`#EF4444`).
* **Visual Treatment:** Fine red border on inputs, subtle light red background container for top-level alerts, accompanied by a warning triangle icon.

---

## 23. Success States
* **Main Indicator:** Emerald Green (`#10B981`).
* **Visual Treatment:** Soft green background wrapper, checkmark-circle icon, smooth fade-in success check alert.

---

## 24. Warning States
* **Main Indicator:** Secondary Vibrant Orange (`#FF7A00`) or Amber Gold (`#F59E0B`).
* **Visual Treatment:** Warning alert wrapper, orange indicator dot, exclamation icon.

---

## 25. Button Variants
* **Primary Solid:** Solid `#5B2EFF` background, rounded-lg, crisp white text. Active state scales by 0.98.
* **Secondary Glass:** Transparent background, 1px `#5B2EFF` border, text colored in `#5B2EFF`. Hover expands background to `rgba(91, 46, 255, 0.04)`.
* **Ghost Utility:** Borderless, background is fully transparent, text is Slate Gray `#4B5563`. Hover triggers background of Slate Gray at `rgba(75, 85, 99, 0.05)`.
* **Danger Solid:** Solid Crimson Red `#EF4444`, white text, soft drop shadow.

---

## 26. Input Fields (Sizing & Typography)
* **Padding:** `px-4 py-2.5`
* **Borders:** 1px border styled with Slate Gray at `rgba(203, 213, 225, 1)`.
* **Focus State:** Transitions border to primary indigo and triggers dual focus rings.
* **Fonts:** Styled using `text-sm font-normal text-slate-800 placeholder-slate-400`.

---

## 27. Select Components (Dropdown Design)
* **Toggle Trigger:** Styled matching standard inputs, accompanied by a Lucide ChevronDown icon.
* **Dropdown Menu Panel:** Pop-up panel positioned exactly 4px beneath the input field. Utilizes glassmorphism overlay (`backdrop-blur-md`), styled with Solid White (`#FFFFFF`) with 1px border.

---

## 28. Text Areas
* **Sizing:** Standard input spacing, fixed vertical resizing limits, default height of `min-h-[100px]`.

---

## 29. Checkboxes
* **Structure:** Custom checkbox element utilizing a modern styled 16x16px bounding box. On-checked transitions to a vibrant solid indigo background centered with an emerald/white check icon.

---

## 30. Radio Buttons
* **Structure:** Standardized 16x16px circle with a light boundary. Active state fills the circle with an inner solid indigo target dot surrounded by white space.

---

## 31. Switches (Toggle)
* **Structure:** Rounded pill capsule (`w-11 h-6 bg-slate-200`). Activates with smooth left-to-right sliding transition of a white selector circle (`w-5 h-5`).
* **Colors:** Transition from Gray-200 to Indigo `#5B2EFF` upon toggled-on.

---

## 32. Cards (The Building Blocks)
* **Canvas Border:** 1px border using `rgba(91,46,255,0.08)`.
* **Glow Layer:** Floating glass elements use a delicate, barely noticeable background blur (`backdrop-blur-lg bg-white/90`).
* **Hover State:** Smoothly transitions card up by 2px, increasing shadow depth.

---

## 33. Tables (Data Display)
* **Layout:** Flat, spaced structure. Row-dividers use a subtle slate-border.
* **Header Row:** Light-gray background with all headers typed in `font-mono tracking-wider text-xs uppercase text-slate-400`.
* **Active Rows:** Smooth hover highlights with soft slate gray `rgba(241, 245, 249, 0.5)`.

---

## 34. Data Grids (Advanced Filtering)
* **Structure:** Top toolbar (search bar, filter pills, view controllers) -> Grid body -> Footer pagination controllers.
* **Interactive Filtering:** Hovering filters highlights them with a primary colored background wrapper.

---

## 35. Dashboards (Grid Structure)
* **Grid Design:** Responsive bento grid containing varying layout dimensions (e.g., 3-column top highlights, 2-column main analytical charts, 1-column activity logs).
* **Grid Sizing:** Standardized spacing of 24px between all bento cards.

---

## 36. Charts (Color Codes)
* **Data Visualization Series:**
  - Metric 1 (Main): Vibrant Indigo (`#5B2EFF`)
  - Metric 2 (Secondary): Vibrant Orange (`#FF7A00`)
  - Metric 3 (Accent): Warm Amber (`#FFC857`)
  - Accent/Neutral: Slate Gray (`#94A3B8`)

---

## 37. Badges (Categorization)
* **Standard Rounded Badge:** Clean rounded capsule containing text styled in `text-xs font-semibold`.
* **Colors:** Matches standard alert states (Indigo for Default, Orange for Warning, Green for Success).

---

## 38. Tags (Keywords)
* **Structure:** Extremely clean, light grey background with small text. Dismissible tags display a close (`x`) icon on the right edge.

---

## 39. Alerts
* **Design:** Floating banner containing a dedicated icon, an informative heading, descriptive text, and a closing action icon. Colored appropriately to match its alert category.

---

## 40. Toast Notifications
* **Positioning:** Fixed to the bottom-right of the viewport.
* **Structure:** Slide-in alert card with generous shadow depth. On-hover pauses any active auto-dismiss timer.

---

## 41. Progress Bars
* **Layout:** Flat horizontal capsule containing a filled progress indicator bar.
* **Transition:** The indicator bar expands smoothly from left to right using spring physics.

---

## 42. Modals (Overlays)
* **Modal Overlay Canvas:** Black backdrop at `bg-slate-900/40 backdrop-blur-sm`.
* **Modal Frame Card:** Center-aligned responsive card. Scaling entry effect transitions card smoothly into view.

---

## 43. Drawers (Side Panels)
* **Interaction:** Slid out seamlessly from the right margin.
* **Exit Behaviour:** Dragging rightwards towards the page margin triggers a smooth exit.

---

## 44. Breadcrumbs
* **Structure:** Horizontal path list separated with inline Lucide ChevronRight characters.
* **Colors:** Current location text colored in Charcoal gray, preceding pages styled as clickable slate-colored links.

---

## 45. Pagination Controls
* **Layout:** Flex row with a central list of page selection buttons, flanked by standard Previous and Next page controls.

---

## 46. Tabs (Navigation)
* **Structure:** Horizontal slider panel. Active tabs are visually underlined with a primary colored bar.
* **Framer Motion Integration:** The indicator line transitions between active tabs smoothly.

---

## 47. Timeline (Vertical Progress)
* **Structure:** Vertical timeline layout with solid circular dots marking milestones. Completed milestones display custom primary check icons.

---

## 48. Calendar UI (Interactive Scheduling)
* **Grid:** 7x6 month block layout with selectable date cards.
* **Statuses:** Current day highlighted with light gray. Date bookings display as color-coded horizontal indicator bars.

---

## 49. Sidebar Design (Core Navigation)
* **Layout:** Desktop-pinned navigation panel (`w-64 bg-slate-900 text-slate-100`).
* **Selection State:** Active items highlighted with Indigo backgrounds paired with solid white icons.

---

## 50. Navbar Design
* **Design:** Pinned header element utilizing clear glassmorphism styling (`backdrop-blur-md bg-white/80 border-b border-slate-100`).
* **Layout:** Left brand logo -> Center search pill -> Right user notifications & avatar container.

---

## 51. Footer Design
* **Structure:** Standard informational structure divided into useful category directories (Platform, Company, Help), copyright text, and social links.

---

## 52. Mobile Navigation (The Bottom Bar)
* **Layout:** Fixed bottom navigation bar (`h-16 bg-white/95 backdrop-blur-md border-t border-slate-100`). Includes 5 primary quick-access links.

---

## 53. User Profile Components
* **Structure:** Top landscape profile header banner -> Central profile photo -> Profile editable details list.

---

## 54. Dashboard Widgets
* **Format:** Micro cards designed to deliver quick informational indicators (e.g., Active Bookings count, total Event Registrations, earned Revenue).

---

## 55. Event Cards (The Showcase Block)
* **Components:** Top event cover photo -> High-contrast event badge -> Event Title -> Event Date & Location fields -> CTA registration link.

---

## 56. Venue Cards
* **Components:** Cover photography -> Capacity badge indicator -> Venue features/tags list -> Instant book button.

---

## 57. Speaker Cards
* **Components:** Centered rounded portrait -> Speaker Name -> Title/Company fields -> Detailed bio text block.

---

## 58. Ticket Cards
* **Components:** Dotted card divider resembling ticket tear-off line -> Event Details -> Dynamic QR Code -> Ticket status badge.

---

## 59. Booking Cards
* **Components:** Booked Venue Name -> Scheduled Date & Time -> Interactive booking management controllers (Reschedule, Cancel).

---

## 60. Analytics Cards
* **Components:** Current total metric statistics -> Relative change trend percentage pill -> Linear sparkline metric chart showing 30-day trends.

---

## Responsive Layout System
* **Desktop (1280px and wider):** Full multi-panel view, persistent sidebar (`64px` collapsed, `256px` expanded), core bento layouts.
* **Laptop (1024px to 1279px):** Sidebar collapses to space-saving icon-only view, grids shift from 3-column to 2-column configurations.
* **Tablet (768px to 1023px):** Collapsed bottom sidebar/drawer transitions, content scales down to a single-column layout.
* **Mobile (Smaller than 768px):** Sticky bottom navigation dock, single-column bento grids, modal screens expand to occupy full-device limits.

---

## UI Component Naming & Coding Conventions
To ensure seamless collaboration across engineering divisions, we enforce absolute naming consistency:
* **Directory Structure:** PascalCase for React component folders and filenames (e.g., `EventCard/EventCard.tsx`).
* **Variables & Handlers:** camelCase for variables, objects, and event handlers (e.g., `const [currentEvent, setCurrentEvent] = useState()`).
* **Types & Interfaces:** Capitalized PascalCase prefixed with `I` for interfaces or `T` for types (e.g., `interface IEventDetails`).
* **Tailwind Class Sorting:** Must follow the standardized utility layout hierarchy:
  1. Box Model (display, position, z-index, width, height)
  2. Spacing (margin, padding)
  3. Typography (font, text alignment, colors)
  4. Borders & Visuals (background, borders, shadows, opacity)
  5. Interactive & Transitions (hover, focus, transitions)

---

## Design Tokens (JSON Mapping)
```json
{
  "brand": {
    "primary": "#5B2EFF",
    "secondary": "#FF7A00",
    "accent": "#FFC857"
  },
  "feedback": {
    "success": "#10B981",
    "warning": "#FF7A00",
    "error": "#EF4444",
    "info": "#3B82F6"
  },
  "neutral": {
    "canvas": "#F8FAFC",
    "white": "#FFFFFF",
    "charcoal": "#1F2937",
    "slate-gray": "#4B5563",
    "border-subtle": "rgba(91, 46, 255, 0.08)"
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px",
    "xxl": "48px"
  },
  "radius": {
    "base": "4px",
    "moderate": "8px",
    "card": "12px",
    "workspace": "16px",
    "full": "9999px"
  }
}
```

---

## Page-by-Page UI Blueprint & Layout Grid

### Landing Page
* **Grid:** 12-Column Layout.
* **Layout Flow:**
  - Pinned responsive global navigation bar.
  - Hero Section: High-impact headline ("Where Ventures Launch and Communities Connect") using elegant Space Grotesk H1 with integrated orange color accent points.
  - Interactive Search Pill: Centered search bar for rapid exploration of events and coworking desks.
  - Value Props Grid: 3-column bento card grid showcasing Coworking, Meeting Rooms, and Events.
  - Active Events Carousel: Drag-interactive card grid featuring upcoming corporate and community workshops.
  - Integrated modern footer.

### Login & Register Screen
* **Layout Flow:**
  - Split-screen visual layout.
  - Left Panel (45%): Large high-contrast brand image presenting an inspiring coworking environment, decorated with clean white logo and floating coordinates text overlay.
  - Right Panel (55%): Minimalist central form container, social login button suite, email/password form inputs, clean Indigo action buttons.

### Member/Staff Dashboard
* **Grid:** 4-Column Header Widgets -> 2-Column Main Bento Grid.
* **Layout Flow:**
  - Pinned Sidebar navigation (collapsible).
  - Quick KPI Row: [Active Bookings] [Earned Points] [Upcoming Events] [Notifications Panel].
  - Main Left Card: Real-time Interactive Booking calendar view.
  - Main Right Card: Activity Stream & Check-in history list showing personal UTC-timestamped entries.

### Admin/Company Panel
* **Grid:** 3-Column Bento Grid.
* **Layout Flow:**
  - Advanced data management layout featuring tables with inline status pills (e.g., Active, Suspended).
  - Analytics Widget: Interactive charts rendering booking counts, check-in totals, and revenue.
  - Operational controls: Manage venues, speaker directories, and sponsor integrations.

---

## Accessibility Rules (WCAG 2.1 AA Checklist)
* **Contrast Safeguard:** Ensure all text passes minimum 4.5:1 ratio for standard text, and 3:1 for large display headers.
* **Keyboard Navigation:** Every actionable UI control must be fully accessible and navigable using standard Tab and Enter commands.
* **Screen Reader Metadata:** Ensure all interactive icons contain descriptive, accessible descriptive tags (e.g., `aria-label="Close notification panel"`).
