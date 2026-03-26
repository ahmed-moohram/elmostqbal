/**
 * Hook لاستبدال localStorage بقاعدة بيانات Supabase
 * يحفظ جميع البيانات في قاعدة البيانات بدلاً من المتصفح
 */

import { useState, useEffect, useCallback } from 'react';
import supabase from '@/lib/supabase-client';

export const useSupabaseCache = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      setLoading(false);
    };
    getUser();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  /**
   * حفظ البيانات في قاعدة البيانات
   * @param key المفتاح
   * @param value القيمة (أي نوع بيانات)
   * @param ttl مدة الصلاحية بالثواني (اختياري)
   */
  const setItem = useCallback(async (key: string, value: any, ttl?: number) => {
    try {
      // إذا لم يكن هناك مستخدم، احفظ في localStorage كـ fallback
      if (!userId) {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      }

      const expires_at = ttl ? new Date(Date.now() + ttl * 1000).toISOString() : null;

      const { error } = await supabase
        .from('user_cache')
        .upsert({
          user_id: userId,
          key,
          value,
          expires_at
        }, {
          onConflict: 'user_id,key'
        });

      if (error) {
        console.error('Error saving to cache:', error);
        // Fallback to localStorage
        localStorage.setItem(key, JSON.stringify(value));
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in setItem:', error);
      // Fallback to localStorage
      localStorage.setItem(key, JSON.stringify(value));
      return false;
    }
  }, [userId]);

  /**
   * جلب البيانات من قاعدة البيانات
   * @param key المفتاح
   * @returns القيمة المحفوظة أو null
   */
  const getItem = useCallback(async (key: string) => {
    try {
      // إذا لم يكن هناك مستخدم، اجلب من localStorage
      if (!userId) {
        const localData = localStorage.getItem(key);
        return localData ? JSON.parse(localData) : null;
      }

      const { data, error } = await supabase
        .from('user_cache')
        .select('value, expires_at')
        .eq('user_id', userId)
        .eq('key', key)
        .single();

      if (error || !data) {
        // Try localStorage as fallback
        const localData = localStorage.getItem(key);
        return localData ? JSON.parse(localData) : null;
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        await removeItem(key);
        return null;
      }

      return data.value;
    } catch (error) {
      console.error('Error in getItem:', error);
      // Fallback to localStorage
      const localData = localStorage.getItem(key);
      return localData ? JSON.parse(localData) : null;
    }
  }, [userId]);

  /**
   * حذف البيانات من قاعدة البيانات
   * @param key المفتاح
   */
  const removeItem = useCallback(async (key: string) => {
    try {
      // Remove from localStorage anyway
      localStorage.removeItem(key);

      if (!userId) return true;

      const { error } = await supabase
        .from('user_cache')
        .delete()
        .eq('user_id', userId)
        .eq('key', key);

      if (error) {
        console.error('Error removing from cache:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in removeItem:', error);
      return false;
    }
  }, [userId]);

  /**
   * مسح جميع البيانات للمستخدم
   */
  const clear = useCallback(async () => {
    try {
      // Clear localStorage
      localStorage.clear();

      if (!userId) return true;

      const { error } = await supabase
        .from('user_cache')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing cache:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in clear:', error);
      return false;
    }
  }, [userId]);

  /**
   * جلب جميع المفاتيح للمستخدم
   */
  const getAllKeys = useCallback(async () => {
    try {
      if (!userId) {
        // Return localStorage keys
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) keys.push(key);
        }
        return keys;
      }

      const { data, error } = await supabase
        .from('user_cache')
        .select('key')
        .eq('user_id', userId);

      if (error) {
        console.error('Error getting keys:', error);
        return [];
      }

      return data?.map(item => item.key) || [];
    } catch (error) {
      console.error('Error in getAllKeys:', error);
      return [];
    }
  }, [userId]);

  /**
   * دالة لترحيل البيانات من localStorage إلى قاعدة البيانات
   */
  const migrateFromLocalStorage = useCallback(async () => {
    if (!userId) return false;

    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }

      for (const key of keys) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const parsed = JSON.parse(value);
            await setItem(key, parsed);
          } catch {
            // If not JSON, save as string
            await setItem(key, value);
          }
        }
      }

      // Clear localStorage after migration
      localStorage.clear();
      console.log('✅ تم ترحيل البيانات من localStorage إلى قاعدة البيانات');
      return true;
    } catch (error) {
      console.error('Error migrating data:', error);
      return false;
    }
  }, [userId, setItem]);

  // Batch operations
  const setMultiple = useCallback(async (items: { key: string; value: any; ttl?: number }[]) => {
    const promises = items.map(item => setItem(item.key, item.value, item.ttl));
    const results = await Promise.all(promises);
    return results.every(r => r);
  }, [setItem]);

  const getMultiple = useCallback(async (keys: string[]) => {
    const promises = keys.map(key => getItem(key));
    const values = await Promise.all(promises);
    
    const result: { [key: string]: any } = {};
    keys.forEach((key, index) => {
      result[key] = values[index];
    });
    
    return result;
  }, [getItem]);

  return {
    // Core functions
    setItem,
    getItem,
    removeItem,
    clear,
    getAllKeys,
    
    // Batch operations
    setMultiple,
    getMultiple,
    
    // Migration
    migrateFromLocalStorage,
    
    // State
    loading,
    userId,
    
    // Aliases for localStorage compatibility
    setLocalItem: setItem,
    getLocalItem: getItem,
    removeLocalItem: removeItem,
    clearLocal: clear
  };
};

// دوال مساعدة للتوافق مع الكود القديم
export const supabaseCache = {
  setItem: async (key: string, value: any, ttl?: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      localStorage.setItem(key, JSON.stringify(value));
      return;
    }

    await supabase
      .from('user_cache')
      .upsert({
        user_id: user.id,
        key,
        value,
        expires_at: ttl ? new Date(Date.now() + ttl * 1000).toISOString() : null
      }, {
        onConflict: 'user_id,key'
      });
  },

  getItem: async (key: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const localData = localStorage.getItem(key);
      return localData ? JSON.parse(localData) : null;
    }

    const { data } = await supabase
      .from('user_cache')
      .select('value, expires_at')
      .eq('user_id', user.id)
      .eq('key', key)
      .single();

    if (!data) {
      const localData = localStorage.getItem(key);
      return localData ? JSON.parse(localData) : null;
    }

    // Check expiry
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      await supabase
        .from('user_cache')
        .delete()
        .eq('user_id', user.id)
        .eq('key', key);
      return null;
    }

    return data.value;
  },

  removeItem: async (key: string) => {
    localStorage.removeItem(key);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('user_cache')
      .delete()
      .eq('user_id', user.id)
      .eq('key', key);
  },

  clear: async () => {
    localStorage.clear();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('user_cache')
      .delete()
      .eq('user_id', user.id);
  }
};

export default useSupabaseCache;
