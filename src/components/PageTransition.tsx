'use client';

import { usePathname } from 'next/navigation';

/**
 * مكون انتقال فوري بدون تأخير
 * تم إزالة جميع التأثيرات لجعل التنقل أسرع
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  // تم تعطيل جميع تأثيرات الانتقال للحصول على أسرع أداء
  return <>{children}</>;
}
