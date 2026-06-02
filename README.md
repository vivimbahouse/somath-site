# SOMATH (School of Math) Website

Source for **schoolofmath.us** — Upper West Side math tutoring.

- Hosted on Cloudflare Worker `bitter-tooth-81ed`
- Auto-deploys on push to `main` via GitHub Actions
- Worker handles lead capture + gated PDF downloads
- Static assets served via Cloudflare Assets binding

## Editing

1. Edit files locally or on github.com
2. Commit and push to `main`
3. GitHub Actions runs `wrangler deploy` automatically (~30 sec)

## Local dev

```bash
npm install -g wrangler@4
wrangler dev
```

## Secrets (already set in Cloudflare, do NOT commit)

- `PDF_SIGNING_SECRET` — HMAC for signed PDF download tokens
- `RESEND_API_KEY` — email service (currently unused; reserved for future verification flow)
