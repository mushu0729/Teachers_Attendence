import { createClient } from "@supabase/supabase-js";

// This client uses the SERVICE ROLE key and must only ever be
// imported inside server-side code (API routes). Never import
// this file in a "use client" component.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
  }
);
