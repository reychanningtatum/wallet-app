import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://ekhbvsbyvatkzkrxpkjr.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_fK5ugsmPlD4Ud0zng765_A_XKCQYoEN'

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
)