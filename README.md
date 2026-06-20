# Shape Log

A private, single-user fitness tracker for lean muscle gain, park/bodyweight training, controlled running, and lightweight recovery/body-shape check-ins.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Neon/Postgres via `@neondatabase/serverless`
- Recharts
- Simple password gate with an HTTP-only session cookie

## Environment

Create `.env.local` for local development or add these variables in Vercel:

```bash
DATABASE_URL="postgres://user:password@host/db?sslmode=require"
APP_PASSWORD="your-private-password"
SESSION_SECRET="a-long-random-secret"
```

The app creates its tables automatically on first load.

## Commands

```bash
npm install
npm run dev
npm run build
```

## Deployment

1. Create a Neon Postgres database.
2. Add `DATABASE_URL`, `APP_PASSWORD`, and `SESSION_SECRET` to Vercel.
3. Deploy the project to Vercel.
4. Open the app, sign in, and the default weekly plan will be seeded automatically.
