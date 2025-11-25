/**
 * Supabase Test Client - للاختبار فقط
 */

import { createClient } from '@supabase/supabase-js';

// جرب هذه المفاتيح البديلة (مشروع chikf الجديد)
const configs = [{
    url: 'https://chikfjvpkqtivtyhvvzt.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoaWtmanZwa3F0aXZ0eWh2dnp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1OTQ0MzUsImV4cCI6MjA3OTE3MDQzNX0.UhEmoTArWirw8-W3mozcHQFZxjKt31hiYZJv3L0j3SI'
}];

// استخدم أول config
const { url, key } = configs[0];

console.log('🔐 Testing Supabase connection with:', { url });

// إنشاء عميل Supabase بدون auth options
const supabase = createClient(url, key, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

// دالة لجلب الدورات مباشرة
export async function fetchCoursesDirectly() {
    try {
        console.log('📡 Attempting direct fetch...');

        // محاولة جلب البيانات بطريقة مختلفة
        const response = await fetch(`${url}/rest/v1/courses?select=*`, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        });

        console.log('📊 Response status:', response.status);

        if (!response.ok) {
            const error = await response.text();
            console.error('❌ API Error:', error);
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Direct fetch successful:', data);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Direct fetch failed:', error);
        return { data: null, error };
    }
}

export default supabase;