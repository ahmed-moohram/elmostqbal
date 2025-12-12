// دالة رفع الصور إلى Supabase Storage
import supabase from '@/lib/supabase-client';

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

export const uploadTeacherAvatar = async (file: File): Promise<{ success: boolean; url?: string; error?: any }> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `teachers/${fileName}`;

    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (error) {
      console.error('❌ خطأ في رفع صورة المدرس:', error);
      throw error;
    }

    const { data: publicUrl } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl.publicUrl };
  } catch (error) {
    console.error('❌ فشل رفع صورة المدرس:', error);
    return { success: false, error };
  }
};

// دالة رفع فيديوهات الدروس إلى Supabase Storage
export const uploadLessonVideo = async (file: File): Promise<{ success: boolean; url?: string; error?: any }> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `lessons/${fileName}`;

    // ملاحظة: تأكد من وجود Bucket باسم "videos" في Supabase وأنه يسمح بالوصول العام أو حسب إعداداتك
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(filePath, file);

    if (error) {
      console.error('❌ خطأ في رفع الفيديو:', error);
      throw error;
    }

    const { data: publicUrl } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);

    console.log('✅ تم رفع الفيديو:', publicUrl.publicUrl);
    return { success: true, url: publicUrl.publicUrl };
  } catch (error) {
    console.error('❌ فشل رفع الفيديو:', error);
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
