# LegacyLink

A real-time mobile web application for dementia and neurodiverse care, bridging patient autonomy with caregiver peace of mind.

## Features

- **Split Dashboard** — Separate Patient and Caregiver interfaces optimized for each role
- **Real-Time Task Management** — Caregivers create tasks that appear instantly on the patient's device with alarm reminders
- **Live GPS Tracking** — Real-time patient location displayed on an interactive map
- **Safe Zone Geofencing** — Automatic alerts when the patient leaves a defined safe area
- **Emergency Panic Button** — One-tap SOS for the patient with instant caregiver notification
- **Remote Camera & Microphone** — Caregivers can request snapshots or audio clips from the patient's device
- **Family Contacts** — Contact list with map-linked locations and one-tap calling/navigation
- **Medical Records** — Caregivers manage medical info that syncs to the patient's view
- **Self Reminders & Notes** — Patients can save notes that sync to the caregiver dashboard in real time

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Lovable Cloud (Supabase — PostgreSQL, Realtime, Storage, Edge Functions)
- **Maps:** Leaflet + React-Leaflet (OpenStreetMap)
- **State Management:** TanStack React Query

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ (or [Bun](https://bun.sh/))
- A Lovable Cloud project (automatically provisioned when using [Lovable](https://lovable.dev))

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd legacylink

# Install dependencies
npm install
# or
bun install
```

### Environment Variables

Create a `.env` file in the project root with the following variables (automatically set by Lovable Cloud):

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
```

### Database Setup

The database schema is managed through migrations in `supabase/migrations/`. Tables include:

| Table              | Purpose                                      |
| ------------------ | -------------------------------------------- |
| `tasks`            | Caregiver-assigned tasks with due times      |
| `gps_logs`         | Patient GPS coordinates logged over time     |
| `emergency_events` | Panic button and safe-zone breach events     |
| `safe_zones`       | Geofenced areas with threshold distances     |
| `family_contacts`  | Family member details with map coordinates   |
| `medical_records`  | Health records managed by the caregiver      |
| `self_reminders`   | Quick notes created by the patient           |
| `media_requests`   | Remote camera/microphone capture signaling   |

Migrations are applied automatically when deploying via Lovable Cloud.

### Running Locally

```bash
npm run dev
# or
bun run dev
```

The app will be available at `http://localhost:5173`.

### Usage

1. Open the app and select **"I'm a Caregiver"** or **"I'm a Patient"** from the landing page.
2. **Caregiver Dashboard** — Add tasks, manage contacts, push medical records, view the patient's live location, and request media captures.
3. **Patient Dashboard** — View tasks with alarm reminders, tap the emergency button, save notes, and access family contacts.

For best results, open each dashboard in a separate browser tab or device to see real-time synchronization in action.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
