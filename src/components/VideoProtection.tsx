'use client';

import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function VideoProtection() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    // 1. منع أدوات المطور بطرق متعددة
    const devtools = { open: false, orientation: undefined };
    
    const threshold = 160;
    const emitEvent = (state: boolean) => {
      if (state) {
        console.clear();
        document.body.innerHTML = `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-size: 24px;
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 20px;
          ">
            <div>
              <h1 style="font-size: 72px; margin-bottom: 20px;">🔒</h1>
              <h2>تم اكتشاف محاولة غير مصرح بها</h2>
              <p>لقد تم تسجيل IP الخاص بك وسيتم اتخاذ الإجراءات اللازمة</p>
              <p style="margin-top: 20px; opacity: 0.8;">يرجى إغلاق أدوات المطور وإعادة تحميل الصفحة</p>
            </div>
          </div>
        `;
      }
    };

    setInterval(() => {
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        if (!devtools.open) {
          emitEvent(true);
          devtools.open = true;
        }
      } else {
        if (devtools.open) {
          emitEvent(false);
          devtools.open = false;
        }
      }
    }, 500);

    // 2. تعطيل console
    const noop = () => {};
    const methods = [
      'assert', 'clear', 'count', 'debug', 'dir', 'dirxml',
      'error', 'exception', 'group', 'groupCollapsed', 'groupEnd',
      'info', 'log', 'markTimeline', 'profile', 'profileEnd',
      'table', 'time', 'timeEnd', 'timeline', 'timelineEnd',
      'timeStamp', 'trace', 'warn'
    ];
    
    methods.forEach(method => {
      (window.console as any)[method] = noop;
    });

    // 3. منع الطباعة
    const handlePrint = (e: Event) => {
      e.preventDefault();
      toast.error('🚫 الطباعة محظورة لحماية المحتوى');
      return false;
    };

    // 4. منع النسخ واللصق
    const handleCopy = (e: ClipboardEvent) => {
      e.clipboardData?.setData('text/plain', 'المحتوى محمي - لا يمكن نسخه');
      e.preventDefault();
      toast.error('🚫 النسخ محظور');
      return false;
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.error('🚫 القص محظور');
      return false;
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.error('🚫 اللصق محظور');
      return false;
    };

    // 5. منع السحب والإفلات
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // 6. مراقبة تسجيل الشاشة (تحذير فقط)
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
      navigator.mediaDevices.getDisplayMedia = async function(...args) {
        toast.error('⚠️ تحذير: تسجيل الشاشة قد يؤدي لحظر حسابك');
        
        // إرسال تنبيه للخادم (يمكن تفعيله لاحقاً)
        // fetch('/api/report-screen-recording', { 
        //   method: 'POST',
        //   body: JSON.stringify({ userId, timestamp: new Date() })
        // });
        
        return originalGetDisplayMedia.apply(this, args);
      };
    }

    // 7. تحذير عند محاولة مغادرة الصفحة أثناء تشغيل الفيديو
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const message = 'هل أنت متأكد من مغادرة الصفحة؟ سيتم فقد التقدم الحالي';
      e.returnValue = message;
      return message;
    };

    // إضافة جميع المستمعين
    window.addEventListener('beforeprint', handlePrint);
    window.addEventListener('afterprint', handlePrint);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('dragstart', handleDragStart);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 8. تعطيل أزرار الماوس الإضافية
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1 || e.button === 2) { // Middle or right click
        e.preventDefault();
        return false;
      }
    };
    
    document.addEventListener('mousedown', handleMouseDown);

    // 9. CSS لمنع التحديد والنسخ
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-touch-callout: none !important;
        -webkit-user-select: none !important;
        -khtml-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      
      video, iframe {
        pointer-events: auto !important;
      }
      
      /* منع تسليط الضوء على النص */
      ::selection {
        background: transparent !important;
      }
      
      ::-moz-selection {
        background: transparent !important;
      }
      
      /* إخفاء المؤشر عند الخمول */
      body {
        cursor: default !important;
      }
      
      /* تعطيل الطباعة */
      @media print {
        body * {
          display: none !important;
        }
        body:after {
          content: "الطباعة محظورة - المحتوى محمي بحقوق الطبع والنشر";
          display: block !important;
          text-align: center !important;
          font-size: 30px !important;
          color: red !important;
          margin-top: 50% !important;
        }
      }
    `;
    document.head.appendChild(style);

    // تنظيف عند إلغاء التحميل
    return () => {
      window.removeEventListener('beforeprint', handlePrint);
      window.removeEventListener('afterprint', handlePrint);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('mousedown', handleMouseDown);
      style.remove();
    };
  }, []);

  return null;
}
