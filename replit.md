# UIS Health Lab

Portal laboratorium keperawatan UIS untuk katalog alat, peminjaman, booking ruangan, stok, dan persetujuan laboran.

## Run & Operate

- `uv run python artifacts/api-server/manage.py runserver 0.0.0.0:$PORT` — run the Django API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Django 6 + Django REST Framework
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/uis-health-lab` — React + Vite web application and route-aware UI.
- `artifacts/api-server/config` — Django project settings, URLs, and WSGI entrypoint.
- `artifacts/api-server/lab` — DRF views, serializers, authentication, and Django models mapped to the existing PostgreSQL tables.
- `lib/api-spec/openapi.yaml` — source of truth for generated API clients and validators.
- `lib/db/src/schema/index.ts` — Drizzle schema for lab domain data.

## Architecture decisions

- The first release keeps lending and room booking as separate workflows, each with its own approval path.
- Clerk provides browser authentication; the public landing page stays accessible while workspace routes are protected.
- Django models use `managed = False` because the existing PostgreSQL tables were created by the shared schema package; Django is the active API runtime and does not attempt to recreate those tables.

## Product

Students can browse and request equipment, reserve lab rooms, follow request status, view notifications, and read the borrowing guide. Laborans can review approvals, see room status, inspect the three inventory types, manage the checklist, and edit the guide.

## User preferences

The interface should preserve UIS blue as the primary identity and use red as a restrained accent, with accessible light and dark modes.

## Gotchas

After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` before using the generated hooks or schemas.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
