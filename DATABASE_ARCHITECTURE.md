# WeVentureHub Enterprise MongoDB Database Architecture
**Version:** 1.0.0  
**Database Technology:** MongoDB Enterprise Server v7.0+ (Document Model)  
**Aesthetic & Engineering Standard:** Production-Ready, High-Availability, Highly Scalable Multi-Tenant Design  

---

## 1. Multi-Tenant Logical Separation & Architecture
The database follows a **logical single-database, multi-tenant** partitioning architecture. 
* All collections containing tenant-specific metrics, transactions, or setups MUST feature a indexed `tenantId` field.
* Database operations MUST bind queries to this `tenantId` (e.g., `db.events.find({ tenantId: "weventure", status: "active" })`) to prevent cross-tenant data leaks.
* Global metadata and SaaS platform operations (billing, system templates, user master files) are managed in a central, non-tenant system partition.

---

## 2. Comprehensive Collection Specifications

### 2.1 Users Collection (`users`)
* **Purpose:** Stores identity credentials, status flags, custom attributes, and global/tenant role structures.
* **Fields & Schema:**
  * `_id` (ObjectId, Required): Unique user ID.
  * `tenantId` (String, Required): Tenant identifier.
  * `email` (String, Required): Unique within tenant context.
  * `passwordHash` (String, Required): Encrypted hash payload (Bcrypt).
  * `firstName` (String, Required): First Name.
  * `lastName` (String, Required): Last Name.
  * `avatarUrl` (String, Optional): Link to S3/Cloudinary storage.
  * `role` (String, Required): Enum [`SUPER_ADMIN`, `TENANT_ADMIN`, `STAFF`, `HUB_MEMBER`, `EXTERNAL_USER`].
  * `status` (String, Required): Enum [`ACTIVE`, `PENDING`, `SUSPENDED`].
  * `createdAt` (Date, Required): UTC timestamp of creation.
  * `updatedAt` (Date, Required): UTC timestamp of last modification.
  * `deletedAt` (Date, Optional): Soft delete timestamp.
* **Relationships:**
  * One-to-Many with `bookings` (via `userId`).
  * One-to-Many with `registrations` (via `userId`).
* **Indexes:**
  * Compound Unique Index: `{ tenantId: 1, email: 1 }`
  * Compound Index: `{ tenantId: 1, role: 1, status: 1 }`
* **Validation Rules:** Enforce schema validation (`$jsonSchema`) with email regex constraints.
* **Soft Delete Strategy:** Updates `deletedAt` attribute; standard queries append `{ deletedAt: null }`.
* **Security Considerations:** Never store plain-text passwords. Project out `passwordHash` fields on default queries.

---

### 2.2 Workspaces & Meeting Rooms Collection (`workspaces`)
* **Purpose:** Holds details on physical hot desks, conference areas, meeting rooms, and event venue spaces.
* **Fields & Schema:**
  * `_id` (ObjectId, Required): Unique space ID.
  * `tenantId` (String, Required): Tenant identifier.
  * `name` (String, Required): Readable name of room or zone.
  * `type` (String, Required): Enum [`MEETING_ROOM`, `HOT_DESK`, `EVENT_VENUE`].
  * `capacity` (Number, Required): Max attendee limit.
  * `hourlyRate` (Decimal128, Required): Base price for booking.
  * `currency` (String, Required): Default currency code (e.g., `"USD"`).
  * `amenities` (Array of Strings, Required): Features (e.g., `["tv", "whiteboard", "projector"]`).
  * `isAvailable` (Boolean, Required): Overall operational status.
  * `createdAt` (Date, Required): Creation timestamp.
  * `updatedAt` (Date, Required): Modification timestamp.
  * `deletedAt` (Date, Optional): Soft delete marker.
* **Relationships:**
  * Refenced by `bookings` (via `spaceId`).
* **Indexes:**
  * Compound Index: `{ tenantId: 1, type: 1, isAvailable: 1 }`
  * Compound Index: `{ tenantId: 1, capacity: 1 }`
* **Soft Delete Strategy:** Sets `deletedAt` attribute; items are filtered from public inventory listings.

---

### 2.3 Bookings & Reservations Collection (`bookings`)
* **Purpose:** Handles reservations of desks, rooms, and venue spaces.
* **Fields & Schema:**
  * `_id` (ObjectId, Required): Unique reservation ID.
  * `tenantId` (String, Required): Tenant identifier.
  * `userId` (ObjectId, Required): Reserving user ID.
  * `spaceId` (ObjectId, Required): Reserved workspace zone ID.
  * `startTime` (Date, Required): Starting UTC timestamp.
  * `endTime` (Date, Required): Ending UTC timestamp.
  * `totalAmount` (Decimal128, Required): Calculated reservation total.
  * `status` (String, Required): Enum [`PENDING_PAYMENT`, `CONFIRMED`, `CANCELLED`].
  * `createdAt` (Date, Required): Creation timestamp.
  * `updatedAt` (Date, Required): Modification timestamp.
* **Relationships:**
  * Belongs to `users` and `workspaces`.
* **Indexes:**
  * Compound Index: `{ tenantId: 1, spaceId: 1, startTime: 1, endTime: 1 }` (Prevents duplicate bookings).
  * Compound Index: `{ tenantId: 1, userId: 1, status: 1 }`
* **Validation Rules:** Validate that `endTime` is strictly greater than `startTime`.

---

### 2.4 Events Collection (`events`)
* **Purpose:** Core metadata, scheduling, registration parameters, and organizer mappings for community events.
* **Fields & Schema:**
  * `_id` (ObjectId, Required): Unique event ID.
  * `tenantId` (String, Required): Tenant identifier.
  * `title` (String, Required): Event headline title.
  * `description` (String, Required): Comprehensive descriptive markdown text.
  * `categoryId` (ObjectId, Required): Reference to Event Category.
  * `startTime` (Date, Required): Starting UTC timestamp.
  * `endTime` (Date, Required): Ending UTC timestamp.
  * `venueType` (String, Required): Enum [`PHYSICAL`, `VIRTUAL`, `HYBRID`].
  * `location` (Object, Optional): Contains address, room mappings, or coordinates.
  * `ticketsCapacity` (Number, Required): Total tickets available.
  * `status` (String, Required): Enum [`DRAFT`, `PUBLISHED`, `CANCELLED`].
  * `createdAt` (Date, Required): Creation timestamp.
  * `updatedAt` (Date, Required): Modification timestamp.
* **Relationships:**
  * References `event_categories` (via `categoryId`).
  * One-to-Many with `registrations` (via `eventId`).
* **Indexes:**
  * Compound Index: `{ tenantId: 1, status: 1, startTime: 1 }`
  * Text Index on `{ title: "text", description: "text" }` for search optimization.

---

### 2.5 Registrations & Tickets Collection (`registrations`)
* **Purpose:** Stores user attendance tickets, QR signatures, and confirmation metrics.
* **Fields & Schema:**
  * `_id` (ObjectId, Required): Unique ticket/registration ID.
  * `tenantId` (String, Required): Tenant identifier.
  * `eventId` (ObjectId, Required): Referenced event.
  * `userId` (ObjectId, Optional): Authenticated user, null for guests.
  * `attendeeInfo` (Object, Required): `{ firstName, lastName, email }`.
  * `ticketCode` (String, Required): Encrypted, non-guessable hash verification payload.
  * `status` (String, Required): Enum [`CONFIRMED`, `CANCELLED`, `CHECKED_IN`].
  * `checkInTime` (Date, Optional): Actual UTC check-in timestamp.
  * `createdAt` (Date, Required): Creation timestamp.
* **Relationships:**
  * Mapped to `events` and `users`.
* **Indexes:**
  * Unique Compound Index: `{ tenantId: 1, eventId: 1, ticketCode: 1 }`
  * Compound Index: `{ tenantId: 1, eventId: 1, "attendeeInfo.email": 1 }`

---

## 3. Comprehensive Entity Relationship Diagram (ERD)

```
========================================================================================
[TENANTS]
   | (1)
   |
   +---> (Many) [USERS] ------- (1) ----+---- (Many) [BOOKINGS] ------ (Many) [WORKSPACES]
   |                                    |
   +---> (Many) [EVENTS] <--- (1) ------+---- (Many) [REGISTRATIONS]
   |        |
   |        +---> (Many) [SESSIONS]
   |        +---> (Many) [SPONSORS]
   |
   +---> (Many) [CHANNELS] --- (1) ---------- (Many) [MESSAGES]
========================================================================================
```

---

## 4. Operational Data Flows

### 4.1 Room Booking Flow
1. **Selection:** Frontend queries `/workspaces` filtered by size and availability.
2. **Locking:** Backend writes `bookings` document with state `PENDING_PAYMENT` and dynamic TTL lock indexed on `{ spaceId, startTime, endTime }`.
3. **Fulfillment:** Payment confirms; state is updated to `CONFIRMED`. If validation fails or times out, the system deletes or voids the document, releasing the inventory slot.

### 4.2 Event Registration Flow
1. **Check Availability:** Client requests available seats.
2. **Hold:** Decrement capacity counter in `events` collection using atomic increment check:
   `db.events.updateOne({ _id: eventId, ticketsCapacity: { $gte: quantity } }, { $inc: { ticketsCapacity: -quantity } })`
3. **Commit:** Write a new ticket record in the `registrations` collection with a unique `ticketCode` signature, and generate the QR code asset.

---

## 5. Enterprise Scaling & Management Strategies

### 5.1 MongoDB Indexing Strategy
* Enforce compound indexing structures on frequently filtered lists to prevent in-memory sorts:
  * `{ tenantId: 1, status: 1, createdAt: -1 }`
* Use **Time-To-Live (TTL) Indexes** to automate system cleanliness:
  * Index on `expiresAt` inside temporary holds/tokens to auto-expire them after 15 minutes.
* Enforce partial index properties to keep indexes highly efficient:
  * Create unique indexes on email fields strictly where `{ deletedAt: { $exists: false } }` or `{ deletedAt: null }`.

### 5.2 Performance & Cache Optimization
* Use Redis as an in-memory cache layer in front of MongoDB for static lookup records (such as amenities configurations, category dictionaries, and tenant profile setups).
* Use the **MongoDB Aggregation Pipeline** for complex analytics and reports generation, ensuring memory limits are respected using indexing and selective `$match` filtering.

### 5.3 Sharding & Multi-Region Readiness
* To scale past resource limits on single instances, use MongoDB's database sharding.
* **Shard Key Selection:** Enforce compound shard keys: `{ tenantId: 1, _id: 1 }`. This guarantees that all documents related to a specific tenant reside together, reducing cross-shard network overhead.

### 5.4 High-Growth Scaling Plan

#### Phase 1: Small Scale (100 - 10,000 Active Users)
* Use a standard 3-Node MongoDB Replica Set (M10-M30 tier).
* All reads and writes target the Primary node. The Secondary nodes act as hot standby failover systems.

#### Phase 2: Growth Scale (10,000 - 100,000 Active Users)
* Upgrade replica hardware profiles (M50-M80 tiers) with dedicated storage performance.
* Offload read-heavy operations (such as analytical exports, historical reviews, and static logs) to secondary replication instances.

#### Phase 3: Enterprise Scale (100,000 - 1 Million+ Active Users)
* Deploy multi-zone sharding using `{ tenantId: 1 }` as the partition key.
* Ensure high-performance enterprise setups can scale horizontally, routing tenant activities to geographically proximate server regions.
