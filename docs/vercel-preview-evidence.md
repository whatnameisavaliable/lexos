# Vercel Preview Deployment Evidence

`npm run deploy:preview:evidence` verifies the local evidence metadata after a real Vercel Preview upload has completed. It is read-only: it does not upload code, call Vercel APIs, link a project, push Git, run Playwright, or write evidence files.

Required metadata:

- `LEXOS_DEPLOY_APPROVED_TO_UPLOAD=true`
- `LEXOS_DEPLOY_APPROVAL_REF`
- `LEXOS_PREVIEW_BASE_URL`
- `LEXOS_PREVIEW_DEPLOYMENT_REF` or `LEXOS_PREVIEW_DEPLOYMENT_ID`
- `LEXOS_PREVIEW_BUILD_LOG_REF`
- `LEXOS_PREVIEW_SMOKE_REF`
- `LEXOS_PREVIEW_DEPLOYMENT_OWNER` or `LEXOS_POST_DEPLOYMENT_OWNER`
- `LEXOS_PREVIEW_DEPLOYED_AT`

PowerShell example after deployment:

```powershell
$env:LEXOS_DEPLOY_APPROVED_TO_UPLOAD="true"
$env:LEXOS_DEPLOY_APPROVAL_REF="chat-20260610-preview-approval"
$env:LEXOS_PREVIEW_BASE_URL="https://lexos-preview.vercel.app"
$env:LEXOS_PREVIEW_DEPLOYMENT_REF="dpl_example"
$env:LEXOS_PREVIEW_BUILD_LOG_REF="vercel-build-log-20260610"
$env:LEXOS_PREVIEW_SMOKE_REF="reports/preview-smoke/results.json"
$env:LEXOS_PREVIEW_DEPLOYMENT_OWNER="delivery-owner"
$env:LEXOS_PREVIEW_DEPLOYED_AT="2026-06-10T14:00:00.000Z"
npm run deploy:preview:evidence
```

Run order:

1. Before upload, run `npm run deploy:preview:request` and archive the approval packet.
2. After explicit approval, upload to Vercel Preview with the approved method.
3. Set `LEXOS_PREVIEW_BASE_URL` to the returned Preview URL.
4. Run `npm run smoke:preview`. By default this writes a JSON report to `reports/preview-smoke/results.json`; override with `LEXOS_PREVIEW_SMOKE_REPORT_PATH` if a different archive path is required.
5. Set the evidence variables above and run `npm run deploy:preview:evidence`.
6. Run `npm run final:gate:check` after evidence is complete.

This check is Preview-only. Production deployment still requires separate explicit production approval and a separate evidence trail.
