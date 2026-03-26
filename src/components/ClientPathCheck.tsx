"use client";

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface ClientPathCheckProps {
  children: ReactNode;
}

// هذا المكون يتحقق من مسار الصفحة الحالية ويمنع عرض المحتوى في مسارات معينة
export default function ClientPathCheck({ children }: ClientPathCheckProps) {
  const pathname = usePathname();

  // لا تعرض المحتوى في صفحة الإدارة
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  // عرض المحتوى في باقي الصفحات
  return <>{children}</>;
}
