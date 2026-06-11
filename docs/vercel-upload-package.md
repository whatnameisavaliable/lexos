# Lexos Vercel Upload Package Check

`npm run deploy:upload:check` is a local-only dry run for the files that would be eligible for a Vercel upload.

It is meant to run after `npm run deploy:channel:check` and before any real Vercel deploy action. The command reads `.vercelignore`, walks the current workspace, and reports whether high-risk local paths or sensitive-looking text files would be included.

## Usage

```bash
npm run deploy:upload:check
```

The command does not create an archive, upload code, call Vercel APIs, link a Vercel project, push Git, or read `.env.local` values. It only uses local file paths and small text-file scans to prove the upload boundary.

## Required Project Paths

The check expects these paths to exist before a deploy package is considered ready:

- `.vercelignore`
- `app`
- `package-lock.json`
- `package.json`
- `src`
- `next.config.mjs`
- `postcss.config.mjs`
- `tailwind.config.ts`
- `tsconfig.json`

## Blockers

The command blocks when:

- `.vercelignore` is missing or empty.
- Required project paths are missing.
- High-risk local paths would be uploaded, such as `.git`, `.next`, `.tmp`, `backups`, `coverage`, `dist`, `node_modules`, `playwright-report`, `reports`, `test-results`, `tests`, or `supabase/.temp`.
- High-risk local files would be uploaded, such as `.env*`, `dev-server*.log`, `*.log`, or `tsconfig.tsbuildinfo`.
- Included text files contain private-key blocks, database URLs with passwords, JWT-like secrets, or common third-party API key shapes.

## Relationship To Other Gates

- `deploy:channel:check` confirms the deploy target, upload approval, deployment method, Git remote, local Vercel link state, and required `.vercelignore` patterns.
- `deploy:upload:check` confirms the resulting local upload boundary and scans included text files for sensitive-looking content.
- `final:gate:check` aggregates both checks so deployment signoff fails before any actual upload when either one is blocked.

For a Preview deploy, both checks must pass and the user must explicitly approve uploading the current private Lexos project to Vercel.
