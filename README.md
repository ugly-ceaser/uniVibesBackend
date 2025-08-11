# APP NAME Backend

Express.js + TypeScript backend using Prisma (PostgreSQL), Redis, Awilix DI, Winston + Morgan logging, security middlewares, Jest tests, and Dockerized deployment.

## Stack
- TypeScript, Express
- Prisma (PostgreSQL)
- Redis (caching)
- Awilix (DI)
- Helmet, CORS, Rate Limiter
- Winston + Morgan
- Jest + Supertest
- Docker + Docker Compose
- GitHub Actions

## Running locally (Node)
- Copy `.env.example` to `.env`
- Install deps: `npm install`
- Run dev: `npm run dev`
- Health check: `GET /health`

## Running with Docker
- Build and start stack: `docker compose up --build`
- API: `http://localhost:3000`
- Postgres: `localhost:5432` (postgres/postgres)
- Redis: `localhost:6379`

Apply Prisma migrations (locally): `npm run prisma:migrate`

## Testing
- Run tests: `npm test`
- Coverage output in `coverage/`

## API Prefix
- All endpoints are under `/api/v1`

## MVP Endpoints
- Auth: POST `/api/v1/auth/register`, POST `/api/v1/auth/login`
- Courses: GET `/api/v1/courses`, GET `/api/v1/courses/:id`
- Map: GET `/api/v1/map`, GET `/api/v1/map/:id`
- Forum: GET `/api/v1/forum/questions`, POST `/api/v1/forum/questions`, POST `/api/v1/forum/questions/:id/answers`
- Guide: GET `/api/v1/guide`, GET `/api/v1/guide/:id`

## Caching
- Redis caches GET lists for 300s
- Forum list cache invalidated on new question/answer

## Logs
- `logs/error.log`, `logs/combined.log` + console in non-prod

## CI/CD
- On push to `main`: install, test, build, push image to GHCR
- Deploy step placeholder for your environment 