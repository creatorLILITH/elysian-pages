// SERVER ONLY — this module holds the Supabase service-role key.
// Import it only from route handlers under src/app/api/**.
// The `server-only` package is not installed in this project, so the
// server-only boundary is enforced by convention: never import this
// module (or src/lib/db.ts) from a Client Component.
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
