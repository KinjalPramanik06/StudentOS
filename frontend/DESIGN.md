# StudentOS design context

The dashboard serves StudentOS students and faculty. Preserve its indigo identity, compact cards, and blue/purple accents in both day and night mode. Account selection is a convenience; authentication occurs only after an email and password are submitted. Use clear labels, visible focus states, actionable errors, and pending feedback on authentication and database actions. Keep role decisions on the server and avoid claims of institutional SSO or local-only security.

The private local build may show the five-account chooser to help testing. Public builds hide that chooser and present only the email and password form; the accounts and server-side authentication remain the same.

## Layout and academic context

Authenticated dashboards and data screens use the full width available beside the sidebar, with a small responsive inset instead of a fixed page-width cap. The timetable keeps comparable day and time columns; when the screen is too narrow for readable cells, only the grid scrolls horizontally. Forms such as Settings can retain a narrower reading width.

The sidebar profile subtitle reflects the calendar-derived current semester or break and the user's department. It must not repeat a semester saved in an older profile record or change merely because someone browses a different semester's timetable.

Profile images use one shared avatar component across sign-in, navigation, profiles, and student tables. Profiles use a generic fallback avatar until the account owner adds a photo.

Attendance is evaluated for each subject in the semester being viewed. The minimum is 75%; any subject below it gets a visible alert on the attendance page, dashboard, and related subject views. A subject with no classes recorded displays N/A and does not alert. The overall attendance figure is context, not a substitute for the per-subject requirement.

Attendance ledgers distinguish counted classes from non-counting closures. Present and Absent update the selected subject totals. OFF identifies a class not taken by the teacher, while Event, Exam, and Holiday calendar closures are recorded as Event or Holiday entries. Closure entries stay visible and exportable for auditability without changing held, attended, percentage, or the 75% alert. Calendar closures block later Present or Absent entries for the same scheduled class and day.

## Day and night mode

The user's explicit day/night choice controls every route, including sign-in, navigation, cards, forms, dialogs, and charts. The shared `ThemeToggle` is visible on sign-in and in the application header; Settings offers the same two choices. Save the preference in this browser and synchronize it across tabs. Preserve an older system preference until the user chooses a mode, then honor that explicit choice regardless of operating-system changes. Initialize the root theme before first paint in `index.html`; `ThemeProvider` owns subsequent root updates, and the Zustand store owns the preference.

Runtime tokens in `frontend/src/index.css` are canonical. Day mode maps page background/text to `#f8fafc`/`#0f172a`; night mode maps them to `#020617`/`#f1f5f9`. Chart tooltip surface/border/muted text are `#ffffff`/`#cbd5e1`/`#475569` by day and `#0f172a`/`#334155`/`#94a3b8` by night. Existing Tailwind palette utilities consume the root `.dark` variant for component surfaces. Native form controls inherit `color-scheme` from that root.

All overflow surfaces inherit the global scrollbar tokens: transparent track; day thumb/hover/active `#cbd5e1`/`#94a3b8`/`#64748b`; night `#475569`/`#64748b`/`#94a3b8`. Scrollbars remain operable; forced-color mode uses browser defaults. The attendance semester selector wraps its buttons instead of creating a scroll container, so every semester is visible without a scrollbar on narrow screens.

## Optional profile photos
Personal-detail edits preserve the existing photo when its field is unchanged or blank. Bundled portrait paths are valid inputs; the photo field is optional. A failed custom link falls back to the supplied portrait by account UID, and then the generic avatar. Self-service roll, registration, university roll and contact changes are allowed for the current writable account, while login identity and permissions remain protected.

## Calendar date and activity

Use the browser's local calendar day throughout the app. The calendar opens on that month, highlights today, and provides Previous month, Next month and Today controls. One app clock refreshes the date at midnight, on focus and visibility changes, with a minute interval as a fallback. Header dates, today's schedule, semester progress and calendar highlights share this date. Read semester boundaries from the saved academic calendar. Today's activity labels come from actual dated calendar events and holidays, including inclusive date ranges; never infer an exam phase from the completion percentage. Empty days display “No calendar events today.” Quarter colors describe elapsed time only.

The academic quote card uses a pale indigo/white/blue surface with dark text by day, and an indigo/slate/blue surface with light text by night. The quote, author, label and Next quote control all follow the selected mode.

## Phone layouts

Below 768px, preserve the existing palette and identity while reducing card padding, chart heights and redundant labels. Dashboard metrics use two columns and appear before the degree progress panels. The header owns search; no floating search action may cover content. Bottom navigation respects device safe areas and content has enough bottom padding to remain reachable.

The timetable defaults to day tabs and readable class cards, with the existing weekly grid available through an explicit toggle. Desktop retains the weekly grid. The phone calendar uses compact date cells and event dots; selecting a date shows its events beneath the month, with an option to show all events. Existing date, semester, data and permission behavior remains unchanged.

Profile details use a compact portrait header. Shared dialogs become scrollable bottom sheets on phones, with 16px form text and 44px field heights. Attendance filters wrap at narrow widths; wide data tables scroll inside their containers. Desktop dimensions remain controlled by their existing responsive breakpoints.

Dialog overlays render above page animation and navigation through the shared body portal. Their body scrolls independently of a fixed header and optional action footer. Timetable Save and Cancel remain reachable on short phones and desktop-site mode. Save labels distinguish a student's private account copy from an admin publication. An admin update replaces older personal copies of that shared record; personal attendance, marks and profile changes remain tied to the named student.
