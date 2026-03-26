import { useState } from 'react';
import { FaBookOpen, FaSignOutAlt, FaBars, FaBookMedical } from 'react-icons/fa';
import Link from 'next/link';

export default function Sidebar({ user, onLogout }: { user: { name: string, image?: string }, onLogout: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* زر فتح القائمة */}
      <button
        className="fixed top-4 right-4 z-50 bg-gradient-to-l from-sky-500 to-blue-700 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-300 focus:outline-none"
        onClick={() => setOpen(true)}
        aria-label="فتح القائمة الجانبية"
      >
        <FaBars size={28} />
      </button>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-80 max-w-full bg-gradient-to-br from-blue-50 via-sky-100 to-white shadow-2xl z-50 transform ${open ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-500`}
        style={{ borderTopLeftRadius: 32, borderBottomLeftRadius: 32 }}
      >
        <div className="flex flex-col h-full p-6">
          {/* التحكم في الدورات والمكتبات */}
          <div className="flex-1 flex flex-col items-center justify-center gap-8 mt-10">
            <Link href="/admin/courses" className="w-full">
              <button className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-gradient-to-l from-primary to-accent text-white font-bold shadow-lg hover:scale-105 transition-all text-xl mb-2">
                <FaBookOpen className="text-2xl" />
                الدورات
              </button>
            </Link>
            <Link href="/admin/libraries" className="w-full">
              <button className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-gradient-to-l from-green-400 to-green-700 text-white font-bold shadow-lg hover:scale-105 transition-all text-xl">
                <FaBookMedical className="text-2xl" />
                إضافة للمكتبات
              </button>
            </Link>
          </div>
          {/* Logout */}
          <button
            onClick={onLogout}
            className="mt-8 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-l from-sky-500 to-blue-700 text-white font-bold shadow-lg hover:scale-105 transition-all text-lg"
          >
            <FaSignOutAlt /> تسجيل الخروج
          </button>
        </div>
        {/* زر إغلاق */}
        <button
          className="absolute top-4 left-4 text-sky-700 bg-white/70 rounded-full p-2 shadow hover:bg-sky-100 transition-all"
          onClick={() => setOpen(false)}
          aria-label="إغلاق القائمة الجانبية"
        >
          ×
        </button>
      </aside>
    </>
  );
} 