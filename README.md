IMPORTANT! Still in progress.

# nest-auth

A NestJS REST API demonstrating JWT authentication with refresh token rotation. Refresh tokens are opaque random strings
managed in Redis; revoked access tokens are tracked via a Redis blocklist.

**Stack:** NestJS · TypeScript · PostgreSQL (TypeORM) · Redis (ioredis) · Docker

---

## How it works

### Access tokens

- Standard JWT signed with `JWT_SECRET`.
- Short-lived (default 15 min, configurable via `JWT_ACCESS_TOKEN_TTL_SECONDS`).
- Payload: `{ sub: userId, username, jwtId }` — the `jwtId` (UUID v4) enables per-token revocation without rotating the
  secret.
- Delivered in the response body as `{ accessToken }`.
- Required on all protected endpoints via `Authorization: Bearer <token>` header.

### Refresh tokens

- Not JWTs — 32-byte cryptographically random hex strings.
- Long-lived (default 7 days, configurable via `JWT_REFRESH_TOKEN_TTL_SECONDS`).
- Stored in Redis as `refresh:<token> → userId` with TTL.
- Delivered and received as an `HttpOnly` cookie (`refresh_token`).
- **Single-use with rotation:** each call to `POST /auth/refresh` deletes the old token and issues a new pair.

### Sign-out / revocation

On `POST /auth/sign-out`:

1. The refresh token is deleted from Redis.
2. The current access token's `jwtId` is added to a Redis blocklist (`blocklist:<jwtId>`) with a TTL equal to the
   token's remaining lifetime — the entry auto-expires when the token would have anyway.

The global `AuthGuard` rejects any request whose `jwtId` is found in the blocklist.

### Route protection

`AuthGuard` is registered as a global `APP_GUARD`, so every route is protected by default. Public routes opt out with
the `@PublicRoute()` decorator.

---

## API

### Auth (`/auth`)

| Method | Path             | Auth   | Description                                                                                     |
|--------|------------------|--------|-------------------------------------------------------------------------------------------------|
| `POST` | `/auth/sign-up`  | Public | Register a new user. Returns `{ uuid }`.                                                        |
| `POST` | `/auth/sign-in`  | Public | Authenticate. Returns `{ accessToken }`; sets `refresh_token` HttpOnly cookie.                  |
| `POST` | `/auth/refresh`  | Cookie | Rotate tokens. Reads `refresh_token` cookie; returns new `{ accessToken }` and sets new cookie. |
| `POST` | `/auth/sign-out` | Bearer | Revoke session. Clears the cookie and blocklists the access token. Returns 204.                 |
| `GET`  | `/auth/me`       | Bearer | Returns decoded JWT payload (`sub`, `username`, `jwtId`, `exp`).                                |

### Users (`/users`)

All endpoints require a valid Bearer token.

| Method   | Path         | Description                                                              |
|----------|--------------|--------------------------------------------------------------------------|
| `GET`    | `/users`     | List users. Query params: `limit` (default 10) and `offset` (default 0). |
| `DELETE` | `/users/:id` | Delete a user by UUID.                                                   |

---

## Redis key schema

| Key                 | Value    | TTL                             | Purpose                                                        |
|---------------------|----------|---------------------------------|----------------------------------------------------------------|
| `refresh:<token>`   | `userId` | `JWT_REFRESH_TOKEN_TTL_SECONDS` | Maps a refresh token to its owner. Deleted on use or sign-out. |
| `blocklist:<jwtId>` | `"1"`    | Remaining access token lifetime | Marks an access token as revoked. Auto-expires.                |

---

## Environment variables

Copy `.env.example` to `.env` and fill in the values.

```
APP_PORT=

DB_HOST=
DB_USER=
DB_PASSWORD=
DB_PORT=
DB_NAME=

JWT_SECRET=
JWT_ACCESS_TOKEN_TTL_SECONDS=   # default: 900
JWT_REFRESH_TOKEN_TTL_SECONDS=  # default: 604800
```

> Redis host/port (`REDIS_HOST`, `REDIS_PORT`) are set automatically by Docker Compose and don't need to be in `.env`.

---

## Running locally

### With Docker (recommended)

```bash
npm install
cp .env.example .env   # fill in the values
docker compose up -d --build
npm run typeorm:run-migrations
```

The app will be available at `http://localhost:${APP_PORT}`.

### Without Docker

Start Redis and PostgreSQL manually, set `REDIS_HOST`, `REDIS_PORT` in `.env`, then:

```bash
npm install
npm run typeorm:run-migrations
npm run start:dev
```

---

## Example usage

```bash
# Register
curl -X POST localhost:3000/auth/sign-up \
  -H 'Content-Type: application/json' \
  -d '{"username": "alice", "password": "secret"}'

# Sign in — saves the refresh_token cookie to cookie.txt
curl -c cookie.txt -X POST localhost:3000/auth/sign-in \
  -H 'Content-Type: application/json' \
  -d '{"username": "alice", "password": "secret"}'
# → { "accessToken": "<jwt>" }

# Refresh — sends the cookie, receives a new token pair
curl -b cookie.txt -c cookie.txt -X POST localhost:3000/auth/refresh

# Authenticated request
curl localhost:3000/auth/me \
  -H 'Authorization: Bearer <accessToken>'

# Sign out
curl -b cookie.txt -X POST localhost:3000/auth/sign-out \
  -H 'Authorization: Bearer <accessToken>'
```

---

## Testing

```bash
npm test          # unit tests
npm run test:cov  # with coverage
```

---

## Useful scripts

| Script                               | Description                           |
|--------------------------------------|---------------------------------------|
| `npm run start:dev`                  | Start in watch mode                   |
| `npm run typeorm:run-migrations`     | Apply pending migrations              |
| `npm run typeorm:generate-migration` | Generate migration from entity diff   |
| `npm run docker:rebuild`             | Tear down and rebuild Docker services |
