// دالة رفع الصور إلى Supabase Storage
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wnqifmvgvlmxgswhcwnc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzYwNTUsImV4cCI6MjA3ODAxMjA1NX0.LqWhTZYmr7nu-dIy2uBBqntOxoWM-waluYIR9bipC9M';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const uploadCourseImage = async (file: File): Promise<{ success: boolean; url?: string; error?: any }> => {
  try {
    // إنشاء اسم فريد للملف
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `courses/${fileName}`;

    // رفع الصورة إلى Supabase Storage
    const { data, error } = await supabase.storage
      .from('images') // تأكد من إنشاء bucket اسمه "images" في Supabase
      .upload(filePath, file);

    if (error) {
      console.error('❌ خطأ في رفع الصورة:', error);
      throw error;
    }

    // الحصول على رابط الصورة العام
    const { data: publicUrl } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    console.log('✅ تم رفع الصورة:', publicUrl.publicUrl);
    return { success: true, url: publicUrl.publicUrl };
  } catch (error) {
    console.error('❌ فشل رفع الصورة:', error);
    return { success: false, error };
  }
};

// دالة لتحويل base64 إلى File
export const base64ToFile = (base64: string, filename: string): File => {
  // إزالة البادئة data:image/...;base64,
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
};
