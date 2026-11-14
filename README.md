<div align="center">

# Elysian Pages

**A quiet space for books, ideas, and one more chapter.**

A digital reading workspace built with Next.js, React, and Supabase. Discover books, curate a personal shelf, and read EPUBs and PDFs with notes, bookmarks, highlights, and adjustable reading themes.

[Local setup](#local-setup) · [Configuration](#environment-variables) · [Database setup](#database-and-storage-setup) · [Deploy on Vercel](#deploy-on-vercel) · [Troubleshooting](#troubleshooting)

</div>

---

## What you can do

- Browse the public library and save books to your personal shelf.
- Upload private EPUB and PDF books to your account.
- Read with selectable themes and adjustable text size where supported by the viewer.
- Keep notes and highlights; use EPUB bookmarks and in-book search.
- Listen to supported book text through the optional Deepgram integration.
- Look up words through the dictionary integration.
- Change your profile avatar and password.
- Manage public books through the existing admin interface.
- Switch between light and dark app themes, with responsive navigation for smaller screens.

> **Deployment status:** This repository includes the Next.js frontend and API routes. It requires external database, authentication, and storage services. It does **not** include a complete database migration or seed package, and some legacy integration constraints remain. Read the setup and deployment limitations before exposing a new instance publicly.

## Technology

| Area | Implementation |
| --- | --- |
| Application | Next.js 16 App Router, React 19, TypeScript |
| UI | Shared CSS design tokens, responsive layouts, GSAP |
| Authentication | Supabase Auth for the current login/signup UI |
| Database | PostgreSQL through `pg`, plus Supabase's Data API |
| Storage | Supabase Storage: public and private book buckets |
| EPUB | `epubjs` and `react-reader` |
| PDF | `react-pdf` and PDF.js |
| Speech | Server-side Deepgram proxy |
| Dictionary | Server-side English Wiktionary lookup |
| Code checks | Oxlint and Next.js production build |

Versions are defined in [package.json](./package.json). The repository currently contains a Bun lockfile.

## Local setup

### 1. Prerequisites

- Git.
- A Node.js version supported by both Next.js and your hosting provider. The installed Next.js package requires **Node.js 20.9 or newer**; use an actively supported LTS release and match it between local development and hosting.
- Bun, or npm.
- A configured Supabase project and a reachable PostgreSQL database.
- A Deepgram account only if you want text-to-speech.

### 2. Get the code and install dependencies

Clone your fork or this repository using its GitHub clone URL, then enter the repository root. The complete Next.js application lives here: there are no separate `client/`, `server/`, or enclosing `nextjs/` directories.

For the committed lockfile:

```bash
bun install --frozen-lockfile
```

Alternatively:

```bash
npm install
```

There is no committed npm lockfile at present, so `npm ci` is not the initial setup command. Pick one package manager for your deployment and maintain its lockfile consistently.

### 3. Create your private local configuration

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Fill in `.env.local` locally using credentials from your own service accounts. See the configuration table below.

**Never commit, force-add, paste into issues, or upload `.env.local` to GitHub.** Only the blank [`.env.example`](./.env.example) template belongs in source control.

### 4. Configure your database and storage

Complete [Database and storage setup](#database-and-storage-setup) before expecting login, profile, library, and upload features to work. Installing JavaScript dependencies does not create tables, policies, or buckets.

### 5. Run the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To check a production build locally:

```bash
npm run lint
npm run build
npm run start
```

Restart the development server after editing environment variables.

## Environment variables

Use [`.env.example`](./.env.example) for names and defaults. Do not copy real credentials into this README.

| Variable | Used by | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser | Supabase project URL for authentication and profile requests |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser | Supabase public anon key; access must be restricted by Row Level Security |
| `SUPABASE_URL` | Server | Supabase project URL for privileged API operations |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Service-role key for storage and private-book operations |
| `DB_USER` | Server only | PostgreSQL connection username |
| `DB_HOST` | Server only | Database or pooler hostname |
| `DB_NAME` | Server only | Database name |
| `DB_PASSWORD` | Server only | Database password |
| `DB_PORT` | Server only | Database/pooler port; use the value from your connection settings |
| `DEEPGRAM_API_KEY` | Server only, optional | Enables the `/api/tts` speech proxy |
| `DEEPGRAM_TTS_MODEL` | Server only, optional | Model identifier; current code default: `flux-hannah-en` |
| `DEEPGRAM_TTS_SPEED` | Server only, optional | Speech speed; current code default: `1` |

The browser and server Supabase URLs should normally point to the **same project**. The PostgreSQL connection must reach the database holding the public library tables.

Only `NEXT_PUBLIC_*` values are intended for the browser. **Never prefix a database password, Deepgram key, or Supabase service-role key with `NEXT_PUBLIC_`.** Public variables are embedded into client bundles during the build; changing them requires a new deployment.

The `DB_*` fields are read separately by [src/lib/db.ts](./src/lib/db.ts). Setting only `DATABASE_URL` will not configure this application.

## Database and storage setup

### Supabase authentication

1. Create or select your own Supabase project.
2. Enable email/password authentication.
3. Configure email confirmation and email delivery for your intended environment.
4. In Auth URL Configuration, set the Site URL to your production domain after deployment. Configure approved local and preview redirect URLs as needed.
5. Provision profile records for new Auth users through your existing database trigger or a trusted server-side provisioning process. The signup UI sends `username` as user metadata; it does not itself insert a `profiles` row.

See [Supabase redirect URL documentation](https://supabase.com/docs/guides/auth/redirect-urls).

### Database expectations

**No canonical SQL migrations are included.** The following is a code-derived inventory, not a complete schema definition. Obtain a compatible schema from your deployment's maintainer, or create and review tables, defaults, relationships, policies, and signup triggers before deploying a fresh database.

| Table | Fields referenced by the application | Purpose |
| --- | --- | --- |
| `profiles` | `id`, `username`, `avatar`, `role` | Profile page and admin gate; `id` matches the Supabase Auth user ID |
| `users` | `email`, `role`; legacy routes also use `id`, `username`, `password` | Login role lookup and legacy password-based API routes |
| `library_books` | `id`, `title`, `author`, `category`, `file_url`, `cover_url`, `uploaded_by`, `is_public`, `is_archived` | Public catalog and admin book operations |
| `private_books` | `id`, `user_id`, `title`, `author`, `file_name`, `storage_path`, `file_type`, `file_size`, `created_at` | User-owned upload metadata |
| `books` | `id`, `title`, `author`, `category`, `genre`, `cover_url`, `file_url` | Legacy upload route |
| `user_library` | `user_id`, `book_id` | Legacy add-to-library API |

Current login/signup screens use **Supabase Auth**, not `/api/login` and `/api/signup`. Those PostgreSQL/bcrypt endpoints are legacy code.

Role handling currently spans two tables: login checks `users.role` by email, while the admin gate checks `profiles.role` by Auth ID. A compatible deployment must keep these records consistent. Assign admin access through a trusted administrative process, never through a user-editable role field.

Enable and review Row Level Security for browser-accessible tables. A user should be able to read their profile and update permitted fields such as their avatar, without gaining the ability to grant themselves an administrator role. Private-book API routes verify the Auth bearer token and scope metadata operations to the authenticated owner.

### Storage buckets

| Bucket | Visibility | Contents |
| --- | --- | --- |
| `elysian-books` | Public | Public book files under `books/` and cover images under `covers/` |
| `private-books` | Private | User-owned PDFs and EPUBs under a user-ID directory |

Create these exact bucket names. Configure compatible MIME types, size limits, and access policies in Supabase.

Private files must remain private. The application creates a **10-minute signed read URL** only after checking book ownership. Do not replace this with public access to resolve permission errors.

For public books, `file_url` and `cover_url` should be full reachable URLs. The book host must permit the deployed reader to fetch its files.

### PostgreSQL connections on Vercel

Use connection details appropriate to a serverless environment. Supabase recommends transaction pooling for transient/serverless clients; obtain the correct host, user, database, password, and port from your project's connection panel rather than guessing them. See [Supabase PostgreSQL connections](https://supabase.com/docs/guides/database/connecting-to-postgres).

The current pool explicitly enables SSL with `rejectUnauthorized: false`. Review your database provider's certificate requirements before production use.

## Deploy on Vercel

### 1. Prepare the repository

- Finish local setup and run `npm run lint` and `npm run build`.
- Commit source code and the blank environment template.
- Confirm that local credentials are excluded:

```bash
git check-ignore -v .env.local
git ls-files -- .env.local
git diff --cached --name-only
```

The first command should show an ignore rule. The second should print **nothing**. Review staged filenames before pushing; do not use `git add -f` for environment files.

### 2. Import your GitHub repository

Open [Vercel New Project](https://vercel.com/new), connect GitHub, and import your repository.

Use these project settings:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root directory | Repository root (`.`); `package.json` is at the top level |
| Install command | `bun install --frozen-lockfile` for the committed Bun lockfile |
| Build command | `npm run build` |
| Output directory | Leave the Next.js default; do not set `out` |
| Node.js version | An actively supported Vercel Node.js LTS release compatible with Next.js, matching local development |

If you switch to npm for deployment, commit a corresponding `package-lock.json` and use `npm ci` after generating it. Do not configure `npm ci` against a repository that has no npm lockfile.

This is a full-stack Next.js app with server API routes. It is **not** a static export, and it does not require a separate Express server for its same-origin `/api` routes.

See [Vercel build configuration](https://vercel.com/docs/builds/configure-a-build) and [supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

### 3. Add environment variables privately

In the Vercel project settings, add the variables listed in [Environment variables](#environment-variables) before deploying.

- Select the intended environments: Production and, where appropriate, Preview and Development.
- Use separate non-production services for preview deployments when possible.
- Enter secrets in Vercel's environment settings. Do **not** upload `.env.local` to GitHub.
- Never place secret values in `next.config.ts`, `vercel.json`, screenshots, or build-command arguments.
- Redeploy after changing variables, especially the browser-facing `NEXT_PUBLIC_*` values.

See [Vercel environment variables](https://vercel.com/docs/environment-variables).

### 4. Deploy and configure your domain

Click **Deploy**. Once the deployment succeeds:

1. Open the generated `.vercel.app` address.
2. Update Supabase's Site URL and approved redirect URLs.
3. If using a custom domain, add it under Vercel's Domains settings and follow the DNS instructions shown for that domain.
4. Verify database connectivity, Auth configuration, and storage access on the deployed origin.
5. Use runtime logs to investigate server failures without posting credentials publicly.

Git-connected deployments can create previews for branches and deploy changes from the configured production branch.

### 5. Understand the upload limitation

The private-book route validates files up to **50 MB**, but uploads currently pass through a Next.js route handler. Vercel Functions have a **4.5 MB request-body limit**, including multipart overhead. A file can therefore pass the application's advertised size rule and still be rejected by Vercel before reaching the handler.

Keep test uploads comfortably below the platform limit. Supporting the full advertised limit on Vercel requires a separate implementation of authenticated direct-to-storage uploads, or hosting the upload endpoint on infrastructure with suitable request limits. That change is **not implemented** here. Increasing `maxDuration` does not increase the payload limit.

See [Vercel Function limits](https://vercel.com/docs/functions/limitations) and [large-upload guidance](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions).

### 6. Check the deployed app

- [ ] Landing, login, signup, and library pages load.
- [ ] Signup, confirmation email if enabled, login, and logout work.
- [ ] A new account has the expected profile record.
- [ ] Profile avatar/password changes work with the configured policies.
- [ ] Public covers and books load from the deployed domain.
- [ ] Saved shelves and recent books behave as expected in the same browser.
- [ ] An EPUB and PDF open; test paging, themes, notes, highlights, and supported search/bookmark tools.
- [ ] A small private upload can be listed, opened, and deleted by its owner.
- [ ] Another account cannot access that private book.
- [ ] Admin permissions and public-book management are verified.
- [ ] Optional speech and dictionary integrations work.
- [ ] Mobile layouts and keyboard access work.
- [ ] Environment files and privileged keys are absent from the repository and browser bundle.

## Other hosting options

A Node-capable host can run the production server:

```bash
npm run build
npm run start
```

Configure environment variables through the host's secret settings, persist files in external storage, and provide HTTPS. The host must support Next.js server rendering and route handlers; static file hosting alone is insufficient. Choose upload and request-duration limits appropriate to the files you intend to support.

## Project structure

```text
src/
  app/
    page.tsx                Landing page
    layout.tsx              Root layout, fonts, and theme initialization
    globals.css             Shared primitives and design tokens
    workspace.css           Reading-workspace visual system
    login/, signup/         Supabase authentication screens
    dashboard/              Saved and recently opened shelves
    library/, mylibrary/    Public and personal libraries
    reader/                 EPUB/PDF reading workspace
    profile/, admin/        Account and catalog management
    api/                    Server-side API route handlers
  components/
    ui/                     Shared navigation, cards, headers, and themes
    ReaderToolbar.tsx       Reader dock and its controls
    EPUBViewer.tsx          EPUB rendering and interactions
    PDFViewer.tsx           PDF rendering and interactions
    Reader.css              Reader layout and theme-aware controls
  lib/
    db.ts                   Server PostgreSQL pool
    supabase-client.ts      Browser Supabase client
    supabase-admin.ts       Privileged server Supabase client
    auth.ts                 Private-books bearer-token verification
    book-handoff.ts         Per-tab reader book handoff
    reader-tts.ts           Speech playback coordination
    motion.ts               GSAP reveal helpers
public/                     Static assets, manifest, and PDF worker
.env.example                Blank, shareable configuration template
```

Main routes: `/`, `/login`, `/signup`, `/dashboard`, `/library`, `/mylibrary`, `/reader`, `/profile`, `/admin`, and the legacy `/home`.

API handlers live under `src/app/api`, including public books, private-book upload/read/delete, public-book management, dictionary lookup, speech, and legacy authentication/library endpoints.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Compile and type-check the production application |
| `npm run start` | Serve a completed production build |
| `npm run lint` | Run Oxlint |
| `npm run lint:fix` | Apply supported automatic lint fixes |

There is no dedicated automated test script in `package.json`. A successful build does not prove that live database, email, upload, or playback flows work; run the deployment checks above.

## Data persistence and current limitations

- Saved public shelves, recent reads, and several reader annotations/preferences use browser storage. Do not assume they synchronize across devices or accounts. Clearing browser storage can remove them.
- Private uploads and their metadata use Supabase Storage and the `private_books` table.
- Opening a book uses a session-storage handoff. A direct link to `/reader` in a fresh tab has no selected book.
- Reader progress metadata currently includes a legacy random approximation; it is not a reliable measured completion percentage.
- Some legacy relative cover/file URLs still resolve against the original Render host in source code. Independent deployments should review those references and use their own absolute catalog URLs. The legacy `/api/upload` route creates a file URL but does not persist uploaded file bytes.
- The admin page has a client-side gate, but public upload/delete API handlers currently lack equivalent server-side authorization checks. Protect or harden these endpoints before allowing untrusted public traffic. The speech endpoint also needs suitable usage controls for a public deployment.
- Public catalog selection currently queries the full `library_books` table; do not place private records there expecting the listing endpoint to filter them.
- The repository contains legacy and current authentication paths. Provisioning only Supabase Auth users does not populate all application tables.
- Text-to-speech depends on a valid key, account access to the configured model, and the upstream API. The defaults above describe the code, not a guarantee of service availability.
- Google fonts are loaded through `next/font` at build time; restricted build-network access can cause font-fetch failures.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Supabase URL/key errors during build | Both `NEXT_PUBLIC_SUPABASE_*` variables must exist before the build; configure server variables too |
| Environment changes have no effect | Restart local development or create a new Vercel deployment |
| `/api/books` returns 500 | Verify `DB_*`, network access, SSL compatibility, and the `library_books` schema |
| Database connection failures on Vercel | Use the provider's supported pooler configuration and check connection limits |
| Signup succeeds but profile is missing | Check the profile provisioning trigger/process and RLS policies |
| Admin login redirects incorrectly | Check both `users.role` and `profiles.role`; keep them consistent |
| Private uploads return 401 | Sign in again; private endpoints require a valid Supabase bearer token |
| Upload fails with 413 | Check Vercel's request-body limit as well as the application's file-size validation |
| Storage reports bucket not found | Create `elysian-books` and `private-books` with the expected visibility |
| Private book stops loading after waiting | Reopen it from My Library to obtain a new signed URL |
| Cover or EPUB/PDF fails to load | Verify the URL, storage permissions, CORS, MIME type, and legacy Render-host references |
| Speech returns 503 | Configure `DEEPGRAM_API_KEY` on the server |
| Speech returns 502 | Check upstream model access, API compatibility, quota, and server logs |
| Reader opens with no book | Select a book from a shelf in the same tab |
| Build reports a Next.js configuration error | Match the installed package/lockfile; read the bundled Next.js docs before changing version-specific flags |

## Keeping credentials private

- `.gitignore` excludes `.env*`, with an exception only for the blank `.env.example`.
- [`.vercelignore`](./.vercelignore) also excludes environment files from Vercel CLI source uploads. Configure deployment values through Vercel's environment settings; see [Vercel file exclusions](https://vercel.com/docs/deployments/vercel-ignore).
- Do not attach environment files to issues, pull requests, documentation, logs, or screenshots.
- Review staged files and enable available GitHub secret-scanning/push-protection features.
- If a secret is ever exposed, revoke or rotate it immediately. Deleting the file or adding an ignore rule does not remove it from Git history.

Ignoring a file does not protect a file that was already tracked. If your own fork accidentally tracks `.env.local`, remove it from Git's index while keeping your local copy:

```bash
git rm --cached -- .env.local
```

Then commit that removal, rotate exposed credentials, and follow [GitHub's sensitive-data removal guide](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) when history cleanup is needed.

## Contributing

1. Create a branch and use your own development services and private environment file.
2. Preserve existing reading, authentication, and library behavior.
3. Follow [AGENTS.md](./AGENTS.md), including the installed Next.js documentation guidance.
4. Run lint and the production build; manually exercise affected flows.
5. Describe changes, validation, and remaining limitations in your pull request.
6. Share only book content and artwork you have permission to distribute.

No project license file is currently included. Confirm licensing with the repository owner before redistributing the code.
