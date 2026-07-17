# WeVentureHub Enterprise Frontend Architecture Specification
**Version:** 1.0.0  
**Target Runtime:** React 19, Vite, TypeScript, and Tailwind CSS  
**Aesthetic Standard:** Premium Startup, Modern SaaS, Glassmorphism, Accessibility-Compliant  

---

## 1. Technical Stack & Dependencies

The enterprise frontend is built upon a highly responsive, type-safe React 19 Single Page Application (SPA) architecture designed to handle multi-tenant routing, offline-first server-state caching, and interactive animations.

```
========================================================================================
                              FRONTEND TECHNOLOGY LAYER
========================================================================================
  [View & UI]            React 19, Tailwind CSS, Framer Motion, Lucide Icons
  [Application State]    Redux Toolkit (Auth, UI States, Core Tenant Presets)
  [Server State Cache]   TanStack Query (React Query v5), Axios Client Engine
  [Routing & Security]   React Router v6 (Data Routers, Protected RBAC Guards)
  [Forms & Verification] React Hook Form, Zod Schema Validation
========================================================================================
```

---

## 2. Frontend Folder Structure (Modular & Feature-Based)

To support long-term maintainability and prevent bundle-size bloat, WeVentureHub organizes directories by **features** rather than technical roles.

```
/src
├── main.tsx                # Client boot entrypoint
├── App.tsx                 # Core App Shell & Providers mapping
├── index.css               # Tailwind global style bindings
├── types.ts                # Shared global TypeScript schemas
├── assets/                 # SVGs, Static Logos, Font Declarations
├── components/             # Global Reusable UI Elements (Buttons, Inputs, Modals)
│   ├── Button/
│   ├── Input/
│   ├── Modal/
│   └── Table/
├── context/                # Multi-tenant Context, Safe App Theme boundaries
├── features/               # Isolated Domain Feature Modules
│   ├── auth/               # Login, MFA, Token Refreshes, Password Resets
│   ├── bookings/           # Resource finders, visual scheduler grids
│   ├── events/             # Dynamic wizards, ticketing configurations
│   ├── analytics/          # Bento metrics widgets, charting layers
│   └── incubation/         # Programs timeline, milestones trackers
├── hooks/                  # Global Utility Hooks (useAuth, useLocalStorage, useDebounce)
├── layouts/                # Platform layouts (AuthLayout, DashboardLayout, Shell)
├── lib/                    # Global client initializations (axiosInstance, queryClient)
├── routes/                 # Protected RBAC Route maps, lazy loading codes
├── store/                  # Redux Toolkit configuration & root state slices
└── utils/                  # Universal helper utilities (formatters, JWT decoders)
```

---

## 3. Component Hierarchy & Layout Shells

The platform enforces structural modularity by separating **Global Layout Shells** from **Feature-Specific Context Views**.

### 3.1 Layout Architecture
* **AuthLayout:** Centered split-screen panels for Login, Registration, and Password Reset pages.
* **DashboardLayout:** Persistent collapsed/expanded sidebar navigation, top glassmorphic search/notification navigation bar, and responsive bento-grid main viewport.
* **PublicShell:** Minimal header-footer layout serving public landing pages, pricing listings, and self-service registration forms.

---

## 4. Routing, Navigation, & RBAC Protection

### 4.1 Protected Route Guards
To prevent unauthorized access, the application uses React Router's nested layouts paired with custom route wrapper components.

```
[Incoming Request Route] -> [Verify JWT Access Token] --(Expired)--> [Renew Token via Refresh API]
                                    |                                        |
                               (Valid Signature)                         (Success)
                                    |                                        |
                                    v                                        v
                       [Verify User Tenant Match]               [Allow Navigation Proceed]
                                    |
                                    v
                     [Verify User RBAC Role Permissions] --(Insufficient)--> [Redirect to 403 Forbidden]
                                    |
                               (Passes)
                                    v
                       [Mount Selected Screen View]
```

### 4.2 Role-Based UI Rendering
The application uses declarative components to restrict structural rendering boundaries based on user profiles:
* Conditional blocks are mapped to structural security roles: `<RoleGuard allowedRoles={['STAFF', 'TENANT_ADMIN']}> <QrScannerButton /> </RoleGuard>`
* Navigation selectors dynamically compile sidebar links matching the logged-in user's access tokens.

---

## 5. Global & Server State Management

### 5.1 Global Session State (Redux Toolkit)
Redux is utilized exclusively for persistent, client-side application parameters that do not require server queries:
* **Auth Slice:** Tracks `isAuthenticated`, active user payload (User ID, Name, Email, Tenant ID, current role), and active sessions.
* **UI Config Slice:** Stores sidebar state (collapsed/expanded), active viewport theme (light/dark overrides), and locale tags.

### 5.2 Server State Strategy (TanStack Query)
TanStack Query acts as the primary data synchronizer and cache manager:
* **Query Caching:** Fetched data (such as venue inventories, event details, and ticket codes) is cached automatically using unique query keys.
* **Stale-Time Rules:** Public listings use a generous stale-time (5 minutes) to minimize database load. Operational booking availability and ticket verification queries enforce a strict `staleTime: 0`, requiring instant server verification.
* **Optimistic UI Updates:** Action triggers (like toggling a task completion status or bookmarking an event) update local states instantly, with graceful rollbacks if server responses fail.

---

## 6. Reusable UI Component Inventory

To ensure complete UI/UX consistency across WeVentureHub modules, developers utilize this standardized, accessibility-compliant component inventory:

### 6.1 Action Button (`<Button />`)
* **Purpose:** Handles core actions, route navigation, and form submissions.
* **Props Specification:**
  ```typescript
  interface IButtonProps {
    variant: 'primary' | 'secondary' | 'ghost' | 'danger';
    size: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    isDisabled?: boolean;
    icon?: React.ReactNode;
    onClick?: () => void;
  }
  ```
* **Variants:**
  * `primary`: Solid `#5B2EFF` background, white text.
  * `secondary`: Transparent background, 1px `#5B2EFF` border, purple text.
  * `ghost`: Transparent background, slate text.
  * `danger`: Solid crimson red background.
* **Accessibility (A11y):** Supports `aria-busy` and `aria-disabled` flags, handles keyboard triggers (`Enter` and `Space`), and maintains a contrast ratio of > 4.5:1.

### 6.2 Data Table (`<DataTable />`)
* **Purpose:** Renders dynamic data sets with built-in sorting, filtering, and paging controls.
* **Props Specification:**
  ```typescript
  interface IDataTableProps<T> {
    columns: Array<{ header: string; accessor: keyof T; renderCell?: (row: T) => React.ReactNode }>;
    data: T[];
    isLoading: boolean;
    pagination: { total: number; page: number; limit: number; onChangePage: (page: number) => void };
  }
  ```
* **Accessibility (A11y):** Utilizes standard semantic elements (`<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`), supports keyboard-navigable pagination headers, and implements descriptive screen-reader tags (e.g., `aria-label="Staff inventory listings"`).

### 6.3 Card Container (`<Card />`)
* **Purpose:** The basic bento-grid building block, used to wrap dashboard modules, metrics, and profiles.
* **Props Specification:**
  ```typescript
  interface ICardProps {
    title?: string;
    action?: React.ReactNode;
    isHoverable?: boolean;
    children: React.ReactNode;
  }
  ```
* **Variants:**
  * `standard`: Flat borders, subtle drop shadow.
  * `interactive`: Highlights on hover (`scale-102`, border-indigo-500).

---

## 7. Application Screen Blueprints & Navigation Flow

### 7.1 Landing Page
* **Layout:** Public Shell.
* **Features:** Responsive navigation bar, immersive Hero panel presenting coworking values, quick-search filter widgets for desks and spaces, upcoming corporate events grid, and interactive footer.
* **APIs Used:** `GET /events/featured`, `GET /workspaces/summary`.

### 7.2 Core Operational Dashboard
* **Layout:** Dashboard Layout.
* **Features:** Comprehensive multi-panel bento grid displaying real-time metrics cards, upcoming booking schedules, recent notifications stream, and profile shortcuts.
* **User Roles:** `TENANT_ADMIN`, `STAFF`, `HUB_MEMBER`.
* **APIs Used:** `GET /analytics/summary`, `GET /bookings/upcoming`.

### 7.3 Workspace Reservation & Room Scheduler
* **Layout:** Dashboard Layout.
* **Features:** Interactive daily booking calendar, resource capacity filters, real-time availability indicator grids, and booking checkout overlays.
* **User Roles:** `HUB_MEMBER`, `EXTERNAL_USER`, `STAFF`.
* **APIs Used:** `GET /workspaces`, `POST /bookings`.

### 7.4 Event Creation & Management Wizard
* **Layout:** Dashboard Layout.
* **Features:** Step-by-step form editor, ticket tier pricing configurations, banner image uploads, speaker selections, and coupon setup triggers.
* **User Roles:** `TENANT_ADMIN`, `STAFF`.
* **APIs Used:** `POST /events`, `GET /categories`, `POST /media/upload`.

---

## 8. Frontend Roadmap & Development Phases

```
=============================================================================================
PHASE 1: Project Setup (W1-W3)       PHASE 2: Core Features (W4-W7)         PHASE 3: Scale (W8-W12)
=============================================================================================
 - Configure Vite, Tailwind, Redux    - Workspace Scheduler & Timelines      - Incubation Dashboards
 - Build Shared Components            - Registration & Payment Integrations  - Multi-Tenant Analytics
 - Implement Auth Guards & Layouts    - QR Code Scanner Implementation       - Performance Audits & SEO
=============================================================================================
```

### 8.1 Phase 1: Environment Setup & Core Foundations (Weeks 1–3)
* Complete Vite-TypeScript and Tailwind CSS build configurations.
* Implement the core design token system, global theme wrappers, and utility formatting helpers.
* Develop the shared component suite (`<Button />`, `<Input />`, `<Modal />`, `<DataTable />`).
* Implement React Router configs, nested layout structures, and access control guards.

### 8.2 Phase 2: Booking Systems & Ticketing Workflows (Weeks 4–7)
* Integrate TanStack Query and configure the Axios client engine.
* Build Auth views (Login, Registration, Password Resets) with standard form validation.
* Develop the Interactive Workspace Scheduler showing live availability grids.
* Implement Event Creation Wizards, ticket checkout interfaces, and Stripe/Chapa payment gateways.
* Build the on-site Ticket Verification QR Scanner utilizing mobile cameras.

### 8.3 Phase 3: Acceleration, CRM, & Optimizations (Weeks 8–12)
* Develop the Incubation Portal featuring program milestone trackers and mentor schedules.
* Build administrative reporting dashboards containing real-time metrics charts.
* Conduct comprehensive accessibility audits (targeting WCAG 2.1 AA compliance).
* Run Lighthouse audits, optimize lazy loading routes, and execute comprehensive end-to-end user flows.
