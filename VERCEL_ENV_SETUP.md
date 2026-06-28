# Fix Vercel Server — Environment Variables

Your server shows an error because **Vercel does not use your local `.env` file**.
You must paste these in: **Vercel → startup-server → Settings → Environment Variables → Production**

After adding ALL variables → **Deployments → Redeploy**

---

## Required variables (copy each row)

| Name | Value |
|------|--------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your MongoDB Atlas connection string (see below) |
| `BETTER_AUTH_SECRET` | `64e55aad4387ab377933f6a9dbbb104e4169f7932c7f506e2283b2e400b89b9a` |
| `BETTER_AUTH_URL` | `https://startup-server-rho.vercel.app` |
| `CLIENT_URL` | `https://YOUR-CLIENT-APP.vercel.app` |
| `JWT_SECRET` | `0bcca5a0d368dc018d3e2ebfff3d4db92bc8cd742af2d851b8bd1f97a3a32e8b` |
| `ADMIN_EMAIL` | `admin@startuplabs.com` |
| `ADMIN_PASSWORD` | `Admin@123` |
| `GOOGLE_CLIENT_ID` | Copy from your local `server/.env` |
| `GOOGLE_CLIENT_SECRET` | Copy from your local `server/.env` |
| `IMGBB_API_KEY` | Get free key at https://api.imgbb.com/ |
| `STRIPE_SECRET_KEY` | `sk_test_...` or leave placeholder for demo checkout |

Replace `YOUR-CLIENT-APP.vercel.app` with your real frontend Vercel URL.

---

## MongoDB Atlas (required — 5 minutes)

1. Go to https://www.mongodb.com/atlas → Sign up free
2. Create a **free cluster**
3. **Database Access** → Add user (username + password)
4. **Network Access** → Add IP → **Allow access from anywhere** (`0.0.0.0/0`)
5. **Database** → Connect → Drivers → copy connection string
6. Replace `<password>` with your user password
7. Paste as `MONGODB_URI` in Vercel

Example:
```
mongodb+srv://myuser:MyPassword123@cluster0.xxxxx.mongodb.net/startupforge?retryWrites=true&w=majority
```

---

## Google OAuth (production)

In [Google Cloud Console](https://console.cloud.google.com/) → Credentials → your OAuth client:

Add **Authorized redirect URI**:
```
https://startup-server-rho.vercel.app/api/auth/callback/google
```

---

## Client (frontend) Vercel project

Add one variable:

| Name | Value |
|------|--------|
| `VITE_API_URL` | `https://startup-server-rho.vercel.app` |

Then redeploy the client.

---

## Test after redeploy

1. https://startup-server-rho.vercel.app/api/env-status → all should be `true`
2. https://startup-server-rho.vercel.app → `{"message":"StartupForge API is running"}`
3. Login on your live client site
