# Admin Demo Shelf Setup Guide

This guide explains how to set up and maintain the demo shelf displayed on the Virtual Bookshelf home page.

## Overview

The demo shelf on the home page showcases the app's functionality to new visitors. Instead of using automated scripts, we use an **admin account approach** where an admin user creates and maintains the demo shelf through the normal app UI.

### Benefits

- **No deployments needed** to update demo content
- **Visual curation** - add items through the same UI visitors will use
- **Easy updates** - swap items, reorder, or refresh anytime
- **Production-safe** - no scripts to run in production environments

## Initial Setup (Production)

### Step 1: Create an Admin Account

1. Go to your production site (e.g., `https://virtualbookshelf.app/signup`)
2. Create an account with a recognizable admin email:
   - **Recommended**: `admin@virtualbookshelf.app` or `admin@yourdomain.com`
   - Use a strong password and store it securely
3. Verify the account works by logging in

### Step 2: Create the Demo Shelf

1. Log in to the admin account
2. Go to the Dashboard
3. Create a new shelf with an engaging name, e.g.:
   - "My Recommendations"
   - "Staff Picks"
   - "Trending Reads"
4. Add a description (optional but recommended)
5. Add 6-12 items (mix of books, podcasts, and music works best)
   - The home page displays up to 6 items
   - Having more allows rotation when you update

### Step 3: Make the Shelf Public

1. Open the shelf you created
2. Click the **Share** button
3. Enable **Public sharing**
4. Copy the share URL (e.g., `https://virtualbookshelf.app/s/abc123def456`)

### Step 4: Extract the Share Token

From the share URL, extract the token (the part after `/s/`):

```
https://virtualbookshelf.app/s/abc123def456
                                 ^^^^^^^^^^^
                                 This is your token
```

### Step 5: Set the Environment Variable

Add the token to your production environment:

**Vercel:**
1. Go to your project settings → Environment Variables
2. Add: `DEMO_SHELF_TOKEN` = `abc123def456`
3. Redeploy the app (or it will take effect on next deploy)

**Other platforms:**
```bash
DEMO_SHELF_TOKEN=abc123def456
```

### Step 6: Verify

1. Visit your home page
2. The demo shelf should display with your curated items
3. Click through to verify the link works

## Updating the Demo Shelf

To update what appears on the home page:

1. Log in to the admin account
2. Navigate to the demo shelf
3. Add, remove, or reorder items as desired
4. Changes appear immediately (no redeploy needed!)

### Tips for a Great Demo

- **Variety**: Include books, podcasts, AND music to showcase all item types
- **Quality images**: Items with good cover art look more appealing
- **Popular picks**: Well-known titles help visitors connect with the concept
- **Fresh content**: Update periodically to keep things interesting

## Troubleshooting

### Demo shelf not appearing

1. **Check the environment variable**: Ensure `DEMO_SHELF_TOKEN` is set correctly
2. **Verify the shelf is public**: The shelf must have public sharing enabled
3. **Check the token**: Make sure there are no extra spaces or characters
4. **Redeploy if needed**: Some platforms require a redeploy after env var changes

### Wrong shelf appearing

1. Verify you copied the correct share token
2. Check you're editing the right shelf in the admin account

### Token changed after recreation

If you delete and recreate the shelf, you'll get a new share token. Update the environment variable with the new token.

## Local Development

For local development, you can:

1. **Use the same approach**: Create a local user account and shelf
2. **Use a test token**: Add to `.env.local`:
   ```
   DEMO_SHELF_TOKEN=your-local-shelf-token
   ```
3. **Skip the demo**: Leave `DEMO_SHELF_TOKEN` unset to hide the demo section

## Migration from Seed Script

If you were previously using `scripts/seed-demo.ts`:

1. The script has been deprecated (renamed to `seed-demo.deprecated.ts`)
2. Follow the steps above to set up an admin account
3. Once the new demo shelf is working, you can optionally delete the old demo account created by the script

## Security Notes

- The admin account should use a strong, unique password
- Consider using a password manager
- The admin email should be a real, monitored address
- Store credentials securely (not in code or git)
