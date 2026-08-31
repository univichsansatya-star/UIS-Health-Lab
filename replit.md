# UIS Health Lab

Portal laboratorium keperawatan UIS untuk katalog alat, peminjaman, booking ruangan, stok, dan persetujuan laboran.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/uis-health-lab` — React + Vite web application and route-aware UI.
- `artifacts/api-server/src/routes/lab.ts` — REST handlers and initial lab seed data.
- `lib/api-spec/openapi.yaml` — source of truth for generated API clients and validators.
- `lib/db/src/schema/index.ts` — Drizzle schema for lab domain data.

## Architecture decisions

- The first release keeps lending and room booking as separate workflows, each with its own approval path.
- Clerk provides browser authentication; the public landing page stays accessible while workspace routes are protected.
- The API seeds a small, useful starter dataset because the project intentionally begins without migrated portal data.

## Product

Students can browse and request equipment, reserve lab rooms, follow request status, view notifications, and read the borrowing guide. Laborans can review approvals, see room status, inspect the three inventory types, manage the checklist, and edit the guide.

## User preferences

The interface should preserve UIS blue as the primary identity and use red as a restrained accent, with accessible light and dark modes.

## Gotchas

After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` before using the generated hooks or schemas.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
