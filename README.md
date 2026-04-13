# University Alumni Intelligence Dashboard

A full-stack university alumni management and intelligence platform. Features a blind bidding system for "Alumni of the Day," a live analytics dashboard with interactive charts, a searchable alumni directory, granular API key access control, and automated daily winner selection.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Vanilla CSS, Chart.js |
| **Backend** | Node.js, Express 5, MySQL 2 |
| **Auth** | JWT (Bearer tokens), bcrypt (10 rounds), express-session |
| **Security** | Helmet.js, CORS, express-rate-limit, express-validator |
| **Database** | MySQL 8 (3NF schema) |
| **Docs** | Swagger / OpenAPI 3.0 |
| **Jobs** | node-cron (daily midnight job) |
| **Email** | Nodemailer (Gmail SMTP) |

---

## Repository Structure

```
CW_1/
├── CW_Express/          # Node.js / Express REST API
│   ├── config/          # DB pool, app config
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth, security, validation, API key
│   ├── routes/          # Express routers
│   ├── services/        # Email, bidding business logic
│   ├── jobs/            # Cron winner-selection job
│   ├── swagger/         # OpenAPI spec config
│   ├── database/
│   │   └── schema.sql   # 3NF schema + mock data seed
│   └── index.js         # Server entry point
│
├── CW_React/            # React + Vite SPA
│   ├── src/
│   │   ├── components/  # Layout, PrivateRoute
│   │   ├── pages/       # Dashboard, Analytics, AlumniDirectory, Auth
│   │   ├── services/    # Axios API layer
│   │   └── utils/       # CSV / PDF / PNG export
│   └── index.html
│
├── cw_express.md        # Backend README
├── cw_react.md          # Frontend README
└── README.md            # This file
```

---

## Quick Start

### Prerequisites

- Node.js v16+
- MySQL 8 server running locally
- npm

### 1. Clone the repository

```bash
git clone https://github.com/your-username/alumni-intelligence-dashboard.git
cd alumni-intelligence-dashboard
```

### 2. Set up the Backend

```bash
cd CW_Express
npm install
```

Copy and configure environment variables:
```bash
cp .env.example .env
```

Edit `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=alumni_platform

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

SESSION_SECRET=your_session_secret

EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_gmail_app_password

CORS_ORIGIN=http://localhost:5173
PORT=3000
NODE_ENV=development
```

Create the MySQL database:
```sql
CREATE DATABASE alumni_platform;
```

Start the backend — the schema and mock data are seeded automatically on first boot:
```bash
npm start
```

> ✅ You should see: `✓ Database tables verified and mock data seeded`

### 3. Set up the Frontend

```bash
cd ../CW_React
npm install
cp .env.example .env
```

The default `.env` is:
```env
VITE_API_URL=http://localhost:3000/api
```

Start the frontend:
```bash
npm run dev
```

### 4. Open the app

Navigate to **http://localhost:5173**

You'll be redirected to `/login`. Use one of the mock accounts seeded automatically:

| Email | Password |
|-------|---------|
| `jdoe@university.edu` | `Admin123!` |
| `asmith@university.edu` | `Admin123!` |
| `mjohnson@university.edu` | `Admin123!` |
| `ewilliams@university.edu` | `Admin123!` |
| `drown@university.edu` | `Admin123!` |

Or register a new account using a `@university.edu` email — you'll receive a verification email.

---

## Features

### 🔐 Authentication & Security
- University domain email restriction (`@university.edu`)
- Email verification with expiring tokens
- bcrypt password hashing (10 salt rounds)
- JWT Bearer token auth + session management
- Helmet.js security headers, CORS, rate limiting
- Input sanitisation against XSS and SQL injection

### 📊 Analytics Dashboard
- Live stat cards: Alumni count, Active Bids, Total Donations, Events Hosted
- 6 interactive charts: Top Employers (Bar), Registration Trends (Line), Skills Distribution (Doughnut), Geographic Distribution (Pie), Skills Gap (Radar), Bid Volume (Bar)
- Export data as CSV or PDF
- Download individual charts as PNG

### 👥 Alumni Directory
- Searchable grid of all verified alumni
- Alumni cards showing: name, current role + company, bio, skill badges
- Real-time client-side search by name or company

### 💰 Blind Bidding System
- Place bids for "Alumni of the Day" without seeing competitors' bids
- Increase your own bid at any time
- Monthly win limits (3 per month; 4 if event attended)
- Automatic eligibility enforcement

### ⏰ Automated Daily Winner Selection
- Midnight cron job selects the highest bidder for the next day
- Email notification sent to winner
- Transaction-safe bid status updates (active → won/lost)

### 🔑 Granular API Key Access
- Issue scoped API keys (e.g. `read:analytics`, `read:alumni`)
- 403 on missing/insufficient scope
- Usage timestamps logged per endpoint in `api_usage_logs`

### 📚 API Documentation
- Swagger UI at `http://localhost:3000/api-docs`

---

## API Overview

| Group | Base Path | Auth |
|-------|-----------|------|
| Auth | `/api/auth` | Public |
| Profile | `/api/profile` | JWT |
| Bidding | `/api/bidding` | JWT |
| Analytics | `/api/analytics` | JWT / API Key |
| Alumni Directory | `/api/alumni` | JWT |

Full endpoint docs available at `/api-docs` when the server is running.

---

## Database Schema (3NF)

| Table | Description |
|-------|-------------|
| `users` | Core auth and user data |
| `profiles` | Bio, LinkedIn, profile image (1:1 users) |
| `education` | Degree history (1:N users) |
| `experience` | Employment history (1:N users) |
| `skills` | Skill tags for analytics (1:N users) |
| `donations` | Alumni donations (1:N users) |
| `bids` | Blind bidding records (1:N users) |
| `daily_winners` | Alumni of the Day winners |
| `events` | University event records |
| `event_attendance` | User-event attendance (M:N) |
| `api_keys` | Scoped API keys (1:N users) |
| `api_usage_logs` | Per-request usage tracking |
| `email_verification_tokens` | Secure one-time tokens |
| `sessions` | Express session store |

---

## Troubleshooting

**`ER_NO_SUCH_TABLE` on startup**
> Ensure MySQL is running before starting the backend. The schema auto-creates on connection.

**Registration fails with domain error**
> Only `@university.edu` emails are accepted. Update `ALLOWED_DOMAINS` in `CW_Express/.env` to match your domain.

**CORS errors in the browser**
> Confirm `CORS_ORIGIN=http://localhost:5173` is set in `CW_Express/.env` and restart the backend.

**Charts show no data**
> The backend seeds mock data on start. If the DB was previously populated from a different schema version, the seed will have re-created all tables with fresh data.

---

## License

This project is for educational purposes (University Coursework).
