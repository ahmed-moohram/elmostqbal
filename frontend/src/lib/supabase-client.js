/**
 * Supabase Client - بديل للاختبار
 */

import { createClient } from '@supabase/supabase-js';

// المفاتيح الصحيحة لمشروعك
const SUPABASE_URL = 'https://chikfjvpkqtivtyhvvzt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoaWtmanZwa3F0aXZ0eWh2dnp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1OTQ0MzUsImV4cCI6MjA3OTE3MDQzNX0.UhEmoTArWirw8-W3mozcHQFZxjKt31hiYZJv3L0j3SI';

// إنشاء عميل Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'edu-platform-auth',
  },
});

export default supabase;