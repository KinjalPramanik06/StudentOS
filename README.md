<div align="center">

# 🎓 StudentOS

### Your attendance, schedule, and results — one dashboard.

*Which class is next? Which subject is at risk? How are my results trending?*

<br>

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-6-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

[Features](#-features) · [Architecture](#-architecture) · [Tech Stack](#-tech-stack) · [Quick Start](#-quick-start) · [Structure](#-project-structure)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 📊 Smart Attendance
Every subject is checked against the **75% rule**. Below it? StudentOS tells you exactly how many classes to attend to recover.

</td>
<td width="50%" valign="top">

### 🗓️ Timetable & Calendar
Weekly timetable, holidays, exams, and events. Closures never count as a missed class.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🎓 Marks & Results
Subject marks plus **SGPA / YGPA** across eight semesters, side by side with attendance.

</td>
<td width="50%" valign="top">

### 📈 Analytics
Charts, progress tracking, and a dashboard that surfaces what needs attention first.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 📄 One-Click Exports
Download attendance as **PDF**, **Excel**, or **CSV**.

</td>
<td width="50%" valign="top">

### 🔎 Global Search
Jump to any subject, class, or record from anywhere in the app.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🌗 Day & Night Mode
Applied before first paint, synced across tabs, and honored on every screen.

</td>
<td width="50%" valign="top">

### 🔐 Student & Admin Roles
Server-enforced roles. Admins publish shared data; students keep their own private records.

</td>
</tr>
</table>

### Attendance ledger at a glance

| Entry | Effect |
| :---: | :----- |
| ✅ **Present** | Counts as attended |
| ❌ **Absent** | Counts as held, not attended |
| 💤 **OFF** | Teacher didn't take the class — *not counted* |
| 🎉 **Event / Holiday** | Calendar closure — *not counted* |
| ♻️ **Reset** | Clears the entry |

---

## 🏗️ Architecture

> **The server decides. The dashboard presents.**

### System overview

```mermaid
flowchart LR
    subgraph Browser["🖥️ Browser"]
        UI["React SPA<br/>Pages + Components"]
        Store["Zustand Store"]
        Svc["Service Layer"]
        UI <--> Store <--> Svc
    end

    subgraph Server["⚙️ Node.js API"]
        Guard["Origin · Auth · Roles"]
        Rules["Business Rules"]
        Guard --> Rules
    end

    DB[("🍃 MongoDB")]

    Svc -- "JSON + HttpOnly cookie" --> Guard
    Rules <--> DB
```

### Frontend layers

```mermaid
flowchart TD
    Pages["📄 Pages<br/>Dashboard · Attendance · Marks · Calendar · Admin"]
    Comp["🧩 Components<br/>Layout · Common · Dashboard"]
    Store["🗃️ Zustand Store"]
    Hooks["🪝 Hooks<br/>useDataSync · useAcademicClock"]
    Services["🔌 Services<br/>API adapters"]
    Utils["🧮 Utils<br/>Attendance · Calendar · Exports"]

    Pages --> Comp
    Pages --> Store
    Store --> Services
    Store --> Utils
    Hooks --> Store
```

### Backend request pipeline

```mermaid
flowchart LR
    A["📨 Request"] --> B{"Origin<br/>allowed?"}
    B -- no --> X1["403"]
    B -- yes --> C{"Valid<br/>session?"}
    C -- no --> X2["401"]
    C -- yes --> D{"Role &<br/>ownership?"}
    D -- no --> X3["403"]
    D -- yes --> E["✅ Validate<br/>body"]
    E --> F["⚙️ Business<br/>rules"]
    F --> G[("🍃 MongoDB")]
```

### Sign-in flow

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant A as ⚙️ API
    participant D as 🍃 MongoDB

    U->>A: POST /api/login
    A->>D: Check throttle (5 tries / 15 min)
    A->>D: Find account by email
    A->>A: scrypt verify (constant-time)
    A->>D: Store SHA-256 of session token
    A-->>U: HttpOnly cookie (7 days)
```

### Attendance closure engine

```mermaid
flowchart TD
    S["📅 Holiday / Event / Exam saved"] --> R["Clear old closure entries"]
    R --> T["Read timetable + academic calendar"]
    T --> G["Generate one entry per affected class"]
    G --> W[("attendanceLedger")]
    W --> L["🔒 Locked: can't be edited directly"]
    W --> B["🚫 Present / Absent blocked for that class & day"]
```

### Who can do what

| Action | 🎓 Student | 🛡️ Admin |
| :----- | :--------: | :------: |
| Read shared timetable, calendar, subjects | ✅ | ✅ |
| Read own attendance, marks, results | ✅ | ✅ |
| Read another student's records | ❌ | ✅ |
| Publish shared data to everyone | ❌ | ✅ |
| Customize a personal copy | ✅ | — |
| Manage student accounts | ❌ | ✅ |
| Edit automatic closure entries | ❌ | ❌ |

---

## 🧰 Tech Stack

| | Technology |
| :-- | :-- |
| 🎨 **Interface** | React 18 · TypeScript · Tailwind CSS 4 · Motion |
| 🧭 **State & Routing** | Zustand · React Router |
| 📊 **Charts & Reports** | Recharts · jsPDF · write-excel-file |
| ✅ **Validation** | Zod |
| ⚙️ **Backend** | Node.js 24 |
| 🍃 **Database** | MongoDB |
| 🔥 **Optional** | Firebase Web SDK |
| 🧪 **Quality** | Node test runner · GitHub Actions |

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone <repository-url>
cd StudentOS

# 2. Install
npm ci

# 3. Configure
cp .env.example .env      
```

Fill in `.env`:

| Variable | What to enter |
| :-- | :-- |
| `MONGODB_URI` | Private MongoDB connection string |
| `MONGODB_DB` | A **new, empty** database name |
| `INITIAL_STUDENT_EMAIL` / `INITIAL_STUDENT_PASSWORD` | Student login |
| `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` | Admin login |
| `APP_ORIGIN` | `http://localhost:5500` for development |

```bash
# 4. Start the API
npm run dev:api

# 5. Start the dashboard 
npm run dev
```

Open **http://localhost:5500** and sign in. 🎉

> 🔒 **Never commit `.env`.** Keep credentials in server-only variables, never in `VITE_*` values — those are visible in the browser.

### Handy commands

| Command | Does |
| :-- | :-- |
| `npm test` | Run the automated tests |
| `npm run build` | Type-check and build into `dist/` |
| `npm start` | Serve the built app and API |
| `npm run check:repository` | Scan for leaked credentials |

---

## 📁 Project Structure

```text
StudentOS/
├── 🎨 frontend/
│   ├── src/
│   │   ├── pages/          Screens
│   │   ├── components/     Layout · common · dashboard
│   │   ├── store/          Zustand state
│   │   ├── services/       API adapters
│   │   ├── hooks/          Sync · clock · schedule
│   │   ├── utils/          Attendance · calendar · exports
│   │   └── context/        Theme · toast · schedule
│   ├── README.md           Setup guide
│   ├── DESIGN.md           Visual design
│   └── UX-CONTRACT.md      Interface behavior
│
├── ⚙️ backend/             API · auth · closures · bootstrap
├── 🧪 tests/               Attendance · calendar · profiles · setup
├── 🛡️ scripts/             Repository credential check
├── 🤖 .github/workflows/   CI
└── 📦 package.json
```

---

## 📚 Guides

* 🛠️ [Setup and account initialization](frontend/README.md)
* 🎨 [Visual design](frontend/DESIGN.md)
* 🧭 [Interface behavior](frontend/UX-CONTRACT.md)

---

<div align="center">

### 💡 StudentOS turns scattered records into one clear, trustworthy dashboard

## 👩‍💻 **Kinjal Pramanik**
