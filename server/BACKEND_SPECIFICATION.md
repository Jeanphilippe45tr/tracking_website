# SwiftTrack — Backend Feature Specification

> This document was produced by analyzing the `client/` folder (React + Vite SPA).
> It lists every feature the frontend expects so the backend in `server/` can be
> built to match. The client is already wired for the real API: all HTTP calls go
> through `client/src/api/*.js` and are toggled by `VITE_USE_MOCK` /
> `VITE_API_URL` in `client/.env`.
>
> **Expected stack:** Node.js + Express + CORS + a database (MongoDB/Postgres/SQLite).
> **Base URL:** the client calls `VITE_API_URL` (default `http://localhost:5000/api`).

---

## 1. Global API contract

### 1.1 Response conventions (taken from `src/api/client.js`)

- Content-Type: `application/json`.
- **Errors** always use the shape:
  ```json
  { "error": "Human-readable message" }
  ```
  The client reads `error.response.data.error` and shows it verbatim to the user.
- **Protected endpoints** expect the header:
  `Authorization: Bearer <JWT>` (the client stores the token under the
  `token` key in `localStorage` and attaches it with a request interceptor).
- A `401` must be returned for missing/invalid tokens.
- Unknown tracking-number lookups must return `404` with
  `{ "error": "Shipment not found" }`.
- A reachable-but-offline server must respond so the client never shows only a
  network error; the client otherwise reports "Cannot reach the server".

### 1.2 Env expectations

- `VITE_API_URL` default → backend should run on **port 5000** with `/api` prefix
  (e.g. `http://localhost:5000/api/auth/login`).

---

## 2. Authentication (admin account)

Managed by `src/api/auth.js` + the profile store in `src/lib/adminAccount.js`.

A **single admin user** account with default credentials
`admin@example.com / admin123` must exist on first boot (seeded).

| # | Endpoint | Method | Auth | Purpose |
|---|----------|--------|------|---------|
| 1 | `/auth/login` | POST | public | Sign in |
| 2 | `/auth/me` | PATCH | required | Update profile |
| 3 | `/auth/change-password` | POST | required | Change password |
| 4 | `/auth/preferences` | PATCH | required | Update app preferences |
| 5 | *(implied)* `/auth/me` | GET | required | Restore session on refresh (client persists `user` JSON in localStorage and re-reads it; a `GET /auth/me` lets the backend validate the token is still valid) |

### 2.1 `POST /auth/login`
Request: `{ "email": "...", "password": "..." }`
- Case-insensitive email match; trim whitespace.
- On success → `{ "token": "<JWT>", "user": <publicUser> }`.
- On failure → `401 { "error": "Invalid email or password" }`.

`publicUser` shape (public profile — **never include the password hash**):
```json
{
  "id": 1,
  "name": "Admin",
  "email": "admin@example.com",
  "phone": "+1 (212) 555-0142",
  "role": "admin",
  "joinedAt": "2026-01-12T09:00:00.000Z"
}
```

### 2.2 `PATCH /auth/me`
Request: `{ "name?", "email?", "phone?" }` (all optional, trimmed server-side).
Email must stay valid & unique. Returns the updated `publicUser`.
The new login **email** becomes the credential for future logins.

### 2.3 `POST /auth/change-password`
Request: `{ "currentPassword", "newPassword" }`
- Validate current password → `400 { "error": "Your current password is incorrect." }` on failure.
- New password: client enforces ≥ 8 characters; server should enforce the same.
- Record `passwordChangedAt` timestamp (shown in Settings).
- Returns `{ "ok": true }`.

### 2.4 `PATCH /auth/preferences`
Request (all optional, partial update allowed):
```json
{
  "chatWelcome": "welcome text shown in the public chat widget",
  "supportEmail": "support@swifttrack.com",
  "notifyNewMessages": true,
  "notifyStatusChanges": true,
  "defaultSpeed": 2
}
```
Returns the full merged `prefs` object. Used by:
- the public chat widget (`chatWelcome` message, `supportEmail`),
- the notifications settings,
- the live-simulation panel default speed (`defaultSpeed`, one of `1, 2, 5, 10`).

---

## 3. Shipments

Managed by `src/api/shipments.js`. Consumed by the public tracking pages and
the whole admin area.

### 3.1 Shipment data model

```json
{
  "id": 1,
  "trackingNumber": "TRK000000001",
  "senderName": "Jordan Lee",
  "receiverName": "Maya Chen",
  "receiverPhone": "+1 617 555 0184",
  "origin": "New York",
  "destination": "Boston",
  "weight": 2.5,
  "description": "Documents",
  "status": "Delivered",
  "createdAt": "<ISO>",
  "updatedAt": "<ISO>",
  "events": [ <ShipmentEvent>, ... ]
}
```

### 3.2 Shipment event model

```json
{
  "id": 101,
  "status": "In transit",
  "location": "New York Hub",
  "description": "Departed the sorting centre",
  "createdAt": "<ISO>"
}
```

### 3.3 Statuses (exact strings)

```
Created | Picked up | In transit | Out for delivery | Delivered | Delayed
```

### 3.4 Endpoints

| # | Endpoint | Method | Auth | Purpose |
|---|----------|--------|------|---------|
| 1 | `/shipments/:trackingNumber` | GET | **public** | Tracking lookup |
| 2 | `/shipments` | GET | required | Admin list |
| 3 | `/shipments` | POST | required | Create shipment |
| 4 | `/shipments/:trackingNumber/events` | POST | required | Add tracking update |

#### 3.4.1 `GET /shipments/:trackingNumber` (public → Track Result page)
- Case-insensitive match on `trackingNumber`.
- `200` → full shipment (events ordered so the UI can render a timeline).
- `404` → `{ "error": "Shipment not found" }` (dedicated "not found" UI).
- The public page shows: status badge, ETA, route, sender/receiver, weight,
  description, timestamps, timeline and a map. It shows the **receiver phone**,
  so this data is intentionally public for legitimate tracking numbers.

#### 3.4.2 `GET /shipments` (admin list → Dashboard + Shipments List)
- Return **all** shipments, newest first (`createdAt` DESC).
- The client does its own search/status-filter/pagination locally, but the
  backend may optionally support `?status=&q=&page=&limit=` later.

#### 3.4.3 `POST /shipments` (create → CreateShipment page)
Request:
```json
{
  "senderName": "...",
  "receiverName": "...",
  "receiverPhone": "...",
  "origin": "...",
  "destination": "...",
  "weight": 2.5,
  "description": "..."
}
```
Validation rules (mirrors `ShipmentForm.jsx`):
- `senderName`, `receiverName`: required.
- `receiverPhone`: required, pattern `^[0-9+()\-\s]{6,20}$`.
- `origin`, `destination`: required (free-text city names).
- `weight`: required, numeric.
- `description`: optional.

Behavior:
- Server generates the tracking number: `TRK` + 9 chars from the alphabet
  `ABCDEFGHJKLMNPQRSTUVWXYZ123456789` (no `O/0/I` confusion), e.g.
  `TRK3F9A12BC7D`. Must be unique.
- Initial `status` = `"Created"`.
- An initial **event** is auto-created: `{ status: "Created", location: origin,
  description: "Shipment created", createdAt: now }`.
- `createdAt` / `updatedAt` = now (ISO strings).
- `201` → the full created shipment (client shows the tracking number with a
  Copy button and links to the detail page).

#### 3.4.4 `POST /shipments/:trackingNumber/events` (add update → Shipment Detail)
Request:
```json
{ "status": "In transit", "location": "New York Hub", "description": "..." }
```
Validation: `status` must be one of the six statuses; `location` is required;
`description` optional.
Behavior:
- Appends the event to `events` (with its own `id` and `createdAt`).
- **Also sets the shipment's `status` to the event's status** and refreshes
  `updatedAt`.
- `404` if the tracking number is unknown.
- `200` → the **updated shipment** (client replaces its copy to refresh the
  timeline instantly).

---

## 4. Relay points (public)

`GET /relay-points?q=<city|postal|name|address>` — **public** (RelayPoint page).

Data model:
```json
{
  "id": 1,
  "name": "Relay Point Canary Wharf",
  "address": "15 Cabot Square, London E14 4QS",
  "city": "London",
  "postalCode": "E14",
  "hours": "Mon-Sat 08:00-20:00",
  "distance": 0.6
}
```
Rules:
- Empty/absent `q` → the **full list**.
- `q` matches (case-insensitive, accent-insensitive — e.g. `são paulo` should
  find `Sao Paulo`) against `city`, `postalCode`, `name` or `address`.
- Returns an array of relay points.

---

## 5. Live chat (customers ⇄ admin)

The client currently fakes this with localStorage (`src/lib/chat.js`); the file
itself documents the replacement: *"A real deployment would replace the
functions below with API calls... while keeping the same component contracts."*

Two roles in one store:
- **Visitor/customer** — anonymous, identified by a client-generated `visitorId`
  (persisted in the browser). First message creates the conversation and passes
  `name` (+ optional `email`).
- **Admin** — authenticated.

### 5.1 Data models

Conversation:
```json
{
  "id": "conv-...",        // server should generate
  "visitorId": "visitor-...",  // stable per browser
  "name": "Emma Reynolds",     // display name
  "email": "emma.r@example.com",
  "subject": "Website chat",
  "createdAt": "<ISO>",
  "updatedAt": "<ISO>",        // bubbles to top of inbox on new messages
  "messages": [ <Message>, ... ]
}
```

Message:
```json
{
  "id": "m-...",
  "from": "customer" | "admin",
  "text": "...",
  "at": "<ISO>",
  "readByAdmin": false,
  "readByCustomer": true
}
```

### 5.2 Required backend operations (map to the client store functions)

| Operation | Suggested endpoint | Notes |
|-----------|--------------------|-------|
| Create/find conversation + send customer message | `POST /chat/conversations` with `{visitorId, name, email, text}` | If a conversation for `visitorId` exists, reuse it (also update `name`/`email` from latest info); append message (`from:"customer"`, `readByAdmin:false`, `readByCustomer:true`). |
| List conversations (admin/admin dashboard) | `GET /chat/conversations` | Sorted by `updatedAt` DESC; include unread counts (`from=customer && !readByAdmin`). |
| Get one conversation (thread) | `GET /chat/conversations/:id` | Full message list. |
| Admin reply | `POST /chat/conversations/:id/messages` `{text}` | Marks `readByCustomer:false`. |
| Open conversation → mark read (admin) | `PATCH /chat/conversations/:id/read` | Sets `readByAdmin:true` on all customer messages. |
| Mark all read across inbox | `PATCH /chat/conversations/read-all` | Same, all conversations. |
| Customer opens panel → read (visitor) | `PATCH /chat/conversations/visitor/:visitorId/read` | Sets `readByCustomer:true` on admin messages. |
| Delete single conversation | `DELETE /chat/conversations/:id` | Confirm dialog in UI. |
| Delete all conversations | `DELETE /chat/conversations` | Danger-zone button. |
| New-message detection | polling or WebSocket | The inbox must feel live (`unreadForAdmin` badge, dashboard preview). Polling every few seconds is acceptable; the current UI is push-like. |

The dashboard and inbox also render an unread badge and recent 3 conversations —
expose unread counts in the list response (`unreadForAdmin`).

---

## 6. Live map / real-time tracking simulation

Client files: `LiveMap` page, `SimulationPanel` (dashboard), `LiveMappingContext`,
`src/lib/liveTracking.js`. **This feature must become server-backed.** The admin
starts a simulation for a chosen shipment; the public `/live` page (and the
tracking-result map for the same `trackingNumber`) follows the moving marker in
real time.

### 6.1 Session model

```json
{
  "status": "idle" | "running" | "paused" | "stopped" | "completed",
  "trackNumber": "TRK000000001",
  "shipmentId": 1,
  "origin": "New York",
  "destination": "Boston",
  "route": [[lat,lng], [lat,lng], [lat,lng]],  // 3-point curve origin→dest
  "progress": 0.42,                            // 0..1
  "speed": 2,                                  // 0.5..20, options 1/2/5/10
  "statusLabel": "In transit",                 // derived from progress
  "startedAt": "<ISO>",
  "updatedAt": "<ISO>"
}
```

Key behaviors to replicate server-side:
- `statusLabel` derived from `progress`: `≥1 → Delivered`, `≥0.92 → Out for
  delivery`, `≥0.35 → In transit`, `≥0.12 → Picked up`, else `Preparing pickup`.
- The simulation **advances by elapsed time** (progress = elapsed ×
  `speed / SIM_BASE_DURATION_MS`, base duration = 120 000 ms at 1× speed).
- Speed is clamped to `0.5..20`.
- At `progress ≥ 1` → `status = "completed"`, label "Delivered".
- **Only one active session** at a time globally (all tabs share one state).
- Starting is done by the admin with `{trackNumber, shipmentId, origin,
  destination, speed}`; the route is the origin→destination polyline.

### 6.2 Suggested endpoints (or equivalent WebSocket / Socket. IO)

| Endpoint | Method | Auth |
|----------|--------|------|
| `/live` (current session state) | GET | public (read-only view of position/labels) |
| `/live/start` `{trackNumber, shipmentId, origin, destination, speed}` | POST | required |
| `/live/pause` | POST | required |
| `/live/resume` | POST | required |
| `/live/stop` | POST | required |
| `/live/reset` | POST | required |
| `/live/speed` `{speed}` | POST/PUT | required |

The public pages poll `GET /live` (or subscribe over WebSocket) and render the
moving marker; the client computes `positionAt(route, progress)` and
`trailAt(...)` locally, so the server only needs to maintain `progress`
accurately over time.

### 6.3 Optional coupling with shipments

When a simulation completes, the corresponding shipment could be updated to
`Delivered` (the tracking page shows a "Live" badge whenever `live.trackNumber
=== shipment.trackingNumber` and a live marker).

---

## 7. Contact form

`src/pages/Contact.jsx` — currently simulates the send locally. Needs:

`POST /contact` (public):
```json
{
  "name": "...",          // required
  "email": "...",         // required, valid email
  "subject": "tracking" | "address" | "customs" | "relay" | "quote" | "other",
  "message": "...",       // required, min 10 chars
  "trackingNumber": "TRK..."  // optional
}
```
Response: `200/201 { "ok": true }` → the client shows the success alert.
Consider storing submissions (e.g. for the admin inbox or an email/notifier).

---

## 8. Public content pages (no backend required)

These are static marketing/legal pages, served fully by the frontend. Listed for
completeness; **no endpoints needed**:

- Home `/`, Services `/services`, Pricing `/pricing`, About `/about`,
  Help `/help`, Terms `/terms`, Privacy `/privacy`, 404 page.
- Track landing `/track` (search box + demo tracking numbers → demo numbers are
  sample data; once the DB is seeded they should exist, e.g. `TRK000000001`).
- Relay points `/relay-points` (uses `GET /relay-points` above).
- Live map `/live` (uses the live-tracking endpoints above).

---

## 9. Security & misc requirements

1. **Password storage:** hash (bcrypt/argon2). The password must never appear in
   any response (the mock exposes only `publicUser` without credentials).
2. **JWT:** signed token in the login response; middleware on the admin routes
   returns `401 { "error": "..." }` when absent/invalid.
3. **CORS:** enabled for the dev origin (Vite dev server, e.g.
   `http://localhost:5173`).
4. **Rate limiting / input sanitation** for public endpoints (tracking lookup,
   relay search, contact form, chat) is recommended.
5. **Seed data:** to mirror the demo mode, seed the database with:
   - the admin account (`admin@example.com` / `admin123`),
   - ~7 shipments covering every status — including `TRK000000001`
     (Delivered, 5 timeline events) which is the showcase/demo number and other
     demo numbers used on the track page,
   - ~8 relay points (New York ×2, London ×2, Paris, Berlin, Singapore,
     Toronto) as in `mockData.js`.
6. **Timestamps:** all dates as ISO 8601 strings (`new Date(...).toISOString()`
   parseable), e.g. `2026-10-23T09:15:00.000Z`.
7. **IDs:** integers or UUIDs — the client treats them as opaque (used as
   React `key`s; shipments' `id` also picks a fake carrier label, so any unique
   value is fine).

---

## 10. Quick endpoint summary

```
PUBLIC
  GET    /api/shipments/:trackingNumber          # tracking lookup
  GET    /api/relay-points?q=                    # relay point search
  GET    /api/live                               # live simulation state
  POST   /api/contact                            # contact form
  POST   /api/chat/conversations                 # visitor starts chat / sends msg
  GET    /api/chat/conversations/visitor?visitorId=   # visitor pulls own thread
  PATCH  /api/chat/conversations/visitor/read    # visitor read receipts
  POST   /api/notifications/subscribe            # "Notify me" (tracking + email)
  GET    /api/notifications/unsubscribe?token=   # one-time unsubscribe (email link)
  POST   /api/notifications/newsletter           # footer newsletter signup

ADMIN (Bearer token)
  POST   /api/auth/login
  GET    /api/auth/me
  PATCH  /api/auth/me
  POST   /api/auth/change-password   # bumps tokenVersion -> old JWTs die
  PATCH  /api/auth/preferences
  GET    /api/shipments
  POST   /api/shipments
  PATCH  /api/shipments/:trackingNumber   # edit fields (route locked when delivered)
  DELETE /api/shipments/:trackingNumber   # remove shipment (+ events, subs)
  POST   /api/shipments/:trackingNumber/events   # status transitions enforced
  GET    /api/contact                    # contact inbox
  PATCH  /api/contact/:id/read
  DELETE /api/contact/:id
  GET    /api/chat/conversations
  GET    /api/chat/conversations/:id
  POST   /api/chat/conversations/:id/messages
  PATCH  /api/chat/conversations/:id/read
  PATCH  /api/chat/conversations/read-all
  DELETE /api/chat/conversations/:id
  DELETE /api/chat/conversations
  POST   /api/live/start | /live/pause | /live/resume | /live/stop | /live/reset | /live/speed
```

## Security & background behaviour (added)

- `helmet`, rate limiting (600/15min API floor, 20/15min on /api/auth,
  20/30min on /api/chat), CORS allow-list via `ALLOWED_ORIGIN` (unset = open, dev).
- Password change bumps `tokenVersion`; every previously issued JWT dies.
- Emails: SMTP via `SMTP_*` env, otherwise log-mode. Fires on contact/chats
  (to the staff inbox), status changes + completion (to "Notify me" subscribers).
- Shipment status transitions enforce a forward-flow (Delivered terminal,
  Delayed resumes only). The live simulation completion writes the
  `Delivered` event onto the linked shipment and notifies subscribers.
