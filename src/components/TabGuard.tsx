"use client";

import { useEffect } from "react";

// يمنع استخدام زر الـ Tab في كل صفحات الموقع
export default function TabGuard() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // إذا كان المفتاح المضغوط هو Tab نمنع السلوك الافتراضي
      if (e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // نستخدم capture=true حتى نلتقط الحدث قبل بقية المستمعين
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  return null;
}
