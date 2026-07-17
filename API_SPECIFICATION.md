# WeVentureHub Enterprise REST API Specification
**Version:** 1.0.0-draft  
**Base URL:** `/api/v1`  
**Protocol:** HTTPS  
**Format:** JSON  

---

## 1. Global API Standards & Protocols

### 1.1 Response Format Standard
To ensure absolute predictability across all client libraries, every API response must conform to a standardized wrapper structure.

#### Success Response Wrapper (Single Object)
```json
{
  "success": true,
  "timestamp": "2026-06-30T12:00:00.000Z",
  "data": {
    "id": "60b8d2f2f1d2f20015a84e2a",
    "name": "WeVentureHub Downtown"
  },
  "metadata": {
    "version": "1.0.0"
  }
}
```

#### Success Response Wrapper (Paginated List)
```json
{
  "success": true,
  "timestamp": "2026-06-30T12:00:00.000Z",
  "data": [
    {
      "id": "60b8d2f2f1d2f20015a84e2a",
      "name": "Startup Incubation Panel"
    }
  ],
  "pagination": {
    "total": 142,
    "page": 1,
    "limit": 10,
    "totalPages": 15,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "metadata": {
    "version": "1.0.0"
  }
}
```

### 1.2 Error Format Standard
When a transaction fails or validation fails, the API must return an appropriate HTTP status code paired with a structured, debuggable payload.

```json
{
  "success": false,
  "timestamp": "2026-06-30T12:00:00.000Z",
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The request body contains invalid parameter parameters.",
    "details": [
      {
        "field": "email",
        "issue": "Must be a valid enterprise email address ending in .com, .org, or .net"
      }
    ]
  },
  "metadata": {
    "traceId": "tr-84a2d8e0f2b311eba8cd0242ac120002"
  }
}
```

### 1.3 Core Standard Error Codes
* `UNAUTHORIZED`: Access token is missing, expired, or malformed.
* `FORBIDDEN`: User does not possess the RBAC permissions or tenancy role.
* `NOT_FOUND`: Specified resource, record, or tenant does not exist.
* `CONFLICT`: Resource double-booking or unique field duplicate detected.
* `RATE_LIMIT_EXCEEDED`: API call rate limits crossed.
* `VALIDATION_FAILED`: Request body validation rules violated.
* `INTERNAL_SERVER_ERROR`: Unhandled exception within the cluster.

---

## 2. API Structural Patterns

### 2.1 Multi-Tenant Routing Strategy
Every incoming API request must indicate its tenant context. This is achieved via two primary mechanisms:
1. **Custom HTTP Header (Preferred for Staff/Integrations):** `X-Tenant-ID: weventurehub`
2. **Subdomain Resolution (Preferred for Web Clients):** The API gateway parses the origin request URL (e.g., `weventurehub.platform.io`) and translates it into the appropriate internal tenant identifier database scope.

### 2.2 Security Headers Specification
The API gateway must inject the following headers on all responses:
```http
Content-Security-Policy: default-src 'none'; frame-ancestors 'none';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

### 2.3 Pagination, Filtering, Sorting, and Searching
All list operations must accept standardized query parameters:
* **Pagination:** `?page=1&limit=10`
* **Sorting:** `?sort=-createdAt` (prefix with `-` for descending, omit or use `+` for ascending)
* **Searching:** `?search=Incubator` (runs text search index across designated indexed string fields)
* **Filtering:** Direct key-value matching or range mappings:
  * Key-Value: `?status=active`
  * Range: `?price[gte]=100&price[lte]=500`

---

## 3. Module API Specifications

### 3.1 Authentication & Profile Module

#### 3.1.1 Authenticate / Login User
* **HTTP Method:** `POST`
* **Endpoint:** `/auth/login`
* **Description:** Authenticates a tenant user and sets secure cookies containing access/refresh tokens.
* **Authentication Required:** No
* **Request Headers:**
  * `Content-Type: application/json`
  * `X-Tenant-ID: weventurehub`
* **Request Body:**
  ```json
  {
    "email": "user@weventurehub.com",
    "password": "SecurePassword123!"
  }
  ```
* **Validation Rules:**
  * `email`: Required, valid email format.
  * `password`: Required, minimum 8 characters, at least 1 uppercase letter, 1 number, and 1 special character.
* **Success Response (200 OK):**
  * *Headers:* `Set-Cookie: jwt_access_token=...; HttpOnly; Secure; SameSite=Strict; Max-Age=900`
  * *Body:*
    ```json
    {
      "success": true,
      "timestamp": "2026-06-30T12:00:00.000Z",
      "data": {
        "user": {
          "id": "usr_60b8d2",
          "firstName": "Alex",
          "lastName": "Chen",
          "role": "HUB_MEMBER"
        },
        "session": {
          "expiresAt": "2026-06-30T12:15:00.000Z"
        }
      }
    }
    ```
* **Error Responses:**
  * `401 Unauthorized` (Invalid credentials)
  * `422 Unprocessable Entity` (Validation failures)
* **Rate Limiting:** Maximum 5 attempts per IP address per 15 minutes.

#### 3.1.2 Refresh Access Token
* **HTTP Method:** `POST`
* **Endpoint:** `/auth/token/refresh`
* **Description:** Rotates expired access token using the refresh token.
* **Authentication Required:** No (Verifies signature of refresh token cookie)
* **Request Headers:** None (Cookie is sent automatically)
* **Success Response (200 OK):**
  * *Headers:* Generates a new `jwt_access_token` cookie.
  * *Body:*
    ```json
    {
      "success": true,
      "timestamp": "2026-06-30T12:15:00.000Z",
      "data": {
        "status": "Token refreshed successfully"
      }
    }
    ```

---

### 3.2 Workspace & Meeting Room Booking Module

#### 3.2.1 Retrieve All Available Spaces
* **HTTP Method:** `GET`
* **Endpoint:** `/workspaces`
* **Description:** Lists all available desks, meeting rooms, or event venues for booking.
* **Authentication Required:** Yes
* **Required Role(s):** `EXTERNAL_USER`, `HUB_MEMBER`, `STAFF`, `TENANT_ADMIN`
* **Query Parameters:**
  * `type`: Filter by asset type (`MEETING_ROOM`, `HOT_DESK`, `EVENT_VENUE`).
  * `capacity`: Minimum attendee capacity.
  * `amenities`: Comma-separated list of required amenities (e.g., `whiteboard,tv`).
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "timestamp": "2026-06-30T12:00:00.000Z",
    "data": [
      {
        "id": "spc_99e82c",
        "name": "Tesla Boardroom",
        "type": "MEETING_ROOM",
        "capacity": 12,
        "hourlyRate": 45.00,
        "currency": "USD",
        "amenities": ["whiteboard", "tv", "videoconference"],
        "status": "AVAILABLE"
      }
    ]
  }
  ```

#### 3.2.2 Create Space Booking
* **HTTP Method:** `POST`
* **Endpoint:** `/bookings`
* **Description:** Initiates a workspace or meeting room booking. If paid, triggers holding transaction logic.
* **Authentication Required:** Yes
* **Required Role(s):** `EXTERNAL_USER`, `HUB_MEMBER`, `STAFF`
* **Request Body:**
  ```json
  {
    "spaceId": "spc_99e82c",
    "startTime": "2026-07-05T14:00:00Z",
    "endTime": "2026-07-05T16:00:00Z",
    "paymentMethod": "STRIPE"
  }
  ```
* **Validation Rules:**
  * `spaceId`: Required string matching active database workspace.
  * `startTime`: ISO-8601 string. Must be at least 15 minutes in future.
  * `endTime`: ISO-8601 string. Must be greater than `startTime` by at least 30 minutes.
* **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "timestamp": "2026-06-30T12:00:00.000Z",
    "data": {
      "bookingId": "bkg_77189a",
      "status": "PENDING_PAYMENT",
      "totalAmount": 90.00,
      "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_..."
    }
  }
  ```
* **Error Responses:**
  * `400 Bad Request` (Invalid scheduling windows)
  * `409 Conflict` (Double-booking detected for the selected timeslot)

---

### 3.3 Event Ticketing & Registration Module

#### 3.3.1 Register for Event / Purchase Ticket
* **HTTP Method:** `POST`
* **Endpoint:** `/events/:eventId/register`
* **Description:** Registers an attendee and creates secure QR tickets.
* **Authentication Required:** Optional (supports guest checkout with email details)
* **Request Body:**
  ```json
  {
    "attendeeInfo": {
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane.doe@work.com"
    },
    "ticketTierId": "tier_early_99a",
    "quantity": 1,
    "couponCode": "SUMMER10"
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "timestamp": "2026-06-30T12:00:00.000Z",
    "data": {
      "registrationId": "reg_3389a1",
      "ticketCode": "tkt_e100a7b45",
      "status": "CONFIRMED",
      "qrCodeUrl": "https://storage.weventurehub.com/qrs/tkt_e100a7b45.png"
    }
  }
  ```
* **Error Responses:**
  * `410 Gone` (Selected ticket tier is sold out)
  * `422 Unprocessable Entity` (Invalid coupon code or expired promotional rules)

#### 3.3.2 Validate Ticket (QR Code Check-In Endpoint)
* **HTTP Method:** `POST`
* **Endpoint:** `/tickets/validate`
* **Description:** Used by onsite staff to process check-ins by scanning ticket QR codes.
* **Authentication Required:** Yes
* **Required Role(s):** `STAFF`, `TENANT_ADMIN`
* **Request Body:**
  ```json
  {
    "ticketCode": "tkt_e100a7b45"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "timestamp": "2026-06-30T12:00:00.000Z",
    "data": {
      "status": "VALIDATED",
      "checkInTime": "2026-06-30T12:00:00.000Z",
      "attendee": {
        "name": "Jane Doe",
        "email": "jane.doe@work.com",
        "tier": "VIP"
      }
    }
  }
  ```
* **Error Responses:**
  * `400 Bad Request` (Ticket already validated, returns previous check-in time)
  * `404 Not Found` (Invalid ticket code or forged hash signature)

---

### 3.4 Community Discussion & Chat Module

#### 3.4.1 Send Group Channel Message
* **HTTP Method:** `POST`
* **Endpoint:** `/chat/channels/:channelId/messages`
* **Description:** Sends a message in a workspace channel. Also broadcasts via WebSockets for real-time delivery.
* **Authentication Required:** Yes
* **Required Role(s):** `HUB_MEMBER`, `STAFF`, `TENANT_ADMIN`
* **Request Body:**
  ```json
  {
    "content": "Hey team, the incubation pitching deck submission portal is live!"
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "timestamp": "2026-06-30T12:00:00.000Z",
    "data": {
      "messageId": "msg_9012a4",
      "channelId": "chan_summer_cohort",
      "senderId": "usr_60b8d2",
      "content": "Hey team, the incubation pitching deck submission portal is live!",
      "createdAt": "2026-06-30T12:00:00.000Z"
    }
  }
  ```

---

## 4. API Infrastructure & Performance Optimization

### 4.1 Caching Strategy
* **Read-Heavy Endpoints:** Venues, workspaces lists, active public events, and speaker rosters must implement HTTP caching.
* **Header Configurations:** Pinned responses return `Cache-Control: public, max-age=300` (5 minutes) and utilize `ETag` validation to reduce redundant database calls.
* **Cache Invalidation:** Administrative updates to space capacities, pricing details, or scheduling entries must trigger instant cache purges on Redis clusters.

### 4.2 Idempotency Rules
* To prevent duplicate charges or double-registrations, critical creation endpoints (`POST /bookings` and `POST /events/:eventId/register`) require an idempotency key header:
  `Idempotency-Key: <UUIDv4>`
* The API gateway cache matches this key for 24 hours. Repeating requests with matching keys return the original cached response without repeating the underlying transaction or database updates.

### 4.3 Webhook Event Dispatching (Webhooks Infrastructure)
External integrations receive real-time notifications about platform milestones via transactional outbound Webhooks.

#### Supported Webhook Events
* `booking.created`
* `booking.cancelled`
* `payment.succeeded`
* `ticket.validated`

#### Webhook Payload Signature Verification
Every outbound payload contains a `X-WeVentureHub-Signature` computed using a SHA-256 HMAC algorithm over the request payload body with the tenant's webhook signing secret.

---

## 5. Implementation Priority & Roadmap

```
  ========================================================================
  [M1: AUTH] ----> [M2: CORE STORAGE] ----> [M3: BOOKING & TICKETS]
                                                    |
  [M6: ANALYTICS] <---- [M5: CHAT SYSTEM] <---------+ <---- [M4: GATEWAY]
  ========================================================================
```

1. **Authentication & Identity Service (Priority 1):** Essential for securing all endpoints.
2. **Space & Venue Database Inventory Service (Priority 2):** Necessary for building downstream booking schedules.
3. **Reservation & Ticket Generation Systems (Priority 3):** Core transactional engines.
4. **Stripe & Local Payment Gateways (Priority 4):** Enables monetization features.
5. **Real-Time WebSockets & Notifications (Priority 5):** Enhances user communication.
6. **Analytics & Administration Reporting Service (Priority 6):** Completes the enterprise admin portal capabilities.
