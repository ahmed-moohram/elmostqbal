const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'src', 'app', 'api');

function getAllTsFiles(dir) {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...getAllTsFiles(fullPath));
        } else if (entry.name.endsWith('.ts')) {
            results.push(fullPath);
        }
    }
    return results;
}

// Patterns to find and replace
const patterns = [
    // Pattern: import createClient + serviceKey check + throw
    {
        regex: /import \{ createClient \} from '@supabase\/supabase-js';\r?\n\r?\nconst supabaseUrl = process\.env\.NEXT_PUBLIC_SUPABASE_URL;\r?\nconst supabaseServiceKey = process\.env\.SUPABASE_SERVICE_ROLE_KEY;\r?\n\r?\nif \(!supabaseUrl \|\| !supabaseServiceKey\) \{[\s\S]*?\}\r?\n\r?\nconst supabase = createClient\(supabaseUrl, supabaseServiceKey\);/g,
        replacement: `import { serverSupabase as supabase } from '@/lib/supabase-server';`
    },
    // Pattern: with export const dynamic before the check
    {
        regex: /import \{ createClient \} from '@supabase\/supabase-js';\r?\n\r?\nexport const dynamic = 'force-dynamic';\r?\n\r?\nconst supabaseUrl = process\.env\.NEXT_PUBLIC_SUPABASE_URL;\r?\nconst supabaseServiceKey = process\.env\.SUPABASE_SERVICE_ROLE_KEY;\r?\n\r?\nif \(!supabaseUrl \|\| !supabaseServiceKey\) \{[\s\S]*?\}\r?\n\r?\nconst supabase = createClient\(supabaseUrl, supabaseServiceKey\);/g,
        replacement: `import { serverSupabase as supabase } from '@/lib/supabase-server';\n\nexport const dynamic = 'force-dynamic';`
    },
];

const files = getAllTsFiles(apiDir);
let fixedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    for (const { regex, replacement } of patterns) {
        if (regex.test(content)) {
            content = content.replace(regex, replacement);
            modified = true;
        }
        regex.lastIndex = 0; // Reset regex
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed:', file.replace(__dirname + '\\', ''));
        fixedCount++;
    }
}

console.log(`\nTotal files fixed: ${fixedCount}`);
