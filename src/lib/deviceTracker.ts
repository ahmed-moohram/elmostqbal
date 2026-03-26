/**
 * نظام تتبع الأجهزة
 * يسجل معلومات الجهاز ويتحقق من حظره
 */

export interface DeviceInfo {
  deviceId: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  ipAddress: string;
}

/**
 * الحصول على معرف فريد للجهاز
 */
export async function getDeviceFingerprint(): Promise<string> {
  // استخدام fingerprint بسيط (يمكن استبداله بـ FingerprintJS)
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
  }
  
  const canvasData = canvas.toDataURL();
  
  const fingerprint = `${navigator.userAgent}_${navigator.language}_${screen.width}x${screen.height}_${canvasData.substring(0, 50)}`;
  
  // Hash بسيط
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * الحصول على نوع الجهاز
 */
export function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  const ua = navigator.userAgent;
  
  if (/tablet|ipad/i.test(ua)) {
    return 'tablet';
  }
  
  if (/mobile|android|iphone/i.test(ua)) {
    return 'mobile';
  }
  
  return 'desktop';
}

/**
 * الحصول على نظام التشغيل
 */
export function getOS(): string {
  const ua = navigator.userAgent;
  
  if (ua.indexOf('Win') > -1) return 'Windows';
  if (ua.indexOf('Mac') > -1) return 'MacOS';
  if (ua.indexOf('Linux') > -1) return 'Linux';
  if (ua.indexOf('Android') > -1) return 'Android';
  if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1) return 'iOS';
  
  return 'Unknown';
}

/**
 * الحصول على المتصفح
 */
export function getBrowser(): string {
  const ua = navigator.userAgent;
  
  if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) return 'Chrome';
  if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) return 'Safari';
  if (ua.indexOf('Firefox') > -1) return 'Firefox';
  if (ua.indexOf('Edg') > -1) return 'Edge';
  if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
  
  return 'Unknown';
}

/**
 * الحصول على IP (يتطلب API خارجي)
 */
export async function getIPAddress(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error fetching IP:', error);
    return 'unknown';
  }
}

/**
 * جمع معلومات الجهاز الكاملة
 */
export async function collectDeviceInfo(): Promise<DeviceInfo> {
  const deviceId = await getDeviceFingerprint();
  const ipAddress = await getIPAddress();
  
  return {
    deviceId,
    name: `${getOS()} ${getDeviceType()}`,
    type: getDeviceType(),
    os: getOS(),
    browser: getBrowser(),
    ipAddress
  };
}

/**
 * تسجيل الجهاز في قاعدة البيانات
 */
export async function registerDevice(userId: string): Promise<any> {
  try {
    const deviceInfo = await collectDeviceInfo();
    
    const response = await fetch('/api/devices/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentId: userId,
        ...deviceInfo
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to register device');
    }
    
    const data = await response.json();
    
    // حفظ deviceId في localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('deviceId', deviceInfo.deviceId);
    }
    
    return data;
  } catch (error) {
    console.error('Error registering device:', error);
    throw error;
  }
}

/**
 * التحقق من حظر الجهاز
 */
export async function checkDeviceStatus(): Promise<{ isBlocked: boolean; reason?: string }> {
  try {
    const deviceId = localStorage.getItem('deviceId');
    
    if (!deviceId) {
      return { isBlocked: false };
    }
    
    const response = await fetch(`/api/devices/check/${deviceId}`);
    
    if (!response.ok) {
      throw new Error('Failed to check device status');
    }
    
    const data = await response.json();
    
    return {
      isBlocked: data.isBlocked || false,
      reason: data.blockedReason
    };
  } catch (error) {
    console.error('Error checking device status:', error);
    return { isBlocked: false };
  }
}

/**
 * تحديث آخر نشاط للجهاز
 */
export async function updateDeviceActivity(): Promise<void> {
  try {
    const deviceId = localStorage.getItem('deviceId');
    
    if (!deviceId) return;
    
    await fetch('/api/devices/activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deviceId })
    });
  } catch (error) {
    console.error('Error updating device activity:', error);
  }
}
