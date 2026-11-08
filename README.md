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

## Running behind a proxy (Render)

Rate limits (the global limiter and the stricter login/register limiter) key on `req.ip`.
On Render the app sits behind a proxy, so unless Express is told to trust it, `req.ip` is the
proxy's address for every request and all students share one rate-limit budget (anyone can then
lock everyone out of login).

- `TRUST_PROXY` sets Express's `trust proxy`. It is **off by default** in every environment
  (dev/test, and production when unset; production logs a warning at startup).
- Allowed values: a hop count (`1`, `2`, ...) or a comma-separated list of proxy IPs/CIDRs
  (e.g. `10.0.0.0/8,127.0.0.1`), or Express's named ranges `loopback` / `linklocal` / `uniquelocal`.
  `0`, `false` or empty means off. Anything else stops the server at startup.
- **Never use `true`** (or `*`); it is rejected. With `true`, Express trusts every hop, so any
  client can send its own `X-Forwarded-For` header, pick its own `req.ip` and bypass the limits.
- `LOG_CLIENT_IP=true` logs one `client-ip` line per request with `ip=` (`req.ip`), `ips=`
  (`req.ips`, the trusted hops) and `xff=` (the raw `X-Forwarded-For` header). Off by default.

### How to confirm the value on Render
1. Set `LOG_CLIENT_IP=true`, leave `TRUST_PROXY` unset, and redeploy.
2. From a phone or laptop whose public IP you know (e.g. from a "what is my IP" site), call
   `GET /health`.
3. In Render's logs, find the `client-ip` line. Count the entries in `xff` to the right of your IP.
   `TRUST_PROXY` = that count + 1. For example, `xff="<you>"` gives `1`, and
   `xff="<you>, 10.x.x.x"` gives `2`.
4. Set `TRUST_PROXY` to that value and redeploy. Confirm that `ip=` now shows your public IP and
   that `ips=` starts with it (Express lists the client first, then the trusted proxies).
5. Run `curl -H "X-Forwarded-For: 1.2.3.4" https://<service>/health` and confirm that `ip=` is
   still your IP and not `1.2.3.4`.
6. Unset `LOG_CLIENT_IP` afterwards and redeploy, because the line logs client IPs.

## Caching
- Redis caches GET lists for 300s
- Forum list cache invalidated on new question/answer

## Logs
- `logs/error.log`, `logs/combined.log` + console in non-prod

## CI/CD
- On push to `main`: install, test, build, push image to GHCR
- Deploy step placeholder for your environment 