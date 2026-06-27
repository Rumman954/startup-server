# StartupForge Server

Backend API for the StartupForge — Startup Team Builder Platform.

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- Better Auth (Credential + Google Login)
- JWT (HTTPOnly Cookies)
- Stripe Checkout
- ImgBB image upload

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | `development` or `production` |
| `MONGODB_URI` | MongoDB connection string |
| `BETTER_AUTH_SECRET` | Better Auth secret (32+ chars) |
| `BETTER_AUTH_URL` | Server URL for Better Auth |
| `CLIENT_URL` | Frontend URL for CORS (comma-separated for multiple) |
| `JWT_SECRET` | JWT signing secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `ADMIN_EMAIL` | Admin account email |
| `ADMIN_PASSWORD` | Admin seed password |
| `IMGBB_API_KEY` | ImgBB API key |

## API Routes

| Route | Description |
|-------|-------------|
| `/api/auth/*` | Better Auth |
| `/api/jwt/*` | JWT issue, me, logout, sync-user |
| `/api/startups` | Startup CRUD |
| `/api/opportunities` | Opportunities with `$regex`, `$in`, pagination |
| `/api/applications` | Apply & manage applications |
| `/api/payments` | Stripe checkout & verify |
| `/api/admin` | Admin dashboard APIs |
| `/api/upload` | ImgBB image upload |
| `/api/users` | Profile & founder stats |

## Deploy

Deploy to **Render** using `render.yaml` or manual setup. See root [DEPLOYMENT.md](../DEPLOYMENT.md).

| | |
|---|---|
| **GitHub** | https://github.com/Rumman954/startup-server |

## Admin Credentials

| | |
|---|---|
| **Email** | `admin@startuplabs.com` |
| **Password** | `Admin@123` |
