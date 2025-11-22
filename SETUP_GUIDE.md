# Setup Guide for New Developers

## Quick Fix for "Module not found: Can't resolve '@supabase/ssr'" Error

If you're getting this error when running `npm run dev`, it means you haven't installed the project dependencies yet.

### Solution

Run these commands in order:

```bash
# 1. Install all dependencies
npm install

# 2. Set up environment variables (see below)

# 3. Run the development server
npm run dev
```

## Detailed Setup Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd vox-sentinel
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- `@supabase/ssr` (the missing package causing your error)
- `@supabase/supabase-js`
- Next.js and all other dependencies

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important:** Ask the project owner for the Supabase credentials, or set up your own Supabase project at [supabase.com](https://supabase.com).

### 4. Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Common Issues

### Multiple Lockfiles Warning

If you see a warning about multiple lockfiles (`pnpm-lock.yaml` and `package-lock.json`), you can safely ignore it or remove the `pnpm-lock.yaml` file if you're using npm:

```bash
# Optional: Remove pnpm lockfile if using npm
rm pnpm-lock.yaml
```

### Middleware Deprecation Warning

The warning about "middleware" file convention being deprecated is a Next.js 16 notice. The application will still work correctly.

## Project Structure

- `/app` - Next.js app router pages and layouts
- `/components` - React components
- `/lib` - Utility functions and configurations
  - `/lib/supabase` - Supabase client setup
- `/scripts` - Automation scripts for data synchronization
- `/public` - Static assets

## Additional Documentation

- `DATABASE_SETUP.md` - Database schema and setup instructions
- `SYNC_QUICKSTART.md` - API synchronization system documentation
- `README.md` - General project information

## Need Help?

Contact the project owner if you:
- Don't have the Supabase credentials
- Encounter any other setup issues
- Need access to the production database
