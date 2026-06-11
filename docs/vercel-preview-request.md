# Lexos Vercel Preview Deployment Request

`npm run deploy:preview:request` generates a local approval packet before any Vercel Preview upload.

The command is intentionally read-only. It does not create an archive, upload code, call Vercel APIs, link a Vercel project, push Git, or read secret values. It summarizes:

- Preview runtime readiness from `preview:check`.
- Deployment channel state from `deploy:channel:check`, excluding the expected "approval pending" blocker.
- Upload package boundaries from `deploy:upload:check`.
- Git remote, local Vercel link state, Vercel CLI availability, and recommended next actions.

## Usage

```bash
npm run deploy:preview:request
```

The request can pass while upload approval is still pending. That means the local technical boundary is ready for the user to approve, not that deployment has happened.

## Approval Boundary

External upload remains blocked until the user explicitly approves uploading the current private LexOS project to Vercel Preview. After deployment, set `LEXOS_PREVIEW_BASE_URL` to the returned Preview URL and run:

```bash
npm run smoke:preview
```
