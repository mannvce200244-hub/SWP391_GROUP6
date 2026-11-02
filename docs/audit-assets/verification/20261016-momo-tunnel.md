# Local MoMo sandbox HTTPS tunnels — 2026-10-16

## User authorization and process inspection

The user requested automatic local port inspection, HTTPS tunnel startup and
MoMo configuration. Confirmed the frontend Vite process serves `D:/m4n` on 5173
and the backend health endpoint identifies `m4n-backend` on 8080. PostgreSQL
continues on 5432. No unrelated application was stopped.

An existing frontend cloudflared process was already running; its local metrics
endpoint exposed its hostname, so it was reused. Started only the missing
backend tunnel, using the user's cached cloudflared 2026.10.1 executable.
No project dependency was installed.

## Active URLs for this run

| Purpose | URL |
| --- | --- |
| Website | https://secretary-sagem-findings-searches.trycloudflare.com |
| MoMo return | https://secretary-sagem-findings-searches.trycloudflare.com/payment-return |
| Backend health | https://flex-conflict-bass-feeds.trycloudflare.com/api/v1/health |
| MoMo IPN | https://flex-conflict-bass-feeds.trycloudflare.com/api/v1/payments/momo/ipn |

These quick-tunnel URLs are temporary. Keep both tunnel processes running.
The existing frontend tunnel is owned by the user's terminal; the backend tunnel
was started hidden in the background. Cloudflare describes quick tunnels as
[temporary testing endpoints](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).

Runtime PIDs at verification: frontend 32788, frontend tunnel 31212, backend
34076, backend tunnel 24720. The backend was restarted from its freshly packaged
JAR with Java 21, schema validation and development seeding disabled. The former
IntelliJ backend process was verified as M4N before replacing it. Do not start a
second IDE backend on 8080 while this process is running.

## Configuration

- Ignored backend `.env`: enabled MoMo; set return/IPN URLs, frontend origin,
  exact CORS origin, Secure cookies and HTTPS product-image public base URL.
  Previously configured public sandbox sample keys remain backend-only.
- Ignored frontend `.env.local`: `/api/v1` API base, local 8080 proxy target and
  the exact frontend hostname. Vite's configuration now supports these optional
  development settings; unrelated hosts remain rejected.
- Browser requests use the frontend HTTPS origin and are proxied locally to the
  backend, avoiding mixed content and cross-site refresh-cookie problems.
  The separate backend HTTPS tunnel is used for MoMo's server-to-server IPN.
- Previous settings are preserved in ignored
  `m4n-backend/target/momo-tunnel-runtime.local.json`; process IDs and logs for
  the newly started backend/tunnel are also in that ignored target directory.

## Verification

- `mvnw.cmd -o -DskipTests package`: passed. The 41 relevant backend payment
  tests passed earlier the same day; Java/payment business code did not change
  during this tunnel setup, so they were not rerun.
- `npm run lint`, `npm run build`: passed.
- `node --test tests/*.test.mjs`: 30 passed, zero failures.
- Local backend, public backend, local frontend proxy and public frontend proxy
  all return HTTP 200 and `momoAvailable=true` from `/api/v1/payments/options`.
- Public return page and backend health return HTTP 200. Invalid unsigned IPN
  `{}` returns HTTP 400 rather than reaching payment processing.
- Backend CORS preflight permits the exact frontend origin with credentials;
  an untrusted origin returns 403. A raw HTTP request to Vite with an untrusted
  Host also returns 403.
- Headless Edge with the existing seeded demo Customer account: login succeeds
  through the public frontend; the cookie is Secure, HttpOnly, SameSite=Lax and
  scoped to that frontend hostname. Reload refresh returns 200. Direct checkout
  displays an enabled, selectable MoMo option; all API fetch/XHR requests use
  the frontend HTTPS origin. The public payment-return page rejects a missing
  order ID. No uncaught page errors occurred. The test session was logged out
  successfully (204). Chrome headless could not launch on this machine during
  this run; the installed Edge browser completed the verification instead.
- No order or wallet payment was submitted, and no cart/inventory was mutated.
  No schema change or test-account reset was performed. Actual wallet payment
  and a real MoMo IPN after payment still require completing the MoMo Test flow.
- [Checkout screenshot](20261016-momo-tunnel-checkout.png).

## Starting replacement tunnels later

In two terminals, with M4N running on the same local ports:

```powershell
npx cloudflared tunnel --url http://localhost:5173
```

```powershell
npx cloudflared tunnel --url http://localhost:8080
```

Copy the newly generated frontend hostname into `DEV_TUNNEL_HOST`, and its
HTTPS origin into `FRONTEND_URL`, the exact CORS list and
`MOMO_REDIRECT_URL=<frontend>/payment-return`. Set
`MOMO_IPN_URL=<backend>/api/v1/payments/momo/ipn` and the backend HTTPS media
base URL. Restart the backend and ensure Vite reloads the environment settings.
Use the public frontend URL for the complete demo, including login and checkout.
