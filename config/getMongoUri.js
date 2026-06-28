let resolvedUri = null;

/** Detect the default .env.example placeholder, not real Atlas hosts like cluster0.xxx.mongodb.net */
export const isPlaceholderMongoUri = (uri) =>
  !uri?.trim() ||
  uri.includes('username:password') ||
  uri.includes('<db_password>') ||
  /@cluster\.mongodb\.net(\/|$)/.test(uri);

export const resolveMongoUri = async () => {
  if (resolvedUri) return resolvedUri;

  const envUri = process.env.MONGODB_URI?.trim();

  if (!isPlaceholderMongoUri(envUri)) {
    resolvedUri = envUri;
    return resolvedUri;
  }

  if (process.env.NODE_ENV === 'production') {
    console.error('\n❌ Invalid MONGODB_URI in server/.env');
    console.error('   Set a real MongoDB Atlas connection string before deploying.\n');
    process.exit(1);
  }

  resolvedUri = process.env.MONGODB_LOCAL_URI || 'mongodb://127.0.0.1:27017/startupforge';

  console.warn('\n📦 MONGODB_URI is still the placeholder — using local MongoDB for development:');
  console.warn(`   ${resolvedUri}`);
  console.warn('   Make sure MongoDB is running (Windows: Services → MongoDB Server).');
  console.warn('   For cloud persistence, replace MONGODB_URI in server/.env with your Atlas URI.\n');

  return resolvedUri;
};
