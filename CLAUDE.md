# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a monorepo for the **Research Connect Platform** — a platform connecting students, researchers, investors, and employers. It contains three independent sub-projects:

| Directory | Tech | Purpose |
|-----------|------|---------|
| _(root)_ | React Native / Expo | **Mobile admin panel** (primary project) |
| `Research-Connect-Platform/` | React + Vite + Redux | Web frontend for end users |
| `new-backend-research-connect-platform/` | Laravel (PHP) + MySQL | REST API backend |

---

## Mobile Admin App (root)

### Commands

```bash
npx expo start           # Start Expo dev server (scan QR with Expo Go)
npx expo run:android     # Build and run on Android emulator/device
npx expo run:ios         # Build and run on iOS simulator/device
```

There are no tests or linting configured at the root level.

### Architecture

**Entry point**: `App.js` wraps everything in `GestureHandlerRootView` → `SafeAreaProvider` → `AuthProvider` → `AppNavigator`.

**Auth flow** (`src/context/AuthContext.js`):
- JWT stored in `AsyncStorage` under keys `token` and `user`
- On mount, session is restored from storage; `loading` state gates navigation
- Only users with roles `superadmin`, `super_admin`, `admin`, `manager`, or `marketing` can log in
- A global `onAuthError` callback (set via `setOnAuthError`) triggers auto-logout on 401 responses

**Navigation** (`src/navigation/AppNavigator.js`):
- Stack navigator: `Login` screen when unauthenticated, `AdminDrawer` when authenticated
- `MENU_GROUPS` is the single source of truth for all 24 screens — each item has a `name`, `icon`, `title`, and optional `perm` key
- `DEFAULT_PERMISSIONS` maps roles (`manager`, `marketing`, `admin`) to allowed `perm` keys; superadmin bypasses all checks
- `RolePermissions` screen is `superAdminOnly: true`
- The drawer renders only the screens the current user's role permits

**API layer** (`src/api/`):
- `api.js`: Axios instance with `baseURL: https://resurch-api.adzone.space/api`, 20s timeout, Bearer token injected from AsyncStorage on every request
- `endpoints.js`: All API calls grouped by domain (e.g. `usersApi`, `innovationsApi`, `paymentsApi`). Import from here, never call `api` directly in screens.
- Two permission tiers on the backend: `/admin/*` routes (admin role) and `/super-admin/*` routes (superadmin only)

**Shared UI** (`src/components/ui/`):
- `Badge`, `Button`, `Card`, `EmptyState`, `Input`, `Modal`, `Screen`, `Select`, `StatGrid` — use these in screens instead of raw RN primitives
- Barrel export at `src/components/ui/index.js`

**Theming** (`src/theme/colors.js`):
- `colors`, `spacing`, `radius`, `shadow` — import from here for all style values; no hardcoded colors or numbers in screens

**Screen pattern**: Each screen in `src/screens/` manages its own state with `useState`/`useEffect`, calls endpoint functions from `src/api/endpoints.js`, and uses shared UI components.

---

## Web Frontend (`Research-Connect-Platform/`)

### Commands

```bash
cd Research-Connect-Platform
npm install
npm run dev       # Vite dev server (default: http://localhost:5173)
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

**Environment** — copy `.env.example` to `.env`:
```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_URL=http://localhost:5173
```

### Architecture

- **Routing**: React Router v7 (`src/Store/Protectedroute.jsx` guards authenticated routes)
- **State**: Redux Toolkit (`src/Store/index.js`); only auth state is in Redux (`authSlice.js`)
- **Styling**: Tailwind CSS v4 + MUI + Flowbite React; utility classes preferred
- **HTTP**: Axios; service modules in `src/services/` wrap API calls per feature
- **Pages**: Organized by feature in `src/pages/` (Dashboard, Community, Careers, InvestorZone, Membership, AdRequest, etc.)

---

## Backend (`new-backend-research-connect-platform/`)

### Commands

```bash
cd new-backend-research-connect-platform
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve        # Starts at http://localhost:8000
```

**Environment**: MySQL database named `research-v1`; AWS S3 for file storage; PayHere for payments; Google/Facebook OAuth.

### Architecture

- **Routes**: `routes/api.php` includes modular files from `routes/modules/` (auth, user, s3, selling, investorzone, advertisement, admin, community, careers, membership, messaging, hiring)
- **Auth**: Laravel Sanctum; `SANCTUM_STATEFUL_DOMAINS` must include the frontend origin
- **File storage**: S3 (configure `AWS_*` env vars); the `s3` route module handles uploads
- **Queues**: Database driver; run `php artisan queue:work` for background jobs
- **App name in .env**: `Innlaunch`
