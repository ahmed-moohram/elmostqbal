/**
 * Supabase Client - بديل للاختبار
 */

import { createClient } from '@supabase/supabase-js';

// المفاتيح الصحيحة لمشروعك
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('❌ Missing Supabase public configuration! Check your .env.local file');
}

// إنشاء عميل Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'edu-platform-auth',
  },
});

export default supabase;