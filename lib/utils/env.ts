/**
 * Validate required environment variables on boot
 */
export function validateEnv() {
  const required = [
    'DATABASE_URL',
    'SPOTIFY_CLIENT_ID',
    'SPOTIFY_CLIENT_SECRET',
  ];

  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file.'
    );
  }

  // Warn if using default session secret in production
  if (
    process.env.NODE_ENV === 'production' &&
    (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'your-secret-key-change-in-production')
  ) {
    console.warn('WARNING: Using default SESSION_SECRET in production. Please set a secure random value.');
  }
}

/**
 * Get the demo shelf share token for the home page
 * Returns undefined if not configured (home page will skip the demo)
 */
export function getDemoShelfToken(): string | undefined {
  return process.env.DEMO_SHELF_TOKEN;
}
