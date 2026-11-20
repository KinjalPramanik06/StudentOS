# StudentOS shared UI behavior

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Scrollbar | `frontend/src/index.css` global baseline | `DESIGN.md` and runtime CSS tokens | Scrollable content and tables; wrapping attendance semester selector | Computed styles and desktop/mobile browser checks |
| Toast | `ToastProvider` and `ToastContainer` | Existing notification context | Success, error, warning, info | Existing browser actions |
| CRUD | Server API and Zustand store | Server authorization and collection contracts | Shared academic data and student-owned records | Existing API checks; unchanged by appearance controls |
| Form | Existing page forms and validation schemas | Existing field schemas | Sign-in and settings | Browser checks for affected appearance |
| Select/Listbox | Native select elements | Existing native control behavior | Browser-owned popup | Root color-scheme and theme checks |
| Date | Native date inputs | Existing browser-owned calendar | Native | Root color-scheme |

## Appearance

`ThemeToggle` is the canonical shared day/night action. Its accessible name states the destination mode; Settings buttons show their selected state with `aria-pressed`. The preference is browser-local, persists through refresh, sign-in, sign-out, and navigation, and synchronizes across same-origin tabs. A failure to write browser storage does not prevent an in-session theme change. Choosing day or night replaces any older system-following preference.

Changing mode only changes presentation; it does not change accounts or academic data. The root class controls Tailwind dark styles, and native controls inherit the selected color scheme. The sign-in page supports the same modes as authenticated pages.

## Attendance semester selector

All eight buttons remain visible and keyboard-operable. Buttons wrap when space is limited, expose selection with `aria-pressed`, and preserve the existing semester selection action. This control has no horizontal or vertical scroll region. Content tables keep their own horizontal scrolling when needed.

## Mobile navigation and browsing

`Navbar` owns mobile search and `BottomNav` owns primary routes plus the Quick access drawer. Secondary route labels wrap instead of truncating. `MobileTimetable` owns phone day selection and delegates class details to the existing timetable dialog. `CalendarPage` owns date selection and the selected-day/all-events switch. These presentation choices do not write academic data or alter the current semester. `GlassModal` owns responsive dialog presentation; existing validation and save handlers remain authoritative.

Mobile verification covers 320px, 390px and 430px widths, all student routes, day/night modes, search, day selection, class details, calendar events, profile forms and secondary navigation. Desktop retains four dashboard metric columns and its original timetable grid.

## Editing scope and dialogs

The server owns account scope. Student copies of shared academic records are stored in `personalRecords`, keyed by collection, account UID and record key; client-supplied ownership cannot select another student's copy. Shared revisions let admin publications replace stale personal copies. Student marks, attendance and results retain their existing owner checks. Admin edits to those individual records target that student rather than copying personal records across accounts.

## Attendance closures

The attendance ledger accepts Present, Absent, OFF, Event, Holiday, and Reset entries. Only Present and Absent change held and attended totals. OFF, Event, and Holiday are non-counting audit entries. Saving a calendar Event, Exam, or Holiday writes automatic Event or Holiday ledger entries for every scheduled slot and affected student, identified by `automaticClosure` and `closureSource`. Those entries cannot be edited or deleted directly. The API refuses a Present or Absent entry that matches an automatic closure by student, subject, session type, and local calendar day. All ledger records, including closure entries, are returned from MongoDB and included in attendance exports.

`GlassModal` portals to the document body above navigation and animated page containers. Its header and optional footer remain fixed within the dialog; only the body scrolls. Timetable saves use that footer, prevent duplicate submissions, keep drafts after errors, and state whether the action saves privately or publishes to all students. Cancel and Escape close the dialog; focus stays inside and returns to the trigger afterward.
