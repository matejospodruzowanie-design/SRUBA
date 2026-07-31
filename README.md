# ŚRUBA

Aplikacja fitness do logowania treningów — inspirowana Lyfta/Strong/Hevy.

## Stack

- **Next.js 16** (App Router, Turbopack) + React 19
- **Prisma 7** + SQLite (libsql)
- **Tailwind CSS 4**
- Custom JWT auth (jose)
- recharts, @dnd-kit, sonner, lucide-react
- Capacitor (Android APK) + PWA

## Szybki start

```bash
npm install
cp .env.example .env
# Ustaw AUTH_SECRET w .env
npx prisma db push
npx prisma db seed
npm run dev
```

## Live

https://sruba-production.up.railway.app
