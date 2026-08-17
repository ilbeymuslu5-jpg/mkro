/**
 * Configuration check that does not pull in the Supabase SDK.
 *
 * Importing `lib/supabase.ts` for this alone dragged the whole client into the
 * main bundle — a couple of hundred kilobytes that cannot even run until the
 * project is configured. Callers check here, then dynamically import the data
 * layer only when they are actually about to use it.
 */
export function isSupabaseConfigured(): boolean {
  return (
    (import.meta.env.VITE_SUPABASE_URL ?? '').length > 0 &&
    (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').length > 0
  )
}
