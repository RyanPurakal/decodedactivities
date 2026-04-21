# Bill Audit

Single-page React app for a high-school health literacy presentation. Teams compare a
hospital bill to an Explanation of Benefits (EOB), flag billing errors, calculate the
real patient responsibility, and choose financial assistance tools.

## Tech stack

- React + Vite + TypeScript
- Tailwind CSS
- No backend/auth/database/router
- All activity data hardcoded in `src/data.ts`

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Deploy to Vercel

Build and deploy as a static site:

```bash
npm run build && vercel --prod
```
