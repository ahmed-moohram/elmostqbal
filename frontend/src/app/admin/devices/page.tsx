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
}
 
