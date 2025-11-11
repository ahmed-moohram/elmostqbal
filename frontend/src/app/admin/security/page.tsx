'use client';

import { useState, useEffect } from 'react';
import { 
  FaShieldAlt, FaLock, FaExclamationTriangle, FaCheckCircle, 
  FaTimesCircle, FaCog, FaHistory, FaUserShield, FaBan,
  FaKey, FaServer, FaDatabase, FaNetworkWired
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { apiLimiter, authLimiter, uploadLimiter } from '@/lib/security/rate-limiter';
import { memoryCache, persistentCache } from '@/lib/performance/database-cache';

interface SecurityLog {
  id: string;
  timestamp: Date;
  type: 'login_attempt' | 'rate_limit' | 'csrf_blocked' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent: string;
  details: string;
  blocked: boolean;
}

interface SecurityConfig {
  twoFactorAuth: boolean;
  rateLimiting: boolean;
  csrfProtection: boolean;
  passwordComplexity: 'low' | 'medium' | 'high';
  sessionTimeout: number;
  maxLoginAttempts: number;
  blockDuration: number;
  encryptionEnabled: boolean;
}

export default function SecuritySettingsPage() {
  const [config, setConfig] = useState<SecurityConfig>({
    twoFactorAuth: false,
    rateLimiting: true,
    csrfProtection: true,
    passwordComplexity: 'high',
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    blockDuration: 15,
    encryptionEnabled: true
  });

  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'settings' | 'logs' | 'blocked'>('settings');
  const [stats, setStats] = useState({
    totalAttempts: 0,
    blockedAttempts: 0,
    suspiciousActivities: 0,
    activeThreats: 0
  });

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    // Load security logs (mock data)
    const mockLogs: SecurityLog[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 3600000),
        type: 'login_attempt',
        severity: 'low',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        details: 'محاولة دخول ناجحة',
        blocked: false
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 7200000),
        type: 'rate_limit',
        severity: 'medium',
        ip: '10.0.0.50',
        userAgent: 'Chrome/120.0...',
        details: 'تجاوز حد الطلبات المسموح',
        blocked: true
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 10800000),
        type: 'suspicious_activity',
        severity: 'high',
        ip: '203.0.113.0',
        userAgent: 'Unknown',
        details: 'محاولة SQL Injection',
        blocked: true
      }
    ];
    setLogs(mockLogs);

    // Get rate limiter stats
    const apiStats = apiLimiter.getStats();
    const authStats = authLimiter.getStats();
    
    setStats({
      totalAttempts: mockLogs.length,
      blockedAttempts: mockLogs.filter(l => l.blocked).length,
      suspiciousActivities: mockLogs.filter(l => l.type === 'suspicious_activity').length,
      activeThreats: mockLogs.filter(l => l.severity === 'high' || l.severity === 'critical').length
    });

    // Load blocked IPs
    const blocked = mockLogs.filter(l => l.blocked).map(l => l.ip);
    setBlockedIPs(Array.from(new Set(blocked)));
  };

  const handleConfigChange = (key: keyof SecurityConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    toast.success(`تم تحديث ${key}`);
    
    // Save to persistent cache
    persistentCache.setex('security_config', { ...config, [key]: value }, 86400);
  };

  const handleUnblockIP = (ip: string) => {
    setBlockedIPs(prev => prev.filter(i => i !== ip));
    toast.success(`تم إلغاء حظر ${ip}`);
  };

  const clearCache = () => {
    memoryCache.clear();
    persistentCache.flushall();
    toast.success('تم مسح الذاكرة المؤقتة');
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `security-logs-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('تم تصدير السجلات');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaShieldAlt className="text-4xl" />
              <div>
                <h1 className="text-3xl font-bold">إعدادات الأمان</h1>
                <p className="text-red-100 mt-1">مراقبة وإدارة أمان المنصة</p>
              </div>
            </div>
            
            {/* Status Indicator */}
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${stats.activeThreats > 0 ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`} />
              <span className="font-medium">
                {stats.activeThreats > 0 ? `${stats.activeThreats} تهديدات نشطة` : 'النظام آمن'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 -mt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">محاولات الدخول</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalAttempts}</p>
              </div>
              <FaHistory className="text-3xl text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">محاولات محظورة</p>
                <p className="text-3xl font-bold text-red-600">{stats.blockedAttempts}</p>
              </div>
              <FaBan className="text-3xl text-red-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">نشاطات مشبوهة</p>
                <p className="text-3xl font-bold text-orange-600">{stats.suspiciousActivities}</p>
              </div>
              <FaExclamationTriangle className="text-3xl text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">تهديدات نشطة</p>
                <p className="text-3xl font-bold text-purple-600">{stats.activeThreats}</p>
              </div>
              <FaShieldAlt className="text-3xl text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 mt-8">
        <div className="bg-white rounded-xl shadow-lg">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-4 font-medium transition ${
                  activeTab === 'settings' 
                    ? 'bg-red-50 text-red-600 border-b-2 border-red-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FaCog className="inline mr-2" />
                الإعدادات
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-6 py-4 font-medium transition ${
                  activeTab === 'logs' 
                    ? 'bg-red-50 text-red-600 border-b-2 border-red-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FaHistory className="inline mr-2" />
                السجلات ({logs.length})
              </button>
              <button
                onClick={() => setActiveTab('blocked')}
                className={`px-6 py-4 font-medium transition ${
                  activeTab === 'blocked' 
                    ? 'bg-red-50 text-red-600 border-b-2 border-red-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FaBan className="inline mr-2" />
                المحظورين ({blockedIPs.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Authentication Settings */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FaUserShield className="text-red-600" />
                    إعدادات المصادقة
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="font-medium">التحقق بخطوتين (2FA)</label>
                      <button
                        onClick={() => handleConfigChange('twoFactorAuth', !config.twoFactorAuth)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          config.twoFactorAuth 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {config.twoFactorAuth ? 'مفعّل' : 'معطّل'}
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="font-medium">تعقيد كلمة المرور</label>
                      <select
                        value={config.passwordComplexity}
                        onChange={(e) => handleConfigChange('passwordComplexity', e.target.value)}
                        className="px-4 py-2 border rounded-lg"
                      >
                        <option value="low">منخفض</option>
                        <option value="medium">متوسط</option>
                        <option value="high">عالي</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="font-medium">مدة الجلسة (دقيقة)</label>
                      <input
                        type="number"
                        value={config.sessionTimeout}
                        onChange={(e) => handleConfigChange('sessionTimeout', parseInt(e.target.value))}
                        className="px-4 py-2 border rounded-lg w-24"
                      />
                    </div>
                  </div>
                </div>

                {/* Security Features */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FaLock className="text-red-600" />
                    ميزات الأمان
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium">تحديد معدل الطلبات</label>
                        <p className="text-sm text-gray-500">حماية من هجمات DDoS</p>
                      </div>
                      <button
                        onClick={() => handleConfigChange('rateLimiting', !config.rateLimiting)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          config.rateLimiting 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {config.rateLimiting ? 'مفعّل' : 'معطّل'}
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium">حماية CSRF</label>
                        <p className="text-sm text-gray-500">منع هجمات Cross-Site Request Forgery</p>
                      </div>
                      <button
                        onClick={() => handleConfigChange('csrfProtection', !config.csrfProtection)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          config.csrfProtection 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {config.csrfProtection ? 'مفعّل' : 'معطّل'}
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium">التشفير</label>
                        <p className="text-sm text-gray-500">تشفير البيانات الحساسة</p>
                      </div>
                      <button
                        onClick={() => handleConfigChange('encryptionEnabled', !config.encryptionEnabled)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          config.encryptionEnabled 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {config.encryptionEnabled ? 'مفعّل' : 'معطّل'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* System Actions */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FaServer className="text-red-600" />
                    إجراءات النظام
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={clearCache}
                      className="px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition"
                    >
                      <FaDatabase className="inline mr-2" />
                      مسح الذاكرة المؤقتة
                    </button>
                    
                    <button
                      onClick={exportLogs}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                    >
                      <FaHistory className="inline mr-2" />
                      تصدير السجلات
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">سجل الأحداث الأمنية</h3>
                  <button
                    onClick={exportLogs}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                  >
                    تصدير
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الوقت</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">النوع</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الخطورة</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">IP</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">التفاصيل</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {logs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            {log.timestamp.toLocaleString('ar-EG')}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm">
                              {log.type === 'login_attempt' && 'محاولة دخول'}
                              {log.type === 'rate_limit' && 'تجاوز الحد'}
                              {log.type === 'csrf_blocked' && 'CSRF محظور'}
                              {log.type === 'suspicious_activity' && 'نشاط مشبوه'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              log.severity === 'low' ? 'bg-green-100 text-green-700' :
                              log.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              log.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {log.severity === 'low' && 'منخفض'}
                              {log.severity === 'medium' && 'متوسط'}
                              {log.severity === 'high' && 'عالي'}
                              {log.severity === 'critical' && 'حرج'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono">
                            {log.ip}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {log.details}
                          </td>
                          <td className="px-4 py-3">
                            {log.blocked ? (
                              <FaTimesCircle className="text-red-500" />
                            ) : (
                              <FaCheckCircle className="text-green-500" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Blocked IPs Tab */}
            {activeTab === 'blocked' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">عناوين IP المحظورة</h3>
                
                {blockedIPs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">لا توجد عناوين محظورة</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {blockedIPs.map(ip => (
                      <div key={ip} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-4">
                        <div>
                          <p className="font-mono font-medium">{ip}</p>
                          <p className="text-sm text-gray-500">محظور بسبب نشاط مشبوه</p>
                        </div>
                        <button
                          onClick={() => handleUnblockIP(ip)}
                          className="px-4 py-2 bg-white hover:bg-gray-50 border rounded-lg text-sm font-medium transition"
                        >
                          إلغاء الحظر
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
