"use client";

import { useEffect } from "react";
import { toast } from "react-hot-toast";

// حارس عام لاكتشاف فتح أدوات المطوّر (الكونسول) في أي صفحة
export default function DevtoolsGuard() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;

    let handled = false;

    const checkDevtools = () => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      const threshold = 160; // فرق كافٍ لاعتبار أن أدوات المطوّر مفتوحة

      const isOpen = widthDiff > threshold || heightDiff > threshold;

      if (isOpen && !handled) {
        handled = true;
        try {
          toast.error(
            "يمنع فتح أداة المطوّر (الكونسول) أثناء استخدام المنصة. سيتم إعادة تحميل الصفحة."
          );
        } catch (e) {
          console.warn("Devtools warning toast failed:", e);
        }

        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    };

    const intervalId = window.setInterval(checkDevtools, 1500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
}
