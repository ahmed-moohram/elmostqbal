const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/^NEXT_PUBLIC_SUPABASE_URL=(.*)$/m);
const anonKeyMatch = env.match(/^NEXT_SUPABASE_ANON_KEY=(.*)$/m);
const url = urlMatch ? urlMatch[1].trim().replace(/['"]/g, '') : '';
const key = anonKeyMatch ? anonKeyMatch[1].trim().replace(/['"]/g, '') : '';

const supabase = createClient(url, key);

async function testInsert() {
    const payload = {
        course_id: '730b381f-8231-43f4-906e-f6bb4d67a22e',
        code: 'TESTCODE123',
        created_by: '11111111-1111-1111-1111-111111111111',
        max_uses: 1,
        is_used: false,
        current_uses: 0,
    };

    const { data, error } = await supabase.from('course_access_codes').insert([payload]);
    console.log("INSERT WITH ANON KEY RESULT:", { data, error });
}

testInsert();
