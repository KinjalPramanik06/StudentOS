# StudentOS setup guide

Run the commands below from the repository root.

A React + TypeScript student dashboard with a Node.js API and MongoDB persistence. Firebase Web SDK setup is included as an optional extension.

## Project layout

- `frontend/` contains the React application, HTML entry point, and public assets.
- `backend/` contains the Node API, database logic, and server entry points.
- Shared configuration, tests, and npm manifests live at the repository root. Run all setup, development, test, and build commands from the root.

## Clean starting state

- Exactly **one student** (`std_001`) and **one admin** (`admin_001`) are created on first startup.
- Generic display names: Student and Admin. No phone numbers, roll numbers, registration numbers, blood groups, personal photos, or saved academic history.
- Subjects, timetable, attendance, marks, semester results, assignments, notices, holidays, calendar events, semester dates, and saved settings start empty.
- The interface retains generic time-slot options and an eight-semester navigation structure. These are interface templates, not saved student records.
- No passwords or password hashes are bundled. You choose two private initial passwords in environment variables.
- The original ZIP, database credentials, account files, old build, source maps, backups, and personal photos are excluded.

## Run locally

Use Node.js 24 and a new, empty MongoDB database.

```sh
npm ci
```

Copy `.env.example` to `.env`. Fill in:

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Your private MongoDB connection string; server only |
| `MONGODB_DB` | A NEW empty database name, such as `studentos_clean` |
| `INITIAL_STUDENT_EMAIL` | Student login; defaults to `student@example.com` |
| `INITIAL_STUDENT_PASSWORD` | Your student password, 12–128 characters |
| `INITIAL_ADMIN_EMAIL` | Admin login; defaults to `admin@example.com` |
| `INITIAL_ADMIN_PASSWORD` | A different private password, 12–128 characters |
| `APP_ORIGIN` | `http://localhost:5500` for Vite development; your exact HTTPS origin in production |

Do not use example-style passwords beginning with `change`, `replace`, `your-`, or `example`. Keep `.env` private.

Start the API and frontend in separate terminals:

```sh
npm run dev:api
```

```sh
npm run dev
```

Open `http://localhost:5500`, then sign in with the student or admin email and password you configured. There is no shared/default password and no public signup.

The first API startup creates the two accounts with salted password hashes. Later startups preserve your changes; editing initial-password variables does not reset existing passwords. Change passwords in Settings. After successful initialization, initial-password variables can be removed from your environment.

**Do not point this copy at the old database.** Startup refuses an existing database without this clean version's initialization marker. It never deletes the old database. Use a new database name to start clean; do not import an old backup if you want the application to remain empty. Do the first startup once locally before launching multiple server instances.

## Firebase setup

The added files are `frontend/src/lib/firebase.ts`, `firebase.json`, `.firebaserc.example`, `firestore.rules`, `firestore.indexes.json`, and `storage.rules`.

1. Create your own Firebase project and register a Web app.
2. Copy the Web app configuration into the `VITE_FIREBASE_*` variables in your private `.env` file or hosting build settings.
3. Set `VITE_FIREBASE_ENABLED=true` and restart/rebuild the frontend.
4. If using Firebase CLI, copy `.firebaserc.example` to `.firebaserc` and enter your project ID. Install the CLI separately and sign in to your own project.
5. If you create Firestore or Storage resources, deploy the supplied deny-all rules before using them. Run `firebase deploy --only firestore:rules` or `firebase deploy --only storage` for resources you have enabled.

This initializes the Firebase Web SDK; it does **not** switch login, database storage, or uploads from MongoDB to Firebase. No Firebase Auth accounts are created. Firestore and Storage remain inaccessible through client SDKs until you deliberately implement and authorize a feature. Firebase is disabled by default, so missing Firebase credentials do not prevent the MongoDB app from running.

All `VITE_*` values are visible in browser builds. Firebase's Web configuration identifies a project; it is not a service-account credential. Never put a MongoDB URI, password, Admin SDK key, or other private secret in a `VITE_*` variable. See [Firebase Web setup](https://firebase.google.com/docs/web/setup) and [Firebase API key guidance](https://firebase.google.com/docs/projects/api-keys).

## Upload to GitHub

Upload the contents of the repository root into a new repository. Include `.gitignore`, `.env.example`, `package-lock.json`, `frontend/`, `backend/`, and configuration files. The backend handles login and MongoDB access.

```sh
npm run check:repository
npm test
npm run build
git init
git add .
git status
git commit -m "Initial clean StudentOS project"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

The supplied `.gitignore` excludes `.env`, dependency folders, builds, source maps, private keys, account-password files, and common local caches. Review staged files before committing; do not upload the original ZIP or `work/` directory used to prepare this copy.

## Hosting

GitHub stores the source. **GitHub Pages alone cannot run this Node/MongoDB backend.**

For a Node-capable host, set private server environment variables, run `npm ci && npm run build`, then `npm start`. Set `NODE_ENV=production`, `APP_ORIGIN` to the exact public HTTPS origin, and allow the host to reach MongoDB. Supply `PORT` as required by the host.

`npm run preview` previews frontend assets only; it does not serve the API. Use `npm run go-live` for a local production-build preview with the Node API on port 5501 (set `APP_ORIGIN=http://localhost:5501` for that run).

Firebase Hosting is not configured here because the app needs the Node API on the same origin. Using it would additionally require a deployed backend and routing, such as a Cloud Run rewrite. See [Firebase's Cloud Run hosting guide](https://firebase.google.com/docs/hosting/cloud-run).

## Checks and limits

`npm test` includes account-bootstrap tests plus the original attendance, calendar, profile-permission, personal-record, and request-origin tests. `npm run check:repository` checks source files for common credential leaks and files that should stay private; it does not replace reviewing your own future changes.

No live database, Firebase project, GitHub repository, or hosting account is included or modified by this package. You must supply your own configuration before running/deploying it. The two bootstrap accounts work after first startup; additional student profiles created through the existing admin screen do not automatically receive login passwords.
