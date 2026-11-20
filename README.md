# StudentOS

**Attendance, class schedules, and semester results in one student dashboard.**

StudentOS helps students answer three everyday questions: Which class is next? Which subjects are below the attendance requirement? How have my results changed across semesters? Students can review their own records, while administrators manage the academic information shared across accounts.

---

## Key Features

### 📊 Subject-by-subject attendance

Check each subject against the **75% attendance threshold**. For a subject below the threshold, the dashboard calculates how many consecutive classes the student needs to attend to recover.

### 🗓️ Timetable and academic calendar

Organize classes into time slots and record holidays and exam closures. A closure stays visible in the attendance ledger without counting as a missed class.

### 🎓 Marks and semester results

Record subject marks and review semester and yearly grade-point averages alongside attendance. Switch semesters to revisit earlier academic records.

### 📄 Attendance exports

Download a PDF for sharing, an Excel workbook for analysis, or a CSV for importing attendance records into another tool.

---

## How It Works

### Example attendance calculation

A student attends **14 of 20** counted classes in a subject. Their attendance is **70%**. Attending the next four classes brings the total to **18 of 24**, exactly **75%**. A scheduled class cancelled for a holiday adds nothing to either count.

---

## Architecture

```text
React dashboard  →  /api requests  →  Node.js backend  →  MongoDB
```

During development, Vite forwards API requests from port 5500 to the backend on port 5501. In production, the Node server serves both the compiled dashboard and the API. The database connection string stays on the server.

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Interface | React, TypeScript, Tailwind CSS |
| Navigation and state | React Router, Zustand |
| Charts and reports | Recharts, jsPDF, write-excel-file |
| API and persistence | Node.js 24, MongoDB |
| Build and checks | Vite, TypeScript, Node.js test runner, GitHub Actions |

---

## Environment Variables

| Setting | What to enter |
| --- | --- |
| `MONGODB_URI` | A private connection string for a MongoDB user with read and write access. |
| `MONGODB_DB` | A new, empty database name for this installation. |
| `INITIAL_STUDENT_EMAIL`, `INITIAL_ADMIN_EMAIL` | Two different login email addresses. |
| `INITIAL_STUDENT_PASSWORD`, `INITIAL_ADMIN_PASSWORD` | Two different private passwords, each 12–128 characters. |
| `APP_ORIGIN` | Use `http://localhost:5500` for local development. |

On first startup the API creates one student and one administrator. An empty timetable and attendance ledger are expected. Later startups preserve saved records. To change an existing password, use Settings.

**Firebase is optional.** Leave it disabled to use the MongoDB-backed application. The setup guide explains how to enable the Firebase Web SDK. Values prefixed with `VITE_` are visible in browser builds. Keep database credentials and account passwords in server-only variables.

---

## Getting Started

### 1. Open the project

Clone the repository or extract its ZIP, then open the folder containing `package.json`. Install Node.js 24 and prepare a new, empty MongoDB database.

### 2. Install dependencies

```sh
npm ci
```

### 3. Configure your environment

In Windows PowerShell, copy the template and fill in the settings listed above. Keep the completed file private.

```powershell
Copy-Item .env.example .env
```

### 4. Start the API and dashboard

Run the API in the first terminal:

```sh
npm run dev:api
```

Run Vite in a second terminal from the same folder:

```sh
npm run dev
```

Open [StudentOS on localhost](http://localhost:5500) and sign in with the student or admin account you configured.

---

## Project Structure

```text
frontend/   React pages, components, styles, public assets, and project guides
backend/    Node.js API, account initialization, and MongoDB access
tests/      Automated checks for attendance, calendar, profiles, and setup
scripts/    Repository checks
.github/    GitHub Actions workflow
```


## Build and check

| Command | Purpose |
| --- | --- |
| `npm test` | Run the automated tests. |
| `npm run check:repository` | Scan project files for common credential patterns. |
| `npm run build` | Check TypeScript and build the frontend into `dist/`. |
| `npm start` | Serve the built frontend and API using your configured environment. |

For local use of the built application, set `APP_ORIGIN=http://localhost:5501` and open that address after starting the server. For a public installation, configure a Node-capable host, MongoDB access, and the exact public HTTPS origin. [Full setup and hosting guide](frontend/README.md)

## Project guides

- [Setup and account initialization](frontend/README.md)
- [Visual design](frontend/DESIGN.md)
- [Interface behavior](frontend/UX-CONTRACT.md)
