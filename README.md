# Government Scheme Awareness Portal — India 🇮🇳

A full-stack web application to help Indian citizens discover, understand, and check eligibility for government welfare schemes. Built with React, Express, and **MySQL**.

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
| Database | **MySQL 8.x** (mysql2/promise) |
| Auth | JWT + bcryptjs, Google Identity Services |
| Email | Nodemailer (Gmail SMTP) |
| Build | Vite |

## Quick Start

### Prerequisites

- **Node.js 18+** and npm 9+
- **MySQL 8.x** installed and running

#### Install MySQL

- **Windows:** Download from https://dev.mysql.com/downloads/installer/ → choose "MySQL Server" → use default settings (no root password needed)
- **macOS:** `brew install mysql && brew services start mysql`
- **Ubuntu/Debian:** `sudo apt install mysql-server && sudo systemctl start mysql`

After installing, verify MySQL is running:

```bash
mysql -u root -e "SELECT 'MySQL is running!' AS status;"
```

> **Windows tip:** If `mysql` is not on PATH, use the full path:
> ```
> "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -e "SELECT 1;"
> ```
> If your MySQL has a root password, add `-p` and update `DB_PASS` in `.env`.

### 1. Clone the repo

```bash
git clone https://github.com/ankitek5654/gov-scheme-portal-mysql.git
cd gov-scheme-portal-mysql
```

### 2. Setup Server

```bash
cd server
npm install
```

Create the env file from the example:

```bash
cp .env.example .env
```

Then edit `server/.env` — update `DB_PASS` if your MySQL root has a password, and set Gmail SMTP credentials for email features:

```env
# MySQL Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=gov_scheme_portal

# Gmail SMTP Configuration (for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-gmail-app-password
MAIL_FROM=Gov Scheme Portal <your-gmail@gmail.com>
```

> **Note:** Email is optional. The app works fully without SMTP config — you just won't receive email notifications.
>
> **Gmail App Password:** Enable 2-Step Verification at https://myaccount.google.com/security, then generate an App Password at https://myaccount.google.com/apppasswords.

#### Seed the database

This creates the `gov_scheme_portal` database, tables, 15 government schemes, and default admin user:

```bash
npx tsx src/seed/migrate.ts
```

#### Start the server

```bash
npx tsx src/index.ts
```

Server starts at **http://localhost:3001**

### 3. Setup Client

Open a new terminal:

```bash
cd client
npm install
```

(Optional) To enable Google Sign-In, copy and edit the env example:

```bash
cp .env.example .env
```

Edit `client/.env` and set your Google Client ID. The app works without this — users can still sign up/login with email.

Start the client:

```bash
npm run dev
```

Client starts at **http://localhost:5174**

### 4. Open the app

Visit **http://localhost:5174** in your browser.

## Database

### Connection Details

| Setting | Value |
|---------|-------|
| Host | localhost |
| Port | 3306 |
| User | root |
| Password | *(empty by default)* |
| Database | gov_scheme_portal |

### Tables

| Table | Description |
|-------|-------------|
| `schemes` | 15 government schemes with bilingual data, eligibility rules |
| `users` | Registered users with roles (user/admin) |
| `applications` | User applications linked to schemes |

### View Database

You can browse the database using:

- **MySQL Workbench** (GUI) — connect to `localhost:3306`
- **Command line** — `mysql -u root -e "USE gov_scheme_portal; SELECT * FROM schemes;"`
- **VS Code** — Install the "MySQL" extension by Weijan Chen

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
gov-scheme-portal-mysql/
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
│   │   ├── db.ts            # MySQL connection pool (mysql2/promise)
│   │   ├── routes/          # auth, schemes, eligibility, applications, admin
│   │   ├── models/          # DB queries + eligibility logic
│   │   ├── middleware/      # JWT auth + role middleware
│   │   ├── seed/            # Migration + seed data (15 schemes)
│   │   └── utils/           # mailer, validation
│   ├── .env                 # DB + SMTP credentials (not committed)
│   └── package.json
├── .gitignore
└── README.md
```

## License

MIT
