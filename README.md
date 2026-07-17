# COLREGS Navigator

Maritime collision-avoidance rules engine and visualizer. Users place two vessels on a
nautical-chart-style sandbox and the app classifies the encounter (head-on, crossing, or
overtaking) under the International Regulations for Preventing Collisions at Sea (COLREGS
Rules 11-18), determines which vessel must give way, and explains the verdict with the
specific rule citation and geometric reasoning behind it.

## Local Setup

Prerequisites:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or an equivalent local
  Docker daemon) -- provides the local Postgres database. **There is no hosted/live deployment
  for this milestone** -- the project is demoed via local run instructions only, not a hosted
  live link (local Docker Postgres only, no Neon/Supabase or other managed DB).
- Node.js 22+

Steps, in order:

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate dev
npm test
```

`docker compose up -d` starts a local Postgres 17 container (credentials and database name are
defined in `docker-compose.yml`, matching the connection string in `.env.example`).
`npx prisma migrate dev` applies the committed migrations under `prisma/migrations/` and
generates the Prisma client. `npm test` runs the Vitest suite (domain rules engine plus any
persistence/API tests).
