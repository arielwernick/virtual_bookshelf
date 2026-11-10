/**
 * Load local env files for CLI scripts, the same files `next dev` uses:
 * .env.local first, then .env. A variable already set in the shell wins, and
 * the first file to set a variable wins over later ones.
 *
 * Import this first, before anything that reads process.env.
 */
import { config } from 'dotenv';

config({ path: ['.env.local', '.env'], quiet: true });
