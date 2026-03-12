# Government Scheme Awareness Portal — India 🇮🇳

A full-stack web application to help Indian citizens discover, understand, and check eligibility for government welfare schemes.

## Features

- **Scheme Discovery** — Search & filter 15+ government schemes by category
- **Scheme Details** — Eligibility criteria, required documents, step-by-step application process
- **Eligibility Checker** — Answer questions, get matched schemes with confidence scores
- **Bilingual** — English + Hindi (हिंदी)
- **What's New** — Recently launched or updated schemes
- **Authentication** — Email/password + Google Sign-In
- **Admin Panel** — Manage schemes, users, and applications (dashboard, CRUD)
- **Apply for Schemes** — Eligibility-first apply flow with email confirmation
- **Email Notifications** — Confirmation on apply, rejection notice, password reset links
- **Forgot Password** — Reset link sent via email (15 min expiry)
- **Responsive** — Mobile-first, accessible design

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite via sql.js (pure JS, no native deps) |
| Auth | JWT + bcryptjs, Google Identity Services |
| Email | Nodemailer (Gmail SMTP) |
| Build | Vite |

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Clone the repo

```bash
git clone https://github.com/ankitek5654/gov-scheme-portal.git
cd gov-scheme-portal
```

### 2. Setup Server

```bash
cd server
npm install
```

Create a `server/.env` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-gmail-app-password
MAIL_FROM=Gov Scheme Portal <your-gmail@gmail.com>
```

> **Note:** To get a Gmail App Password:
> 1. Enable 2-Step Verification at https://myaccount.google.com/security
> 2. Generate an App Password at https://myaccount.google.com/apppasswords
> 3. Use the 16-character password (with spaces) as `SMTP_PASS`

Start the server:

```bash
node --import tsx src/index.ts
```

Server starts at **http://localhost:3001**

### 3. Setup Client

Open a new terminal:

```bash
cd client
npm install
```

(Optional) To enable Google Sign-In, create `client/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

Start the client:

```bash
npm run dev
```

Client starts at **http://localhost:5174**

### 4. Open the app

Visit **http://localhost:5174** in your browser.

## Default Admin Account

| Email | Password |
|-------|----------|
| admin@gov.in | admin123 |

Admin login page: `/admin/login`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/schemes` | List schemes (`?search=&category=`) |
| GET | `/api/schemes/new` | Recently added/updated schemes |
| GET | `/api/schemes/:id` | Scheme detail |
| GET | `/api/schemes/:id/related` | Related schemes |
| GET | `/api/categories` | List all categories |
| POST | `/api/eligibility/check` | Check eligibility for all schemes |
| POST | `/api/eligibility/check/:id` | Check eligibility for a specific scheme |
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/google` | Google Sign-In |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Send password reset email |
| POST | `/api/auth/reset-password` | Reset password with token |
| POST | `/api/applications/:id/apply` | Apply for a scheme (auth required) |
| GET | `/api/applications` | Get user's applications (auth required) |
| GET | `/api/admin/stats` | Dashboard stats (admin only) |
| GET | `/api/admin/schemes` | Manage schemes (admin only) |
| GET | `/api/admin/users` | Manage users (admin only) |
| GET | `/api/admin/applications` | Manage applications (admin only) |

## Project Structure

```
gov-scheme-portal/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Header, Footer, SchemeCard, SearchBar, etc.
│   │   ├── pages/           # HomePage, LoginPage, AdminPage, etc.
│   │   ├── hooks/           # useAuth, useSchemes
│   │   ├── i18n/            # English + Hindi translations
│   │   ├── types/           # TypeScript interfaces
│   │   └── utils/           # API client
│   ├── .env                 # Google Client ID (not committed)
│   └── package.json
├── server/                  # Express backend
│   ├── src/
│   │   ├── routes/          # auth, schemes, eligibility, applications, admin
│   │   ├── models/          # DB queries + eligibility logic
│   │   ├── middleware/      # JWT auth + role middleware
│   │   ├── seed/            # Migration + seed data (15 schemes)
│   │   └── utils/           # mailer, validation
│   ├── .env                 # SMTP credentials (not committed)
│   └── package.json
├── .gitignore
└── README.md
```

## License

MIT
