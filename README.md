# StudentOS

**A student dashboard for attendance, class schedules, academic calendars, marks, and semester results.**

StudentOS helps students answer three everyday questions: *Which class is next? Which subjects are below the attendance requirement? How have my results changed across semesters?* Students review and manage their own records, while administrators publish the academic information shared across accounts.

Instead of tracking attendance in a notebook and results in a spreadsheet, students get one dashboard that calculates thresholds, flags risks, and exports clean reports.

---

## Key Features

### 📊 Subject-by-Subject Attendance

Every subject is checked against the **75% attendance requirement**.

For a subject below the threshold, the dashboard calculates how many consecutive classes the student must attend to recover. A subject with no recorded classes shows **N/A** and does not raise an alert.

The ledger supports these entry types:

* **Present** — counted as attended
* **Absent** — counted as held, not attended
* **OFF** — class not taken by the teacher (non-counting)
* **Event / Holiday** — calendar closures (non-counting)
* **Reset** — clear an entry

---

### 🗓️ Timetable & Academic Calendar

* Weekly timetable with configurable time slots
* Mobile-friendly day-by-day timetable view
* Academic calendar with holidays, exams, and events
* Admin management of calendar and semester dates
* Calendar-derived current semester or break

When an admin saves an Event, Exam, or Holiday, matching **automatic closure entries** are written to the attendance ledger for every affected slot and student. Closures remain visible and exportable for auditability, but never count as a missed class.

---

### 🎓 Marks & Semester Results

* Record subject-wise marks
* Review **SGPA** and **YGPA** alongside attendance
* Navigate across an eight-semester structure
* Revisit earlier semester records at any time

---

### 📈 Analytics & Global Search

* Charts for attendance and academic performance
* Dashboard with key metrics, semester progress, and academic quote
* Global search across the application

---

### 📄 Attendance Exports

Download attendance records as:

* **PDF** — for sharing
* **Excel workbook** — for analysis
* **CSV** — for importing into another tool

Exports include closure entries so the full ledger is preserved.

---

### 🌗 Day & Night Mode

An explicit day/night preference applies to every route, including sign-in, dialogs, and charts. It is saved in the browser, synchronized across tabs, and applied before first paint to avoid flashing.

---

### 🔐 Role-Based Access

* Server-enforced **student** and **admin** roles
* Salted password hashing (scrypt) and session-based login
* Private per-student copies of shared records
* No public signup and no default passwords

---

## How It Works

### Example attendance calculation

```text
Attended:  14 of 20 counted classes  →  70%   (below 75%)

Attend the next 4 classes:
Attended:  18 of 24 counted classes  →  75%   (requirement met)
```

A scheduled class cancelled for a holiday adds nothing to either count.

### Core workflow

**Sign in → Set up timetable → Record attendance → Track marks → Review analytics → Export**

---

## Architecture

StudentOS is a three-tier application: a React single-page dashboard, a dependency-light Node.js HTTP API, and MongoDB for persistence. The backend is the single authority for identity, roles, record ownership, and attendance-closure rules. The dashboard only presents data and sends requests.

### 1. System overview

```text
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                                                             │
│  React 18 SPA (HashRouter)                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐ │
│  │   Pages    │→ │  Zustand   │→ │  Service layer         │ │
│  │ + Components│  │   Store    │  │  localDataService      │ │
│  │            │← │            │← │  authService           │ │
│  └────────────┘  └─────┬──────┘  │  storageService (fetch)│ │
│                        │         └───────────┬────────────┘ │
│   useDataSync (15 s refresh / focus)         │              │
└──────────────────────────────────────────────┼──────────────┘
                                               │ JSON over HTTP
                                               │ HttpOnly session cookie
                                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  NODE.JS API  (backend/index.mjs)           │
│                                                             │
│  Origin check → Auth → Role & ownership → Validation        │
│        → Business rules (closures, personal copies)         │
│        → MongoDB driver                                     │
│                                                             │
│  Also serves the compiled dashboard (dist/) in production   │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                         MONGODB                             │
│  Shared collections · Private collections · Personal copies │
│  Sessions (TTL) · Login failures (TTL)                      │
└─────────────────────────────────────────────────────────────┘
```

---

### 2. Runtime modes

| Mode | Dashboard | API | How it runs |
| ---- | --------- | --- | ----------- |
| **Development** | Vite dev server on **5500** | Node API on **5501** | Vite proxies `/api` to `localhost:5501` |
| **Production / go-live** | Static files in `dist/` | Node API on `PORT` | One Node process serves both the API and the compiled dashboard; unknown paths fall back to `index.html` |

Because the dashboard and API share one origin in production, the session cookie, origin check, and routing need no separate CORS layer.

---

### 3. Frontend architecture

```text
frontend/src/
│
├── main.tsx / App.tsx        Entry point, HashRouter, lazy-loaded routes
│
├── pages/                    One component per screen
│     Dashboard · Timetable · Schedule · Attendance · Marks
│     YGPA/SGPA · Calendar · Holidays · Subjects · Analytics
│     Profile · Settings · Admin Panel · Academic Calendar Mgmt · Auth
│
├── components/
│     layout/    MainLayout · Sidebar · Navbar · BottomNav
│     common/    GlassModal · StatCard · ToastContainer · ThemeToggle
│                GlobalSearchModal · MobileTimetable · ProfileAvatar …
│     dashboard/ AcademicProgressTracker
│
├── store/useAppStore.ts      Zustand: single source of client state
├── services/                 API adapters (fetch wrappers)
├── hooks/                    useDataSync · useAcademicClock · useSchedule …
├── context/                  Theme · Toast · Schedule providers
├── utils/                    Attendance threshold, calendar engine,
│                             closure logic, PDF/Excel/CSV export
└── lib/                      Zod validation · optional Firebase init
```

**Layer responsibilities**

| Layer | Responsibility |
| ----- | -------------- |
| **Pages** | Compose UI for one route; read state from the store; call store actions |
| **Store (Zustand)** | Holds the signed-in user, academic records, selected semester, and theme; updates only after a successful server write |
| **Services** | Translate store actions into `/api/collections/...` requests; keep the original function names stable |
| **Hooks** | Background refresh, academic clock, schedule helpers |
| **Utils** | Pure, tested logic: 75% threshold and recovery plan, calendar-derived semester, closure handling, exports |
| **Context** | Cross-cutting providers for theme, toasts, and schedule |

**Routing and access**

* Every route except `/login` is wrapped in a **ProtectedRoute** that waits for the session check, then redirects unauthenticated users to the sign-in page.
* Routes are **lazy-loaded** with a skeleton fallback to keep the first load small.
* `/admin` and `/admin/calendar` are shown only to administrators in the UI, and the server independently rejects admin-only writes.

**Data refresh**

`useDataSync` refetches shared data every **15 seconds**, on window focus, and when the tab becomes visible. It skips the refresh while a dialog is open or the tab is hidden, so an admin publication reaches students without interrupting a form or changing the semester being viewed.

---

### 4. Backend request pipeline

Every request passes through the same ordered checks. A request stops at the first check it fails.

```text
Incoming request
      │
      ▼
┌──────────────────┐
│ Static or /api ? │── not /api ──► Serve dist/ file (or index.html)
└────────┬─────────┘
         │ /api
         ▼
┌──────────────────┐
│ Method allowed?  │  GET · POST · PUT · DELETE        else 405
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Origin check     │  every non-GET request            else 403
└────────┬─────────┘
         ▼
┌──────────────────┐
│ /api/health      │  public (database ping)
│ /api/login       │  public (throttled)
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Session lookup   │  cookie → SHA-256 hash → sessions  else 401
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Route resolution │  /api/session · /logout · /password · /reset
│                  │  /api/collections/:name[/:key]
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Role + ownership │  admin vs student, read-only accounts   else 403
│ Body validation  │  JSON only, ≤ 1 MB, protected fields    else 400/413/415
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Business rules   │  personal copies · closure sync · closure guard
└────────┬─────────┘
         ▼
      MongoDB  →  JSON response (Cache-Control: no-store)
```

**API surface**

| Endpoint | Method | Access | Purpose |
| -------- | ------ | ------ | ------- |
| `/api/health` | GET | Public | Database ping |
| `/api/login` | POST | Public | Email and password sign-in |
| `/api/session` | GET | Signed in | Current user profile |
| `/api/logout` | POST | Signed in | End the session |
| `/api/password` | POST | Signed in | Change password (invalidates all sessions) |
| `/api/reset` | POST | Admin | Reset shared academic data |
| `/api/collections/:name` | GET | Signed in | List records visible to the caller |
| `/api/collections/:name/:key` | GET | Signed in | Read one record |
| `/api/collections/:name` | PUT | Role-dependent | Create or replace a record |
| `/api/collections/:name/:key` | DELETE | Role-dependent | Delete a record |
| `/api/collections/:name` | DELETE | Role-dependent | Clear a collection |

All academic data uses the same generic collection endpoints. A fixed allow-list maps each collection to its key field, so unknown collections return `404`.

---

### 5. Authentication and session flow

```text
Sign in
   │  POST /api/login {email, password}
   ▼
Throttle check ── 5 failures in 15 min for this IP + email ──► 429
   │
   ▼
Find account by normalized email
   │
   ▼
scrypt(password, salt) → timingSafeEqual ── mismatch ──► 401, count failure
   │ match
   ▼
Clear failure counter
Generate 32 random bytes → token
Store SHA-256(token) + uid + expiry in `sessions`
   │
   ▼
Set-Cookie: studentos_session=<token>; HttpOnly; SameSite=Lax; Max-Age=7d
            (+ Secure in production)
```

| Property | Implementation |
| -------- | -------------- |
| Password storage | Per-user random salt with **scrypt**; compared in constant time |
| Session token | 256-bit random value; only its **SHA-256 hash** is stored |
| Session lifetime | 7 days, removed automatically by a MongoDB **TTL index** |
| Cookie | `HttpOnly`, `SameSite=Lax`, `Secure` in production |
| Brute-force defense | 5 failed attempts per IP + email, then a 15-minute lockout (TTL-expired) |
| Password change | Requires the current password and invalidates every session for that account |
| Account creation | No public signup; the initial student and admin come from environment variables |

---

### 6. Data model

**Collections and key fields**

| Collection | Key | Scope | Contents |
| ---------- | --- | ----- | -------- |
| `students` | `uid` | Accounts | Profiles, roles, password hashes (never returned to clients) |
| `subjects` | `id` | Shared + personal copy | Subject list |
| `timetable` | `id` | Shared + personal copy | Weekly class slots |
| `holidays` | `id` | Shared + personal copy | Holidays |
| `calendarEvents` | `id` | Shared + personal copy | Events and exams |
| `assignments` | `id` | Shared + personal copy | Assignments |
| `notices` | `id` | Shared + personal copy | Notices |
| `academicCalendar` | `id` | Shared + personal copy | Semester dates |
| `settings` | `key` | Shared + personal copy | Saved settings |
| `attendance` | `id` | **Private** | Per-subject attendance totals |
| `attendanceLedger` | `id` | **Private** | Present, Absent, OFF, Event, Holiday, Reset entries |
| `marks` | `id` | **Private** | Subject marks |
| `semesterResults` | `id` | **Private** | SGPA and YGPA results |
| `personalRecords` | collection + account + record key | Per account | Student overrides of shared records |
| `studentAssignments` | `id` + `studentId` | Per account | Per-student assignment records |
| `sessions` | token hash | System | Active sessions (TTL) |
| `loginFailures` | throttle key | System | Failed-login counters (TTL) |

**Indexes created on startup**

* Unique index on every collection's key field
* Unique `students.email`
* Unique `personalRecords` on `(collection, studentId, recordKey)`
* Unique `sessions.tokenHash`, with TTL on `expiresAt`
* `loginFailures` unique key, with TTL on `expiresAt`
* `attendanceLedger` on `(closureSource, studentId)` for fast closure replacement

---

### 7. Shared records and personal copies

Administrators publish academic information that every student sees. Students can still customize their own view without changing anyone else's.

```text
                  ┌───────────────────────────┐
  Admin writes →  │  Shared collection        │  baseline + _sharedRevision
                  └─────────────┬─────────────┘
                                │
                                ▼
                  ┌───────────────────────────┐
  Student edits → │  personalRecords          │  override + baseRevision
                  │  (account-scoped)         │  or deleted: true
                  └─────────────┬─────────────┘
                                │
                                ▼
                  mergePersonalRecords(shared, personal)
                                │
                                ▼
                  What the student sees
```

**Merge rules**

1. Start from the shared records.
2. Apply each of the student's overrides **only if** its `baseRevision` still equals the shared record's current `_sharedRevision`.
3. If the override is marked deleted, hide the record; otherwise replace it.
4. If an admin has republished the record since, the older personal copy is **ignored**, so a new publication always supersedes stale edits.

This keeps one student's edits from leaking to others while still letting admin updates take effect.

---

### 8. Attendance and closure engine

Attendance has two kinds of ledger entries:

| Entry | Counts toward held/attended? |
| ----- | ---------------------------- |
| Present | Yes (attended) |
| Absent | Yes (held, not attended) |
| OFF | No (class not taken) |
| Event / Holiday | No (calendar closure) |
| Reset | Clears an entry |

**Automatic closure flow**

```text
Admin or student saves an Event / Exam / Holiday
                    │
                    ▼
   Remove previous closure entries for that source
                    │
                    ▼
   Read timetable + academic calendar
                    │
                    ▼
   closureLedgerEntries(): one entry per scheduled slot
   on the affected dates, for every affected student
                    │
                    ▼
   Bulk upsert into attendanceLedger
   (automaticClosure: true, closureSource: "holidays:<id>")
```

**Guards**

* Closure entries are marked `automaticClosure` and **cannot be edited or deleted directly**; they change only when the calendar record changes.
* A Present or Absent entry for the **same student, subject, session type, and day** as a closure is rejected with `409`.
* Deleting a holiday or event removes its closure entries; clearing the whole collection removes all of them.
* Closure entries stay in the ledger and in exports for auditability.

**Threshold logic (client and tested)**

`getSubjectAttendance` computes held, attended, and percentage; a subject is below the minimum when its percentage is under **75%**. `getAttendancePlan` returns how many classes can still be missed, or how many consecutive classes are needed to recover. Subjects with no classes return `N/A` and never alert.

---

### 9. Authorization matrix

| Action | Student | Admin |
| ------ | :-----: | :---: |
| Read shared collections | ✅ | ✅ |
| Read own private data (attendance, ledger, marks, results) | ✅ | ✅ (all students) |
| Read another student's private data | ❌ | ✅ |
| Write shared collections (publish to everyone) | ❌ | ✅ |
| Write personal copy of a shared record | ✅ | n/a |
| Write own attendance, ledger, marks, results | ✅ | ✅ (any student) |
| Edit own profile (permitted fields only) | ✅ | ✅ |
| Create or delete student accounts | ❌ | ✅ |
| Delete core bootstrap accounts | ❌ | ❌ |
| Write automatic closure entries directly | ❌ | ❌ |
| Reset shared data | ❌ | ✅ |

Accounts with a read-only `dataAccess` setting are rejected on every write. The server derives ownership from the session, never from a client-supplied `studentId`.

---

### 10. Security layers

| Layer | Protection |
| ----- | ---------- |
| **Transport / cookie** | `HttpOnly`, `SameSite=Lax`, `Secure` in production |
| **Origin** | Non-GET requests must come from the configured `APP_ORIGIN` |
| **Authentication** | scrypt hashes, hashed session tokens, login throttling |
| **Authorization** | Server-side role checks and per-record ownership checks |
| **Input** | JSON content type required, 1 MB body limit, record key validation |
| **Injection** | Keys starting with `$` or containing `.` are rejected; `_id`, `role`, `passwordHash`, and revision fields are protected |
| **Output** | Password hashes and internal fields are stripped from every response; `Cache-Control: no-store`; `X-Content-Type-Options: nosniff` |
| **Startup** | Refuses a database lacking the clean-install marker; never deletes an existing database |
| **Repository** | `check:repository` scans for credential patterns, private key files, and archives before commit |

---

### 11. Bootstrap and initialization

```text
npm run dev:api  /  npm start
        │
        ▼
Require MONGODB_URI → connect (with DNS fallback handling)
        │
        ▼
Create indexes
        │
        ▼
initializeCleanDatabase()
   ├─ new database → create 1 student + 1 admin from env vars
   ├─ marked clean install → preserve all saved data
   └─ unmarked existing database → refuse to start
        │
        ▼
Listen on PORT
```

---

### 12. Optional Firebase layer

```text
VITE_FIREBASE_ENABLED=false   →  Firebase code path is inert (default)
VITE_FIREBASE_ENABLED=true    →  Firebase Web SDK initializes in the browser
```

Firebase is an **isolated extension**. It initializes the Web SDK only; authentication, records, and uploads stay on the MongoDB-backed API. Firestore and Storage ship with **deny-all rules**, so they remain inaccessible to client SDKs until you deliberately build and authorize a feature.

---

### 13. Testing and CI

| Test file | Covers |
| --------- | ------ |
| `attendanceThreshold` | 75% rule and recovery plan |
| `attendanceClosures` | Closure generation and non-counting behavior |
| `calendarActivity` | Calendar date and activity logic |
| `personalRecords` | Shared/personal merge and revision handling |
| `profileFields` | Which profile fields a user may change |
| `requestOrigin` | Origin allow-list |
| `bootstrap` | Clean-database initialization |
| `firebaseSetup` | Firebase files and deny-all rules |

GitHub Actions runs on every push and pull request: `npm ci` → `check:repository` → `npm test` → `npm run build`.

---

### Design principle

> **The server decides. The dashboard presents.**

Roles, ownership, personal-copy merging, and closure rules live in the backend. The client cannot choose another student's records, edit an automatic closure, or promote itself to administrator.

---

## Technology Stack

| Layer                | Technology                                            |
| -------------------- | ----------------------------------------------------- |
| Frontend             | React 18, TypeScript, Vite                            |
| UI                   | Tailwind CSS 4, Motion, Lucide                        |
| Navigation & State   | React Router, Zustand                                 |
| Validation           | Zod                                                   |
| Charts & Reports     | Recharts, jsPDF, write-excel-file                     |
| Backend              | Node.js 24                                            |
| Database             | MongoDB                                               |
| Optional Integration | Firebase Web SDK (disabled by default)                |
| Testing & CI         | Node.js test runner, GitHub Actions                   |

---

## Environment Variables

Create a `.env` file in the project root (a template is provided as `.env.example`):

```env
MONGODB_URI=
MONGODB_DB=studentos_clean
PORT=5501
APP_ORIGIN=http://localhost:5500

INITIAL_STUDENT_EMAIL=student@example.com
INITIAL_STUDENT_PASSWORD=
INITIAL_ADMIN_EMAIL=admin@example.com
INITIAL_ADMIN_PASSWORD=
```

### Environment variable descriptions

| Variable                    | Purpose                                                        |
| --------------------------- | -------------------------------------------------------------- |
| `MONGODB_URI`               | Private MongoDB connection string with read/write access       |
| `MONGODB_DB`                | A **new, empty** database name for this installation           |
| `PORT`                      | API port (default `5501`)                                      |
| `APP_ORIGIN`                | Allowed origin; `http://localhost:5500` for local development  |
| `INITIAL_STUDENT_EMAIL`     | Student login email                                            |
| `INITIAL_STUDENT_PASSWORD`  | Student password, 12–128 characters                            |
| `INITIAL_ADMIN_EMAIL`       | Admin login email                                              |
| `INITIAL_ADMIN_PASSWORD`    | A different admin password, 12–128 characters                  |

> **Important:** Never commit `.env` to Git. Keep database credentials and passwords in server-only variables, never in `VITE_*` values, which are visible in browser builds.

### Optional Firebase

Firebase is **disabled by default** (`VITE_FIREBASE_ENABLED=false`). Enabling it initializes the Firebase Web SDK only; login, storage, and uploads continue to use the MongoDB-backed application. Deny-all Firestore and Storage rules are included. See the [setup guide](frontend/README.md) for details.

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd StudentOS
```

### 2. Install dependencies

Requires **Node.js 24** and a new, empty MongoDB database.

```bash
npm ci
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Fill in the values described above.

### 4. Start the API

```bash
npm run dev:api
```

### 5. Start the dashboard (second terminal)

```bash
npm run dev
```

Open:

```text
http://localhost:5500
```

Sign in with the student or admin account you configured.

### First startup

On first startup the API creates **one student and one administrator** with salted password hashes. An empty timetable and attendance ledger are expected. Later startups preserve saved records, and editing the initial-password variables does not reset existing passwords. To change a password, use **Settings**.

---

## Build & Check

| Command                    | Purpose                                                    |
| -------------------------- | ---------------------------------------------------------- |
| `npm test`                 | Run the automated tests                                    |
| `npm run check:repository` | Scan project files for common credential patterns          |
| `npm run build`            | Type-check and build the frontend into `dist/`             |
| `npm start`                | Serve the built frontend and API                           |
| `npm run go-live`          | Build, then serve locally in production mode               |

For local use of the built application, set `APP_ORIGIN=http://localhost:5501`.

---

## Deployment

GitHub stores the source, but **GitHub Pages alone cannot run this Node/MongoDB backend.**

Deploy to a Node-capable host:

1. Set the private server environment variables
2. Set `NODE_ENV=production`
3. Set `APP_ORIGIN` to the exact public HTTPS origin
4. Allow the host to reach MongoDB
5. Run `npm ci && npm run build`, then `npm start`

---

## Key Design Principles

### Per-Subject, Not Overall

The 75% requirement is evaluated for each subject. The overall figure is context, not a substitute.

### Closures Are Not Absences

Holidays, events, and exams stay visible in the ledger without changing held, attended, or percentage values.

### Server-Owned Authorization

Account scope and roles are enforced by the backend. Student copies of shared records are keyed by account, so one student cannot reach another's data.

### Clean Starting State

No personal data, passwords, or academic history are bundled. The app refuses to start against an existing database without its initialization marker, and never deletes data.

### Accessible Interface

Visible focus states, keyboard-operable controls, actionable errors, and responsive layouts verified from 320px phones to desktop.

---

## Project Structure

```text
StudentOS/
├── frontend/
│   ├── src/
│   │   ├── components/     (common, layout, dashboard)
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── services/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── lib/
│   │   └── data/
│   ├── public/
│   ├── README.md           (setup guide)
│   ├── DESIGN.md           (visual design)
│   └── UX-CONTRACT.md      (interface behavior)
│
├── backend/                (API, bootstrap, attendance closures)
├── tests/                  (attendance, calendar, profiles, setup)
├── scripts/                (repository credential check)
├── .github/workflows/      (CI checks)
│
├── firebase.json
├── firestore.rules
├── storage.rules
├── .env.example
└── package.json
```

---

## Project Guides

* [Setup and account initialization](frontend/README.md)
* [Visual design](frontend/DESIGN.md)
* [Interface behavior](frontend/UX-CONTRACT.md)

---

## Status

StudentOS supports the complete core workflow:

**Sign In → Timetable → Attendance → Marks & Results → Analytics → Export**

Every push and pull request runs repository checks, the automated tests, and a production build through GitHub Actions.

---

## Core Concept

> **StudentOS turns scattered attendance, schedule, and result records into one clear, trustworthy student dashboard.**

The goal is to help students notice attendance risks early and understand their academic progress, while giving administrators one reliable place to manage shared academic information.
