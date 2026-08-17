import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { isSupabaseConfigured } from './supabaseConfig'

const URL = import.meta.env.VITE_SUPABASE_URL ?? ''
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export { isSupabaseConfigured }

/**
 * Null until the project is configured. Every caller must handle that — the
 * app has to render a useful "not configured" screen rather than crashing on
 * a client that was never created.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(URL, ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null

/** Narrows the nullable client at the call site. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase yapılandırılmamış. VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY gerekli.',
    )
  }
  return supabase
}
