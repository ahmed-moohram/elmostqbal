"use client";

import { useState, useEffect } from 'react';
import { FaDesktop, FaMobileAlt, FaTabletAlt, FaBan, FaCheck, FaEye, FaSearch, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import AdminLayout from '@/components/AdminLayout';

interface Device {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  deviceId: string;
  deviceInfo: {
    name: string;
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
    ipAddress: string;
  };
  isBlocked: boolean;
  blockedReason?: string;
  lastActive: string;
  loginCount: number;
  registeredAt: string;
}

export default function DevicesManagement() {
  return (
    <AdminLayout>
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-3">هذه الصفحة غير متاحة حالياً</h1>
          <p className="text-gray-600 dark:text-gray-300">
            سيتم تفعيل إدارة الأجهزة المسجلة بعد الانتهاء من نظام الحماية وربط الأجهزة.
          </p>
        </div>
      </div>
    </AdminLayout>
  );

  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked'>('all');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    filterDevicesList();
  }, [devices, searchTerm, filterStatus]);

  const fetchDevices = async () => {
    try {
      // محاكاة البيانات
      const mockData: Device[] = [
        {
          _id: '1',
          studentId: {
            _id: 's1',
            name: 'أحمد محمد علي',
            email: 'ahmed@example.com',
            phone: '01012345678'
          },
          deviceId: 'device_123abc',
          deviceInfo: {
            name: 'Ahmed\'s Laptop',
            type: 'desktop',
            os: 'Windows 11',
            browser: 'Chrome 120',
            ipAddress: '192.168.1.100'
          },
          isBlocked: false,
          lastActive: new Date().toISOString(),
          loginCount: 45,
          registeredAt: new Date(Date.now() - 2592000000).toISOString()
        },
        {
          _id: '2',
          studentId: {
            _id: 's1',
            name: 'أحمد محمد علي',
            email: 'ahmed@example.com',
            phone: '01012345678'
          },
          deviceId: 'device_456def',
          deviceInfo: {
            name: 'Ahmed\'s Phone',
            type: 'mobile',
            os: 'Android 13',
            browser: 'Chrome Mobile',
            ipAddress: '192.168.1.101'
          },
          isBlocked: false,
          lastActive: new Date(Date.now() - 3600000).toISOString(),
          loginCount: 120,
          registeredAt: new Date(Date.now() - 5184000000).toISOString()
        },
        {
          _id: '3',
          studentId: {
            _id: 's2',
            name: 'فاطمة حسن',
            email: 'fatma@example.com',
            phone: '01123456789'
          },
          deviceId: 'device_789ghi',
          deviceInfo: {
            name: 'Fatma\'s iPad',
            type: 'tablet',
            os: 'iOS 17',
            browser: 'Safari',
            ipAddress: '192.168.1.102'
          },
          isBlocked: true,
          blockedReason: 'مشاركة الحساب مع أشخاص آخرين',
          lastActive: new Date(Date.now() - 86400000).toISOString(),
          loginCount: 15,
          registeredAt: new Date(Date.now() - 1296000000).toISOString()
        }
      ];

      setDevices(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching devices:', error);
      setLoading(false);
    }
  };

  const filterDevicesList = () => {
    let filtered = devices;

    // Filter by status
    if (filterStatus === 'active') {
      filtered = filtered.filter(d => !d.isBlocked);
    } else if (filterStatus === 'blocked') {
      filtered = filtered.filter(d => d.isBlocked);
    }

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.studentId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.studentId.phone.includes(searchTerm) ||
        d.deviceInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.deviceInfo.ipAddress.includes(searchTerm)
      );
    }

    setFilteredDevices(filtered);
  };

  const handleBlockDevice = async (deviceId: string) => {
    const reason = prompt('يرجى إدخال سبب الحظر:');
    if (!reason) return;

    try {
      // API call
      setDevices(prev =>
        prev.map(d =>
          d._id === deviceId ? { ...d, isBlocked: true, blockedReason: reason } : d
        )
      );
      alert('تم حظر الجهاز بنجاح');
    } catch (error) {
      console.error('Error blocking device:', error);
      alert('حدث خطأ أثناء حظر الجهاز');
    }
  };

  const handleUnblockDevice = async (deviceId: string) => {
    if (!confirm('هل أنت متأكد من إلغاء حظر هذا الجهاز؟')) return;

    try {
      // API call
      setDevices(prev =>
        prev.map(d =>
          d._id === deviceId ? { ...d, isBlocked: false, blockedReason: undefined } : d
        )
      );
      alert('تم إلغاء حظر الجهاز بنجاح');
    } catch (error) {
      console.error('Error unblocking device:', error);
      alert('حدث خطأ أثناء إلغاء الحظر');
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'desktop':
        return <FaDesktop className="text-2xl text-blue-500" />;
      case 'mobile':
        return <FaMobileAlt className="text-2xl text-green-500" />;
      case 'tablet':
        return <FaTabletAlt className="text-2xl text-purple-500" />;
      default:
        return <FaDesktop className="text-2xl text-gray-500" />;
    }
  };

  const getDeviceTypeLabel = (type: string) => {
    const labels = {
      desktop: 'كمبيوتر',
      mobile: 'هاتف',
      tablet: 'تابلت'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return 'الآن';
    if (seconds < 3600) return `منذ ${Math.floor(seconds / 60)} دقيقة`;
    if (seconds < 86400) return `منذ ${Math.floor(seconds / 3600)} ساعة`;
    if (seconds < 604800) return `منذ ${Math.floor(seconds / 86400)} يوم`;
    return new Date(date).toLocaleDateString('ar-EG');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            إدارة الأجهزة المسجلة
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            تتبع وإدارة الأجهزة المستخدمة من قبل الطلاب
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute right-3 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث بالاسم، الهاتف، اسم الجهاز أو IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
            >
              <option value="all">جميع الأجهزة</option>
              <option value="active">الأجهزة النشطة</option>
              <option value="blocked">الأجهزة المحظورة</option>
            </select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {devices.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الأجهزة</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {devices.filter(d => !d.isBlocked).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">أجهزة نشطة</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {devices.filter(d => d.isBlocked).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">أجهزة محظورة</p>
            </div>
          </div>
        </div>

        {/* Devices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevices.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
              لا توجد أجهزة
            </div>
          ) : (
            filteredDevices.map((device) => (
              <div
                key={device._id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 transition-all hover:shadow-lg ${
                  device.isBlocked
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-transparent hover:border-primary'
                }`}
              >
                {/* Device Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(device.deviceInfo.type)}
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {device.deviceInfo.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {getDeviceTypeLabel(device.deviceInfo.type)}
                      </p>
                    </div>
                  </div>
                  {device.isBlocked && (
                    <span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 px-2 py-1 rounded-full text-xs font-medium">
                      محظور
                    </span>
                  )}
                </div>

                {/* Student Info */}
                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {device.studentId.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {device.studentId.phone}
                  </p>
                </div>

                {/* Device Info */}
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">النظام:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {device.deviceInfo.os}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">المتصفح:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {device.deviceInfo.browser}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <FaMapMarkerAlt className="text-xs" /> IP:
                    </span>
                    <span className="text-gray-900 dark:text-white font-mono text-xs">
                      {device.deviceInfo.ipAddress}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">عدد الدخول:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {device.loginCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <FaClock className="text-xs" /> آخر نشاط:
                    </span>
                    <span className="text-gray-900 dark:text-white text-xs">
                      {getTimeAgo(device.lastActive)}
                    </span>
                  </div>
                </div>

                {/* Blocked Reason */}
                {device.isBlocked && device.blockedReason && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-xs font-semibold text-red-800 dark:text-red-300 mb-1">
                      سبب الحظر:
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-400">
                      {device.blockedReason}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {device.isBlocked ? (
                    <button
                      onClick={() => handleUnblockDevice(device._id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <FaCheck /> إلغاء الحظر
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBlockDevice(device._id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <FaBan /> حظر الجهاز
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedDevice(device)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <FaEye />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Device Details Modal */}
      {selectedDevice && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedDevice(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                تفاصيل الجهاز
              </h2>
              <button
                onClick={() => setSelectedDevice(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">اسم الجهاز</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedDevice.deviceInfo.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">النوع</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getDeviceTypeLabel(selectedDevice.deviceInfo.type)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">نظام التشغيل</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedDevice.deviceInfo.os}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">المتصفح</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedDevice.deviceInfo.browser}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">عنوان IP</p>
                  <p className="font-medium text-gray-900 dark:text-white font-mono">
                    {selectedDevice.deviceInfo.ipAddress}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">معرف الجهاز</p>
                  <p className="font-medium text-gray-900 dark:text-white font-mono text-sm">
                    {selectedDevice.deviceId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">عدد مرات الدخول</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedDevice.loginCount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">تاريخ التسجيل</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(selectedDevice.registeredAt).toLocaleDateString('ar-EG')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
