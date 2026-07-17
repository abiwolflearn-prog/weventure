# WeVentureHub Event & Workspace Management Platform - Agent Instructions

> **CRITICAL ARCHITECTURAL DIRECTIVE: THIS IS AN EXCLUSIVE CUSTOM ENTERPRISE PLATFORM.**
> All software, architecture, database schemas, and views must be built exclusively for WeVentureHub.

---

## 1. Core Paradigm & Non-Negotiable Rules

*   **NOT A SAAS OR MULTI-TENANT SYSTEM**: Do not create multi-tenant database patterns, organization registration forms, organization selectors, billing plans for different companies, or subscription trials.
*   **SINGLE-ORGANIZATION FOCUS**: Every feature, view, action, and API endpoint belongs entirely to **WeVentureHub**. There are no "external tenants" or "other organizations" in this system.
*   **DATABASE ARCHITECTURE**: There is only one database (MongoDB/Drizzle). Do not add `tenant_id`, `organization_id`, or multiple client isolation parameters to queries or schemas.
*   **BRAND IDENTITY**: All layouts must follow the WeVentureHub Design System:
    *   **Colors**: Primary Blue, Success Lemon Green, White content areas.
    *   **Layout**: Clear public website interface, and dark-themed sidebars for the Admin/Operator views.
    *   **Branding Elements**: Logo, address, news, staff, social links, sponsors, and partners must represent **WeVentureHub** directly.

---

## 2. Platform Structure

### User Roles & Admins
All users inside the dashboard are part of the single WeVentureHub administrative, operational, or community team:
*   Super Admin
*   Event Manager
*   Workspace Manager
*   Finance Officer
*   Marketing Officer
*   Community Manager
*   Reception
*   Volunteer Coordinator
*   Staff / Members

### Services Provided by WeVentureHub
*   **Events & Gatherings**: Events, Workshops, Trainings, Hackathons, Networking Events, Pitch Competitions, Startup Programs (Incubation/Acceleration), Mentorship.
*   **Workspaces & Venues**: Coworking Space, Hot Desk, Dedicated Desk, Meeting Rooms, Conference Rooms, Training Rooms, Event Hall.
*   **Membership**: Community Membership plans.

### Public Website Interactions
Visitors can:
1.  View and register for events/workshops.
2.  Book workspaces, meeting rooms, hot desks, or the event hall.
3.  Read the latest WeVentureHub news and announcements.
4.  Contact WeVentureHub.
5.  Complete secure online payments.

---

## 3. Designing New Features

*   **Never suggest SaaS architecture**.
*   **Never generate multi-tenant code**.
*   **Never create tenant management or organization switcher UI**.
*   **Always assume WeVentureHub is the sole, authoritative entity**.
