# mateflow — Frontend

> Good company, thoughtfully connected.

mateflow helps people discover Mates, plan shared activities, and manage bookings in one place. This repository contains the web application for renters, Mates, and administrators.

## Features

- Browse Mate profiles and discover company for your next activity.
- Request bookings and track their progress.
- Pay through Stripe PromptPay QR.
- Chat with realtime updates, typing indicators, and read receipts.
- Receive notifications and review completed bookings.
- Manage Mate profiles, photos, and availability.
- Responsive layouts with a consistent light theme.

## Tech Stack

Next.js App Router · React · TypeScript · Tailwind CSS · TanStack Query · Zod · Socket.IO · Stripe.js

Testing: Vitest, Testing Library, MSW, and Playwright.

## Getting Started

### Prerequisites

- Node.js **24** and npm.
- The [backend](https://github.com/djfiffo/rent-a-mate) running locally.
- Stripe test credentials only when testing Stripe payments.

### 1. Clone and install

```bash
git clone https://github.com/IkrtI/rent-a-mate-frontend.git
cd rent-a-mate-frontend
npm ci
```

### 2. Configure the environment

```bash
cp .env.example .env
```

Update the following values in `.env`:

```dotenv
BACKEND_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_PAYMENTS_MODE=mock
SESSION_COOKIE_SECURE=false
```

Set backend `PAYMENTS_MODE=mock` too for local mock payments. For Stripe, switch both applications to `stripe` and configure `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` with the matching test publishable key.

If set, `APP_ORIGIN` must match the frontend origin. Use the same hostname consistently instead of switching between `localhost` and `127.0.0.1`.

Never add Stripe secret keys or JWT secrets to the frontend.

### 3. Run the application

```bash
npm run dev -- --port 3001
```

Open **http://localhost:3001**. The backend should run at **http://localhost:3000/api/v1**, with `CORS_ORIGIN=http://localhost:3001`.

## How It Works

Users discover a Mate, request a booking, and follow its progress from their dashboard. Booking participants can chat, renters can pay through PromptPay, and completed bookings can receive reviews.

Next.js server routes connect to the backend using HttpOnly session cookies. REST handles data loading and message submission; Socket.IO delivers realtime updates using short-lived, single-use tickets. Payment success is confirmed by the backend, not by displaying a QR code.

## Project Structure

```text
src/
  app/          Pages, layouts, and same-origin API routes
  modules/      Feature-specific components, clients, and schemas
  components/   Shared UI components
e2e/            Browser tests
```

## Development Commands

| Command                        | Description                    |
| ------------------------------ | ------------------------------ |
| `npm run dev -- --port 3001`   | Start development server       |
| `npm run build`                | Create production build        |
| `npm run start -- --port 3001` | Serve production build         |
| `npm run lint`                 | Run ESLint                     |
| `npm run typecheck`            | Check TypeScript               |
| `npm run format:check`         | Check formatting               |
| `npm test`                     | Run unit and component tests   |
| `npm run test:e2e`             | Run browser tests              |
| `npm run verify`               | Run full verification pipeline |

Install Chromium before running E2E tests or `verify`:

```bash
npx playwright install --with-deps chromium
```

## CI and Production

[GitHub Actions](.github/workflows/ci.yml) checks formatting, lint, types, unit/component tests, production build, and browser E2E tests on pushes and pull requests. Browser tests use a development server and mock APIs for several flows; they do not verify live payments. CI does not deploy.

See [.env.production.example](.env.production.example) and [Dockerfile](Dockerfile) for production configuration. Use HTTPS, secure cookies, Stripe mode, and matching Stripe credentials across both applications. Public `NEXT_PUBLIC_*` variables are embedded at build time and require rebuilding when changed. The socket origin must be browser-accessible and support WebSocket connections.

Environment example files are templates, not automatically loaded configuration.
