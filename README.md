# Green Thumb Diary

A full-stack plant care tracker with watering reminders, growth logs, and PWA support — installable on Android without the Play Store.

live demo: https://7abe08c8-b560-4757-bf24-79e11523ec50-00-1e5d2rwqd7moy.sisko.replit.dev/plant-web/
---

## Features

- Add and manage plants with photos, species, and care details
- Set custom watering schedules per plant
- Watering status indicators — Good / Due Soon / Overdue
- Growth log with dated journal entries per plant
- Installable as a Progressive Web App (PWA) on Android
- Data persists locally across sessions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS |
| Build Tool | Vite, vite-plugin-pwa |
| Backend | Express 5, Node.js 24 |
| Database | PostgreSQL, Drizzle ORM |
| Validation | Zod |
| Package Manager | pnpm workspaces |
| Deployment | Vercel |

---

## Project Structure

```
Green-Thumb-Diary/
├── artifacts/
│   ├── plant-web/        # React frontend (Vite + Tailwind)
│   │   ├── public/       # Static assets and PWA files
│   │   ├── src/          # Application source code
│   │   ├── index.html
│   │   └── vite.config.ts
│   ├── api-server/       # Express backend
│   └── mobile/           # Mobile-related artifacts
├── lib/                  # Shared libraries
├── scripts/              # Development scripts
└── pnpm-workspace.yaml
```

---

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm
- PostgreSQL database

### Install Dependencies

```bash
pnpm install
```

### Environment Variables

Create a `.env` file in `artifacts/plant-web/`:

```env
PORT=3000
BASE_PATH=/
DATABASE_URL=your_postgres_connection_string
```

### Run the App

```bash
# Run the frontend
pnpm --filter plant-web run dev

# Run the API server
pnpm --filter @workspace/api-server run dev

# Full typecheck
pnpm run typecheck
```

---

## Deploying to Vercel

1. Import the repository at [vercel.com](https://vercel.com)
2. Configure the following project settings:

| Setting | Value |
|---|---|
| Root Directory | `artifacts/plant-web` |
| Framework Preset | Vite |
| Build Command | `pnpm run build` |
| Output Directory | `dist/public` |

3. Add the required environment variables:

| Key | Value |
|---|---|
| `PORT` | `3000` |
| `BASE_PATH` | `/` |

4. Click Deploy.

---

## Installing as a PWA on Android

Once the app is deployed:

1. Open the Vercel URL in Chrome on Android
2. Tap the three-dot menu and select "Add to Home Screen"
3. Tap Install — the app will appear on your home screen like a native application

---

## License

MIT
