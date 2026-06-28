const REQUIRED = [
  'MONGODB_URI',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'CLIENT_URL',
  'JWT_SECRET',
];

const PLACEHOLDER_PATTERNS = [
  'your-super-secret',
  'your-jwt-secret',
  'username:password',
  '<db_password>',
  'sk_test_your_stripe',
];

export function validateProductionEnv() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    return { ok: true, missing: [], invalid: [] };
  }

  const missing = REQUIRED.filter((key) => !process.env[key]?.trim());
  const invalid = REQUIRED.filter((key) => {
    const value = process.env[key]?.trim() || '';
    return value && PLACEHOLDER_PATTERNS.some((p) => value.includes(p));
  });

  if (missing.length || invalid.length) {
    const error = new Error('Missing or invalid production environment variables');
    error.missing = missing;
    error.invalid = invalid;
    throw error;
  }

  return { ok: true, missing, invalid };
}

export function getEnvStatus() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    vercel: Boolean(process.env.VERCEL),
    hasMongoUri: Boolean(process.env.MONGODB_URI?.trim()),
    hasBetterAuthSecret: Boolean(process.env.BETTER_AUTH_SECRET?.trim()),
    hasBetterAuthUrl: Boolean(process.env.BETTER_AUTH_URL?.trim()),
    hasClientUrl: Boolean(process.env.CLIENT_URL?.trim()),
    hasJwtSecret: Boolean(process.env.JWT_SECRET?.trim()),
    hasAdminEmail: Boolean(process.env.ADMIN_EMAIL?.trim()),
    hasGoogleOAuth: Boolean(
      process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
    ),
  };
}
