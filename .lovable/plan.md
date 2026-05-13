## What's missing and how to improve LegacyLink

LegacyLink works as a single caregiver↔patient pair on top of an open Supabase backend. That's fine for a demo, but it's the source of most of the gaps below. Here is a prioritized list, grouped by theme.

### 1. Authentication & multi-user safety (highest priority)

Currently anyone visiting the URL can pick "I am the Caregiver" and see the patient's live GPS, medical records, and emergency alerts. There is no login, and RLS is open.

- Add real auth (email + Google) with separate `caregiver` and `patient` roles in a `user_roles` table.
- Tighten RLS so each row (gps_logs, tasks, medical_records, family_contacts, emergency_events, patient_notes) is scoped to a `pair_id` linking exactly one caregiver to one patient.
- Add a one-time pairing flow (caregiver generates a code, patient enters it on first launch).

### 2. Landing page (`/`) — the only indexable page

`Index.tsx` is a 2-button splash. For SEO, social sharing, and AI assistant retrieval there is almost nothing to crawl.

- Add a real marketing hero: what LegacyLink does, who it's for, 3–4 feature cards (Location, Reminders, Emergency, Family Contacts), a short FAQ, and a footer.
- Add `FAQPage` JSON-LD alongside the existing `SoftwareApplication` schema.
- Generate a real OG image (1200×630) instead of the current Lovable preview screenshot.

### 3. Onboarding & empty states

- First-time caregiver lands on a dashboard full of empty cards with no guidance. Add an onboarding checklist: "Add a family contact → Add medical info → Set a safe zone → Send your first task."
- Patient dashboard shows "All done for now!" but never explains the emergency button, self-reminder, or what the alarm sound means. Add a one-time tutorial overlay.

### 4. Patient dashboard gaps

- No visible time/date/greeting ("Good morning, Mary — it's Wednesday, May 13"). Strong orientation cue for dementia users.
- No way to silently confirm "I'm ok" — a single big green button would reduce caregiver false alarms.
- Self-reminders and medical info panels are small; per the design memory they should be larger and higher-contrast.
- Geolocation permission prompt is silent — if denied, nothing tells the patient or the caregiver. Add a clear "Location is OFF — tap to enable" banner.

### 5. Caregiver dashboard gaps

- No safe-zone management UI in-app (zones are seeded in DB only). Add create/edit/delete with map-pick or address search.
- No history view for tasks (only today's) or for emergencies beyond the latest 10.
- No notification beyond in-page toasts. Add browser push (or at least the Notification API + service worker) so caregivers get alerts when the tab is in the background.
- No way to mark an emergency `resolved` from the UI.
- "Activity Summary" is static text — replace with a small 7-day chart (tasks completed, snoozes, alerts).

### 6. Reliability / PWA

- No service worker, no manifest. Install as PWA on the patient phone so the app survives reboots and works offline for the static UI.
- GPS logging stops when the tab is backgrounded on iOS. Document the constraint and add a "last seen" age indicator (already partly there via the status pill).
- No error boundaries — a single render error blanks the screen (the `render2 is not a function` crash earlier is symptomatic).

### 7. Accessibility

- Patient theme already prioritizes contrast, but: add `prefers-reduced-motion` handling, keyboard focus rings, and `aria-live` regions for the safe-zone and reminder takeovers.
- Add an in-app text-size toggle (Normal / Large / Huge).
- Add a language toggle — dementia users often revert to a native language.

### 8. SEO / discoverability (mostly done, small gaps left)

- `index.html`, `sitemap.xml`, `robots.txt`, OG/Twitter, JSON-LD ✅ done last turn.
- Still missing: a generated OG image that actually shows the product, a `theme-color` meta, `apple-touch-icon`, and a real `manifest.webmanifest`.
- Patient and Caregiver routes inherit the homepage `<title>` because there's no per-route head. If you want them indexed differently, add `react-helmet-async` for per-page titles.

### 9. Data & analytics

- No analytics — you won't know which features are used. Add lightweight event logging (Supabase table or Plausible).
- No export — caregivers should be able to download a weekly CSV/PDF report.

---

## Suggested next step

This list is large. I recommend tackling it in three milestones:

1. **Safety milestone** — auth, roles, pair-id RLS. Without this the app cannot be shared with a real family.
2. **Polish milestone** — landing page rewrite + onboarding + PWA + error boundaries.
3. **Power milestone** — safe-zone editor, history views, push notifications, analytics, export.

Tell me which milestone (or specific item) to implement and I'll move to build mode and ship it.
