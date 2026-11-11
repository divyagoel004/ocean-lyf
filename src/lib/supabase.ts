import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

/**
 * Only the public anon key lives in the browser. All access control is enforced
 * server-side by Row Level Security (see supabase/policies.sql).
 *
 * "implicit" flow is used on purpose: the magic link works even if the e-mail is
 * opened in a different browser/app than the one the login was requested from
 * (very common on phones).
 */
export const supabase = createClient(
  SUPABASE_URL || 'http://localhost:54321',
  SUPABASE_ANON_KEY || 'missing-anon-key',
  {
    auth: {
      flowType: 'implicit',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: { params: { eventsPerSecond: 10 } },
  },
);
