# Elysian Pages
A modern digital library and eBook reader built using React, Node.js, Express, and PostgreSQL.

# Features
-User Authentication
-EPUB Reader
-Personal Library
-Public Library (Selected catalogue of books that are avalible free on the internet)

# Project Status
This project is currently under active development.

## Next.js reading workspace

A standalone Next.js version is available in [nextjs/](./nextjs/), with a redesigned
reading workspace, EPUB/PDF reader controls, and same-origin API routes.

See the [Next.js setup and deployment guide](./nextjs/README.md) for local setup,
Supabase/PostgreSQL requirements, Vercel configuration, and current limitations.
The existing `client/` and `server/` applications remain in their original locations.

Local environment files must stay private. Use the blank
[nextjs/.env.example](./nextjs/.env.example) template and configure hosting secrets
through the provider's environment settings; never commit `.env.local`.
