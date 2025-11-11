/**
 * Supabase Test Client - للاختبار فقط
 */

import { createClient } from '@supabase/supabase-js';

// جرب هذه المفاتيح البديلة
const configs = [
  {
    url: 'https://wnqifmvgvlmxgswhcwnc.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA5MzU1NjIsImV4cCI6MjA0NjUxMTU2Mn0.xBMuKS_2e5g7CqPh6WGXdZqZ0nj6qBtAGGNjobVGnWg'
  }
];

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
