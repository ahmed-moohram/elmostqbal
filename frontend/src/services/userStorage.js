/**
 * خدمات إدارة بيانات المستخدم في التخزين المحلي
 * تضمن تخزين واسترداد بيانات المستخدم بشكل موثوق مع آليات للمزامنة والنسخ الاحتياطي
 */

// مفتاح ثابت للتخزين المحلي
const USER_STORAGE_KEY = 'user';
const BACKUP_STORAGE_KEY = 'user_backup';
const LAST_SYNC_KEY = 'last_user_sync';

/**
 * حفظ بيانات المستخدم مع نسخة احتياطية ووقت المزامنة
 */
export const saveUserData = (userData) => {
  try {
    // تأكد من أن البيانات لا تحتوي على undefined
    const sanitizedData = JSON.parse(JSON.stringify(userData));
    
    // حفظ البيانات الأساسية
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sanitizedData));
    
    // حفظ نسخة احتياطية
    sessionStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(sanitizedData));
    
    // تسجيل وقت آخر مزامنة
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    
    return true;
  } catch (error) {
    console.error('خطأ في حفظ بيانات المستخدم:', error);
    return false;
  }
};

/**
 * استرداد بيانات المستخدم مع الاسترداد التلقائي من النسخة الاحتياطية إذا لزم الأمر
 */
export const getUserData = () => {
  try {
    // محاولة استرداد البيانات من التخزين المحلي
    const userData = localStorage.getItem(USER_STORAGE_KEY);
    
    if (userData) {
      return JSON.parse(userData);
    }
    
    // إذا لم تكن البيانات موجودة، استرداد من النسخة الاحتياطية
    const backupData = sessionStorage.getItem(BACKUP_STORAGE_KEY);
    
    if (backupData) {
      const parsedBackup = JSON.parse(backupData);
      // استعادة البيانات الأساسية من النسخة الاحتياطية
      localStorage.setItem(USER_STORAGE_KEY, backupData);
      return parsedBackup;
    }
    
    return null;
  } catch (error) {
    console.error('خطأ في استرداد بيانات المستخدم:', error);
    return null;
  }
};

/**
 * تحديث حقل معين في بيانات المستخدم دون المساس بالحقول الأخرى
 */
export const updateUserField = (fieldName, value) => {
  try {
    const userData = getUserData() || {};
    userData[fieldName] = value;
    return saveUserData(userData);
  } catch (error) {
    console.error(`خطأ في تحديث حقل ${fieldName}:`, error);
    return false;
  }
};

/**
 * حذف بيانات المستخدم عند تسجيل الخروج
 */
export const clearUserData = () => {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(BACKUP_STORAGE_KEY);
    localStorage.removeItem(LAST_SYNC_KEY);
    return true;
  } catch (error) {
    console.error('خطأ في حذف بيانات المستخدم:', error);
    return false;
  }
};

/**
 * التحقق من وجود جلسة مستخدم نشطة
 */
export const isUserLoggedIn = () => {
  try {
    const userData = getUserData();
    return !!userData && !!userData.token;
  } catch (error) {
    console.error('خطأ في التحقق من تسجيل دخول المستخدم:', error);
    return false;
  }
};

/**
 * الحصول على معرّف المستخدم
 */
export const getUserId = () => {
  try {
    const userData = getUserData();
    return userData?.id || null;
  } catch (error) {
    console.error('خطأ في استرجاع معرّف المستخدم:', error);
    return null;
  }
};

/**
 * الحصول على اسم المستخدم
 */
export const getUserName = () => {
  try {
    const userData = getUserData();
    return userData?.name || null;
  } catch {
    return null;
  }
};

/**
 * الحصول على رقم هاتف المستخدم
 */
export const getUserPhone = () => {
  try {
    const userData = getUserData();
    return userData?.phone || null;
  } catch {
    return null;
  }
};

/**
 * الحصول على رمز المصادقة للمستخدم
 */
export const getAuthToken = () => {
  try {
    const userData = getUserData();
    return userData?.token || null;
  } catch {
    return null;
  }
};

export default {
  saveUserData,
  getUserData,
  updateUserField,
  clearUserData,
  isUserLoggedIn,
  getUserId,
  getUserName,
  getUserPhone,
  getAuthToken
};
