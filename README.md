# StartupForge Server

Backend API for the StartupForge — Startup Team Builder Platform.

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- Better Auth (Credential + Google Login)
- JWT (HTTPOnly Cookies)
- Stripe Checkout

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your credentials
3. Install dependencies:

```bash
npm install
```

4. Start the server:

```bash
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `BETTER_AUTH_SECRET` | Better Auth secret key |
| `BETTER_AUTH_URL` | Server URL for Better Auth |
| `CLIENT_URL` | Frontend URL for CORS |
| `JWT_SECRET` | JWT signing secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `ADMIN_EMAIL` | Admin account email |
| `ADMIN_PASSWORD` | Admin account password |
| `IMGBB_API_KEY` | ImgBB API key for image uploads |

## Admin Credentials

- Email: Set via `ADMIN_EMAIL` env variable
- Password: Set via `ADMIN_PASSWORD` env variable
