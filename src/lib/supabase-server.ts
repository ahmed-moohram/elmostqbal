import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Detect if the service role key is valid (contains role:service_role in base64 payload)
function isValidServiceKey(key: string): boolean {
    if (!key || key === 'YOUR_SERVICE_ROLE_KEY' || key === supabaseAnonKey) return false;
    try {
        const parts = key.split('.');
        if (parts.length !== 3) return false;
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        return payload.role === 'service_role';
    } catch {
        return false;
    }
}

const effectiveKey = isValidServiceKey(supabaseServiceKey) ? supabaseServiceKey : supabaseAnonKey;

if (!supabaseUrl || !effectiveKey) {
    throw new Error(
        'Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    );
}

const usingServiceRole = effectiveKey === supabaseServiceKey;
console.log(`[supabase-server] Using ${usingServiceRole ? 'service_role' : 'anon'} key`);

export const serverSupabase = createClient(supabaseUrl, effectiveKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});

export function getServerSupabase() {
    return serverSupabase;
}
