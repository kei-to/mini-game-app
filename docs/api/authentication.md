# Frontend Authentication API

- API version: `v1`
- Updated: 2026-10-04
- Scope: login, token refresh, logout, and authentication check
- Compatibility: documents the current API. Add future business endpoints to this document.

## Connection

| Environment | API base URL |
| --- | --- |
| Local development | `http://localhost:3000` |
| Production | API URL for the deployment environment |

Paths below are relative to the API base URL. Business APIs are under `/api/v1`. The health endpoint, `GET /api/health`, is not versioned.

### Browser requirements

- The default allowed local origin is `http://localhost:4200`. Set the complete frontend origin in the API server's `AUTH_ALLOWED_ORIGINS` environment variable for production. Separate multiple origins with commas. Do not use paths or wildcards; production origins must use HTTPS.
- For allowed origins, the API returns credentialed CORS headers. Allowed methods are `GET`, `POST`, and `OPTIONS`; allowed headers are `Authorization` and `Content-Type`.
- Browser login, refresh, and logout requests must include credentials. Use Angular `HttpClient`'s `withCredentials: true` or Fetch's `credentials: "include"`.
- The refresh cookie is `HttpOnly`, `SameSite=Strict`, `Path=/api/v1/auth`, and valid for 30 days. It also has `Secure` in production. It is host-only, stored for the API host, and unavailable to JavaScript.
- Because the cookie uses `SameSite=Strict`, frontend and API must be on the same site. `localhost:4200` and `localhost:3000` work for local development because only their ports differ; refresh cookies do not work across different sites.
- Cookie-based `refresh` and `logout` require an `Origin` header and reject origins outside the allowlist. `login` checks the origin when one is present, but allows native clients that omit it.

## Authentication

Access tokens are JWTs valid for 15 minutes. Keep the `accessToken` from login or refresh responses in application memory and send it to protected APIs as:

```http
Authorization: Bearer <accessToken>
```

The JWT payload contains a user ID (`sub`) and other claims. It is signed, not encrypted. Do not use client-side payload values to make authorization decisions. Never store passwords or refresh tokens in a JWT or Web Storage.

### Frontend lifecycle

1. Store the access token in memory after login. After a page reload, obtain a new token using the refresh cookie.
2. Add the access token as a Bearer header to protected APIs.
3. For eligible protected API requests only, handle a `401 unauthorized` by calling `POST /api/v1/auth/refresh` once. On success, update the access token and retry the original request once.
4. Coalesce concurrent refresh calls. Coordinate refresh across tabs as well; reuse of a rotated refresh token revokes active sessions in that token family.
5. On refresh failure, clear the in-memory access token and return the user to login. Do not retry indefinitely.
6. On logout, call the API and clear the in-memory access token after success.

The Angular client exposes these calls through the injectable `AuthService`; the HTTP interceptor adds Bearer tokens and performs the one-time refresh/retry. `API_BASE_URL` is an Angular injection token: its default is an empty string, so requests use same-origin `/api/v1/...` paths. The development server forwards `/api` to the local API. For a deployment that calls the API directly, provide its origin (for example, `https://api.example.com`) as `API_BASE_URL` and configure the API's allowed origin. If the development server uses a port other than 4200, add that exact frontend origin to `AUTH_ALLOWED_ORIGINS`.

Same-tab refreshes are coalesced by `AuthService`. Cross-tab refreshes are serialized with the browser Web Locks API; use a browser supporting Web Locks for multi-tab sessions. The API's `SameSite=Strict` cookie also requires a secure context in production (HTTPS; localhost is considered secure for local development).

## Endpoints

### `POST /api/v1/auth/login`

Validates login credentials, returns an access token, and sets the refresh cookie. The request body limit is 32 KB. Invalid JSON returns `400 invalid_json`; a body over the limit returns `413 payload_too_large`.

Request:

```http
POST /api/v1/auth/login
Content-Type: application/json
Origin: http://localhost:4200
```

```json
{
  "loginId": "user@example.com",
  "password": "your-password"
}
```

`loginId` is trimmed before lookup and accepts 1-254 characters. `password` accepts 1-1024 characters. Passwords created by the operator CLI are limited to 12-128 printable ASCII characters.

Success `200 OK`:

```json
{
  "accessToken": "<JWT>",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

The response includes a refresh-cookie `Set-Cookie` header and `X-Request-Id`. JavaScript must not read or store the cookie value.

| HTTP | Body | Meaning |
| --- | --- | --- |
| `400` | `{"error":"invalid_request"}` | Invalid `loginId` or `password` |
| `401` | `{"error":"invalid_credentials"}` | Invalid credentials or disabled account |
| `403` | `{"error":"forbidden_origin"}` | Supplied origin is not allowed |
| `429` | `{"error":"too_many_requests"}` | Per-IP login limit exceeded; default is 10 attempts per 15 minutes |
| `503` | `{"error":"authentication_busy"}` | Scrypt work and queue are at capacity; includes `Retry-After: 1` |

The login limit is currently per API process. Do not immediately retry `429`. Scrypt defaults to one concurrent operation and a queue of four; wait at least one second before any necessary retry after `503`.

### `POST /api/v1/auth/refresh`

Rotates the refresh cookie and returns a new access token. The request has no body and requires both the origin and cookie.

```http
POST /api/v1/auth/refresh
Origin: http://localhost:4200
Cookie: refresh_token=<sent automatically by the browser>
```

Fetch example:

```javascript
const response = await fetch(`${apiBase}/api/v1/auth/refresh`, {
  method: "POST",
  credentials: "include"
});
```

The success JSON matches login and a new refresh cookie is set. The old refresh token is revoked; reusing it also revokes active sessions in the same token family.

| HTTP | Body | Meaning |
| --- | --- | --- |
| `401` | `{"error":"unauthorized"}` | Cookie missing, expired, revoked, or reuse detected |
| `403` | `{"error":"forbidden_origin"}` | Origin missing or not allowed |

Do not loop on refresh failure; clear the authentication state.

### `POST /api/v1/auth/logout`

Revokes the session associated with the current refresh cookie and clears the cookie. An access-token Authorization header is not required; the origin is required.

```http
POST /api/v1/auth/logout
Origin: http://localhost:4200
Cookie: refresh_token=<sent automatically by the browser>
```

Fetch example:

```javascript
await fetch(`${apiBase}/api/v1/auth/logout`, {
  method: "POST",
  credentials: "include"
});
```

Success is `204 No Content`. It also returns `204` if the cookie is already absent. The cookie is revoked immediately, but issued access tokens can remain valid for up to 15 minutes. Clear the in-memory access token after success.

`403` with `{"error":"forbidden_origin"}` means the origin is missing or not allowed.

### `GET /api/v1/auth/me`

Protected authentication check using a Bearer access token:

```http
GET /api/v1/auth/me
Authorization: Bearer <accessToken>
```

Success `200 OK`:

```json
{
  "userId": "<user-id>"
}
```

No cookie or request body is required. Missing, expired, or incorrectly signed access tokens return `401`.

## Common responses and errors

| HTTP | Body | Frontend handling |
| --- | --- | --- |
| `400` | `{"error":"invalid_request"}` | Correct the input before resending |
| `400` | `{"error":"invalid_json"}` | Correct the JSON syntax |
| `401` | `{"error":"unauthorized"}` or `{"error":"invalid_credentials"}` | Refresh once only for eligible protected APIs; otherwise require login |
| `403` | `{"error":"forbidden_origin"}` | Check origin/CORS configuration; do not retry automatically |
| `404` | `{"error":"not_found"}` | Check the path and API version |
| `413` | `{"error":"payload_too_large"}` | Keep the request body at or below 32 KB |
| `429` | `{"error":"too_many_requests"}` | Suppress further login attempts |
| `503` | `{"error":"authentication_busy"}` | Wait for `Retry-After`; retry only if needed |
| `500` | `{"error":"internal_server_error","requestId":"<id>"}` | Show a generic error and retain the request ID for investigation |

Normal API responses include `X-Request-Id`. Safely handle network failures and responses whose error body does not match the documented format.

## Frontend security notes

- Keep access tokens in memory only; do not store them in `localStorage` or `sessionStorage`. JavaScript must not handle refresh-token values.
- Restrict refresh retries to eligible protected APIs. Never recursively refresh `login`, `refresh`, or `logout` responses with status `401`.
- Treat `403` as an origin rejection, not an expired login; inspect the allowed-origin configuration and request context.
- The browser manages `Set-Cookie`; do not try to read it from JavaScript.
- The API does not reflect SQLi-like or script-like login IDs in its response. JSON is not necessarily escaped for HTML contexts; use framework text binding and avoid `innerHTML`-like APIs. CORS, cookies, and API Helmet do not replace frontend XSS protections.
- `GET /api/health` is unauthenticated and returns `{"status":"ok","service":"api-workspace"}`.