# ScriptVault — Lua Script Licensing Platform

## Overview

A secure licensing and script delivery platform for Lua scripts. It includes:
- **User Portal** — License validation, HWID binding, script delivery
- **Admin Dashboard** — Full management of keys, scripts, access logs, and stats

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Wouter

## Artifacts

- `artifacts/api-server` — Express REST API (serves `/api`)
- `artifacts/lua-platform` — React frontend (serves `/`)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Required Secrets

- `SCRIPT_ENCRYPTION_KEY` — 64-char hex string (32 bytes) for AES-256-GCM encryption
- `ADMIN_SECRET` — admin dashboard password sent as `X-Admin-Secret` header

## Database Schema

- `licenses` — license keys with HWID binding, expiry, revoked state, usage count
- `scripts` — encrypted Lua scripts (stored as base64 ciphertext + IV + auth tag)
- `access_logs` — full audit trail of all validation/delivery requests

## API Routes

### Public
- `POST /api/validate` — validate a license key + HWID
- `POST /api/scripts/:id/deliver` — decrypt and deliver script (validates key first)

### Admin (require `X-Admin-Secret` header)
- `GET/POST /api/admin/licenses` — list/create license keys
- `GET/PATCH/DELETE /api/admin/licenses/:id` — manage a license
- `POST /api/admin/licenses/:id/revoke` — revoke a license
- `GET/POST /api/admin/scripts` — list/upload scripts
- `GET/DELETE /api/admin/scripts/:id` — manage a script
- `GET /api/admin/logs` — access logs
- `GET /api/admin/stats` — dashboard statistics

## Security

- AES-256-GCM encryption for all stored scripts
- HWID binding on first use (prevents key sharing)
- Rate limiting (30 req/min per IP on public endpoints)
- Admin secret header authentication
- All access attempts are logged

## Frontend Routes

### User Portal
- `/` — License validation form
- `/user` — User dashboard (shows license info, scripts, Lua loader)

### Admin
- `/admin` — Admin login
- `/admin/dashboard` — Stats overview with charts
- `/admin/licenses` — License management
- `/admin/scripts` — Script upload/management
- `/admin/logs` — Access logs
- `/admin/lua-loader` — Lua loader guide for end users
