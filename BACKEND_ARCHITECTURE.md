# WeVentureHub Enterprise Backend Architecture Handbook
**Version:** 1.0.0  
**Target Runtime:** Node.js, Express.js, TypeScript, and MongoDB  
**Security Standard:** OWASP Top 10 Compliant, Enterprise Multi-Tenant Isolation  

---

## 1. Architectural Style & Layered Pattern

The WeVentureHub backend is designed using a clean, layered architecture (often referred to as Onion or Hexagonal Architecture). This enforces strict separation of concerns, ensures high testability, and prevents database-tier leakage into transport layers.

```
========================================================================================
                                 REQUEST LIFECYCLE LAYER
========================================================================================
     [HTTP / WebSocket Client] ──> [Express Route Handler] ──> [Validation Middleware]
                                                                        │
                                                                        v
========================================================================================
                               APPLICATION CONTROLLERS
========================================================================================
     [Express Controller] ── (Parses DTO, Sets Tenant Context) ─────────┘
              │
              v
========================================================================================
                             BUSINESS LOGIC & SERVICES
========================================================================================
     [Core Business Service] ── (Enforces Business Rules & Workflows)
              │
              v
========================================================================================
                               PERSISTENCE & STORAGE
========================================================================================
     [Repository Layer] ── (Executes Isolated Tenant Database Queries) ──> [MongoDB Atlas]
========================================================================================
```

### 1.1 Folder Structure Layout
To support scalability and team-wide clarity, the codebase is organized as follows:

```
/src
├── server.ts               # Application entrypoint & Express server initiation
├── config/                 # Static environments, Cloudinary & MongoDB bindings
├── constants/              # System-wide enums and static lookup data
├── errors/                 # Custom error constructors (AppError, ValidationError)
├── middleware/             # Route-level request handlers (Auth, RoleGuard, RateLimiter)
├── types/                  # Global Express request type overrides
├── utils/                  # Cryptography, Date formatters, Logger helpers
└── modules/                # Feature-based domain logic
    ├── auth/
    │   ├── auth.routes.ts
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   └── auth.validator.ts
    ├── users/
    ├── bookings/
    ├── events/
    └── notifications/
```

---

## 2. Multi-Tenant Request Isolation Flow

### 2.1 Context Isolation Middleware
Every incoming API request must proceed through the `TenantContextMiddleware`.
1. The middleware parses the requesting origin domain or inspects the `X-Tenant-ID` header.
2. It validates the tenant's registration status against the system cache.
3. If valid, it binds the `tenantId` property directly to the request context:
   `req.tenantId = parsedTenantId;`
4. Downstream Repositories automatically apply this value to all database operations (e.g., `{ tenantId: req.tenantId }`).

### 2.2 Security Boundary Verification
Under no circumstances can cross-tenant document mutations succeed. Repositories must enforce:
* `TenantID` query boundaries on all updates, creations, and soft deletions.
* Scoped file upload structures using Cloudinary folders named `/tenants/:tenantId/:module/`.

---

## 3. Layered Responsibility Definitions

### 3.1 HTTP Routing Layer (`routes`)
* **Role:** Map API endpoints to specific controllers.
* **Rules:** Must not contain any business logic or query structures. Must strictly apply route-specific Middlewares (validation, authentication, rate-limiting).

### 3.2 Request Controllers (`controllers`)
* **Role:** Act as adapters between HTTP requests and internal services.
* **Responsibilities:** Extract payloads, query parameters, route parameters, and tenant contexts. Forward structured arguments to domain services, handle returned outputs, and invoke JSON response formatters.

### 3.3 Domain Services (`services`)
* **Role:** The core business logic engine.
* **Responsibilities:** Enforce workflow constraints, process credit transactions, calculate pricing models, and coordinate transactional notifications.
* **Rules:** Fully database-agnostic. Services fetch raw inputs and coordinate operations using Repositories.

### 3.4 Data Repositories (`repositories`)
* **Role:** Standardize data access.
* **Responsibilities:** Handle all Mongoose queries and database aggregations. Enforce tenant isolation rules at the query layer.

---

## 4. Authentication, Authorization, & Security

### 4.1 Token-Based Authentication Flow
WeVentureHub enforces a stateless, secure, sliding-window authentication model utilizing JWT tokens.

```
[Login Action] ──> [Verify Credentials] ──> [Issue Access Token (15m Expire)]
                                       ──> [Issue Refresh Token (7d Expire, HttpOnly)]
                                                   │
                                                   v
[API Requests] ──> [Attach Access Token Cookie] ──> [Validate Token Signature]
                                                   │
                                            (If Token Expired)
                                                   │
                                                   v
[Silent Refresh] <── [Verify Refresh Token] <─── [Request /token/refresh]
```

### 4.2 Role-Based Access Control (RBAC) Middleware
Authorization is verified via hierarchical middleware checking claims embedded within verified access payloads:
* **Tenant Admin:** Absolute domain administration control.
* **Staff Member:** Access to operational tools (e.g., checking in guests, viewing calendar schedules).
* **Hub Member / Attendee:** Standard personal resource booking and profile modifications.

### 4.3 Security Hardening Practices
* **OWASP Protections:** Enforce strict password complexity validation, prevent SQL/NoSQL injection through parameterized MongoDB queries, and implement custom CORS white-listing.
* **Rate Limiting Configs:**
  * Public Route Authentication: Max 5 login attempts per 15 minutes per IP.
  * Standard Transactions: Max 100 API calls per 15 minutes per IP.

---

## 5. Transaction, Validation, & Error Architecture

### 5.1 Request Validation Pattern
All write inputs undergo strict validation schema parsing before hitting controllers.
* We enforce **Zod Schemas** to parse request headers, query values, and bodies.
* Failed validations trigger a standard formatting helper, converting library-specific stack traces into clean, structured arrays returned with a `422 Unprocessable Entity` status code.

### 5.2 Global Exception Handling
All routes are wrapped in an asynchronous error catcher. Any unhandled exception is caught by the system-wide Express Error Handler middleware.
* **Known Application Errors (`AppError`):** Return descriptive messages, custom business codes, and appropriate status codes (e.g., `404 Not Found`, `400 Bad Request`).
* **Unknown Server Exceptions:** Mask details from clients in production environments, log full traceback trace structures to internal diagnostic engines, and return a standardized `500 Internal Server Error` message.

---

## 6. Integrations, Jobs, & Real-Time Communications

### 6.1 Unified File Uploads (Multer + Cloudinary)
1. Requests dispatch multipart-form payloads containing binary data.
2. The `Multer` memory engine captures uploads and performs validation checks on file size (max 5MB) and MIME type (images/PDFs only).
3. The upload service streams accepted assets directly to Cloudinary storage, returning absolute CDN endpoints paired with secure metadata IDs.

### 6.2 Transactional Email Dispatch (Nodemailer)
* **Strategy:** Domain services enqueue transactional notification jobs.
* **Fulfillment:** Email dispatch services utilize `Nodemailer` to compile clean responsive HTML template layouts. In production, these calls route through secure enterprise SMTP gateways (such as SendGrid or AWS SES).

### 6.3 Real-Time Communications (Socket.IO)
To support instantaneous updates, WeVentureHub implements Socket.IO:
* **Authentication Guard:** Sockets require verified JWT tokens during connection handshake steps.
* **Tenant Isolation:** Users are dynamically subscribed to isolated socket rooms mapped to their tenant and membership cohorts:
  `socket.join(`tenant:${user.tenantId}:chat:${channelId}`);`
* **Real-time Updates:** Triggers real-time notifications for chat messages, booking confirmations, and QR check-ins.

---

## 7. Quality Assurance & Implementation Roadmap

### 7.1 Backend Definition of Done (DoD)
A backend module is considered production-ready only when it satisfies all of the following:
* **TypeScript Compliance:** Absolutely zero `any` declarations; strict type safety must be maintained across all controllers, services, and models.
* **Database Isolation:** Verified logic ensuring all Mongoose database calls are scoped using indexed `tenantId` query boundaries.
* **Input Validation:** Zod schema validation must verify all client input payloads.
* **Unit & Integration Coverage:** Core services and repository layers must achieve > 80% test coverage under Jest/Supertest environments.
* **Audit and Log Coverage:** Every document mutation or authorization change must write structured traces to the application log.
* **API Documentation:** OpenAPI specification files must be updated to match all new endpoints.
