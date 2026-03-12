# Government Scheme Awareness Portal — India 🇮🇳

A full-stack web application to help Indian citizens discover, understand, and check eligibility for government welfare schemes.

## Features

- **Scheme Discovery** — Search & filter 15 government schemes by category
- **Scheme Details** — Eligibility, documents, step-by-step application process
- **Eligibility Checker** — Answer questions, get matched schemes with confidence scores
- **Bilingual** — English + Hindi (हिंदी)
- **What's New** — Recently launched or updated schemes
- **Responsive** — Mobile-first, accessible design

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite via better-sqlite3 |
| Build | Vite |

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Server

```bash
cd server
npm install
npm run seed
npm run dev
```

Server starts at **http://localhost:3001**

### 2. Client

```bash
cd client
npm install
npm run dev
```

Client starts at **http://localhost:5173**

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/schemes` | List schemes (query: `?search=&category=`) |
| GET | `/api/schemes/new` | Recently added/updated schemes |
| GET | `/api/schemes/:id` | Scheme detail |
| GET | `/api/schemes/:id/related` | Related schemes |
| GET | `/api/categories` | List all categories |
| POST | `/api/eligibility/check` | Check eligibility (body: user profile) |

## Project Structure

```
gov-scheme-portal/
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route-level pages
│   │   ├── hooks/         # Custom React hooks
│   │   ├── i18n/          # English + Hindi translations
│   │   ├── types/         # TypeScript interfaces
│   │   └── utils/         # API client, helpers
│   └── package.json
├── server/                # Express backend
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── models/        # DB queries
│   │   ├── seed/          # Seed data + migration
│   │   └── utils/         # Validation
│   └── package.json
└── README.md
```

## License

MIT
