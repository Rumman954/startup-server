import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { MongoClient } from 'mongodb';
import { resolveMongoUri } from './getMongoUri.js';

let authInstance = null;

export const initAuth = async () => {
  const uri = await resolveMongoUri();
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const hasGoogleOAuth =
    googleClientId &&
    googleClientSecret &&
    !googleClientId.includes('your-google') &&
    !googleClientSecret.includes('your-google');

  if (!hasGoogleOAuth) {
    console.warn('\n⚠️  Google login disabled: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env');
    console.warn('   Redirect URI: http://localhost:5000/api/auth/callback/google\n');
  }

  authInstance = betterAuth({
    database: mongodbAdapter(db),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: [
      process.env.CLIENT_URL,
      process.env.BETTER_AUTH_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ]
      .flatMap((origin) => (origin || '').split(','))
      .map((origin) => origin.trim())
      .filter(Boolean),
    advanced: {
      useSecureCookies: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL),
      defaultCookieAttributes: {
        sameSite: process.env.NODE_ENV === 'production' || process.env.VERCEL ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL),
      },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
    },
    socialProviders: hasGoogleOAuth
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : {},
    user: {
      additionalFields: {
        role: {
          type: 'string',
          required: false,
          defaultValue: 'collaborator',
        },
        isBlocked: {
          type: 'boolean',
          required: false,
          defaultValue: false,
        },
        skills: {
          type: 'string[]',
          required: false,
          defaultValue: [],
        },
        bio: {
          type: 'string',
          required: false,
          defaultValue: '',
        },
        isPremium: {
          type: 'boolean',
          required: false,
          defaultValue: false,
        },
        premiumPlan: {
          type: 'string',
          required: false,
          defaultValue: '',
        },
        premiumBilling: {
          type: 'string',
          required: false,
          defaultValue: '',
        },
      },
    },
  });

  return authInstance;
};

export const getAuth = () => authInstance;
