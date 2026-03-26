'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaUserCircle, FaBook, FaGraduationCap, FaChevronDown, FaSignOutAlt, FaSignInAlt, FaUserPlus, FaHome, FaCog, FaUser } from 'react-icons/fa';
import { HiOutlineMenuAlt3 } from 'react-icons/hi';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // إغلاق القائمة المنسدلة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (userMenuOpen && !target.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
      if (mobileMenuOpen && !target.closest('.mobile-menu-container')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen, mobileMenuOpen]);

  const navLinks = [
    { href: '/', label: 'الرئيسية', icon: <FaHome /> },
    { href: '/courses', label: 'الدورات', icon: <FaGraduationCap /> },
    { href: '/library', label: 'المكتبة', icon: <FaBook /> },
    { href: '/about', label: 'من نحن' }
  ];

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    router.replace('/');
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white dark:bg-gray-900 shadow-md' : 'bg-white dark:bg-gray-900'
    } border-b border-gray-200 dark:border-gray-800`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              <Image 
                src="/logo.png" 
                alt="شعار المنصة"
                fill
                sizes="48px"
                className="object-contain"
                priority
              />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              المستقبل
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  pathname === link.href
                    ? 'text-primary dark:text-primary-light font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light'
                }`}
              >
                {link.icon && <span className="text-lg">{link.icon}</span>}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <HiOutlineMenuAlt3 className="text-2xl" />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notification Bell */}
            {isAuthenticated && <NotificationBell />}

            {/* User Menu */}
            <div className="relative user-menu-container">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {user?.image ? (
                      <div className="relative w-8 h-8 rounded-full overflow-hidden">
                        <Image
                          src={user.image}
                          alt={user.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <FaUserCircle className="text-2xl" />
                    )}
                    <span className="hidden md:block">{user?.name}</span>
                    <FaChevronDown className="text-sm" />
                  </button>

                  {/* User Dropdown */}
                  {userMenuOpen && (
                    <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          {user?.image ? (
                            <div className="relative w-10 h-10 rounded-full overflow-hidden">
                              <Image
                                src={user.image}
                                alt={user.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <FaUserCircle className="text-3xl text-gray-400" />
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || user?.phone}</p>
                          </div>
                        </div>
                      </div>
                      <Link
                        href={user?.role === 'student' ? '/student/dashboard' : user?.role === 'admin' ? '/admin' : '/teachers/dashboard'}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <FaUserCircle />
                        لوحة التحكم
                      </Link>
                      <Link
                        href={user?.role === 'student' ? '/student/profile' : user?.role === 'admin' ? '/admin/profile' : '/teachers/profile'}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <FaUser />
                        الملف الشخصي
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <FaCog />
                        الإعدادات
                      </Link>
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-red-600"
                      >
                        <FaSignOutAlt />
                        تسجيل الخروج
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <FaSignInAlt />
                    <span className="hidden md:block">دخول</span>
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
                  >
                    <FaUserPlus />
                    <span className="hidden md:block">تسجيل</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4 mobile-menu-container">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    pathname === link.href
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.icon && <span>{link.icon}</span>}
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
