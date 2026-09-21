import { createBrowserClient } from '@supabase/ssr';

// Not parameterized with the Database type here on purpose: the hand-written
// types in database.types.ts are a reference/starting point. Once the schema
// is deployed, run `npx supabase gen types typescript --linked` to generate
// the real types and wire them back in as createBrowserClient<Database>(...).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
