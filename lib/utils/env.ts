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
 * 
 * @deprecated Use getDemoUserId() instead for rotating shelf previews
 * 
 * Admin Demo Approach:
 * --------------------
 * The demo shelf is managed by an admin account in production.
 * To set up:
 * 1. Create an admin account (e.g., admin@virtualbookshelf.app)
 * 2. Log in and create a public shelf with sample items
 * 3. Get the share token from the shelf's share URL (/s/{token})
 * 4. Set DEMO_SHELF_TOKEN environment variable to this token
 * 
 * This approach allows admins to update the demo shelf through
 * the normal UI without requiring code deployments.
 * 
 * See docs/ADMIN_DEMO_SETUP.md for detailed instructions.
 */
export function getDemoShelfToken(): string | undefined {
  return process.env.DEMO_SHELF_TOKEN;
}

/**
 * Get the demo user ID for the home page rotating shelf previews
 * Returns undefined if not configured (home page will skip the demo)
 * 
 * Admin Demo Approach:
 * --------------------
 * All public shelves from this user will be displayed in a rotating
 * carousel on the home page (up to 5 shelves).
 * 
 * To set up:
 * 1. Create an admin account (e.g., admin@virtualbookshelf.app)
 * 2. Get the user ID from the database
 * 3. Set DEMO_USER_ID environment variable to this ID
 * 4. Create multiple public shelves with sample items
 * 
 * This approach allows admins to update demo content through
 * the normal UI without requiring code deployments.
 */
export function getDemoUserId(): string | undefined {
  return process.env.DEMO_USER_ID;
}
