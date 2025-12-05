"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaPause, FaExpand, FaCompress, FaVolumeUp, FaVolumeMute, FaCog, FaRedo, FaInfoCircle, FaExclamationTriangle, FaExchangeAlt } from 'react-icons/fa';
import { progressService } from '../services/api';
import { toast } from 'react-hot-toast';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string;
  title?: string;
  poster?: string;
  className?: string;
  onProgress?: (progress: number, currentTime: number, duration: number) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  savedTime?: number;
  courseId?: string;
  lessonId?: string;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
}

const VideoPlayer = ({ 
  src, 
  title, 
  poster, 
  className, 
  onProgress,
  onComplete,
  onError,
  savedTime = 0,
  courseId, 
  lessonId,
  autoPlay = false,
  loop = false,
  controls = true
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);
  const watermarkPosition = useRef({ x: 50, y: 50, direction: { x: 1, y: 1 } });
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const seekbarTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedProgressRef = useRef<number>(0);
  const lastUpdateTimeRef = useRef<number>(0);
  const lastErrorNotificationRef = useRef<number>(0);
  const playbackTimeRef = useRef<number>(0);
  const studySessionStartedRef = useRef<Date | null>(null);
  const router = useRouter();
  
  // حالة المستخدم
  const [userPhone, setUserPhone] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  
  // حالة مشغل الفيديو
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [bufferingState, setBufferingState] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionNotified, setCompletionNotified] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  
  // حالة شريط التقدم
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(0);
  const [previewTime, setPreviewTime] = useState(0);
  
  // اكتشاف نوع الجهاز لتحسين التوافق
  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      return /android|webos|iphone|ipad|ipod|blackberry|IEMobile|Opera Mini/i.test(userAgent);
    };
    setIsMobileDevice(checkIfMobile());
  }, []);

  // استيراد بيانات المستخدم عند تحميل المكون
  useEffect(() => {
    const loadUserData = () => {
      try {
        const userJson = localStorage.getItem('user');
        if (!userJson) {
          if (courseId && lessonId) {
            router.push(`/login?redirect=/courses/${courseId}/lessons/${lessonId}`);
          }
          return;
        }
        
        const userData = JSON.parse(userJson);
        setUserPhone(userData.phone || 'لا يوجد رقم');
        setUserName(userData.name || 'مستخدم');
        setCompletionNotified(false); // إعادة تعيين حالة الإشعار
      } catch (error) {
        console.error('خطأ في استرداد بيانات المستخدم:', error);
        // لا نقوم بإعادة التوجيه هنا في حالة الخطأ، فقط نسجل الخطأ
      }
    };
    
    loadUserData();
  }, [router, courseId, lessonId]);

  // تحميل الفيديو ودعم HLS للأجهزة المتنوعة
  useEffect(() => {
    if (!videoRef.current || !src) return;
    
    // تنظيف الإعداد السابق
    const cleanup = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
    
    cleanup();
    setIsLoading(true);
    
    const loadVideo = async () => {
      try {
        // تحقق مما إذا كان الفيديو هو HLS
        const isHLS = src.includes('.m3u8');
        
        // استخدام HLS.js للمتصفحات التي لا تدعم HLS بشكل أصلي
        if (isHLS && Hls && typeof Hls.isSupported === 'function' && Hls.isSupported()) {
          const hls = new Hls({
            maxBufferLength: 30, // تقليل حجم التخزين المؤقت لتوفير الذاكرة
            maxMaxBufferLength: 60,
            enableWorker: true, // تحسين الأداء باستخدام Web Workers
          });
          
          hlsRef.current = hls;
          hls.loadSource(src);
          hls.attachMedia(videoRef.current);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            if (savedTime > 0) {
              videoRef.current!.currentTime = savedTime;
            }
            if (autoPlay) {
              videoRef.current!.play().catch(error => {
                console.error('خطأ عند التشغيل التلقائي:', error);
              });
            }
          });
          
          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              console.error('خطأ في تشغيل الفيديو:', data);
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                // محاولة إعادة الاتصال عند وجود مشاكل في الشبكة
                hls.startLoad();
              } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                // محاولة استرداد من أخطاء الوسائط
                hls.recoverMediaError();
              } else {
                // الاستسلام للأخطاء الأخرى
                cleanup();
                setError(new Error('حدث خطأ أثناء تشغيل الفيديو'));
                setIsLoading(false);
              }
            }
          });
        } else {
          // استخدام التشغيل الأصلي للمتصفحات التي تدعم تنسيق الفيديو
          videoRef.current.src = src;
          
          // تعيين الوقت المحفوظ مسبقًا
          if (savedTime > 0) {
            videoRef.current.currentTime = savedTime;
          }
          
          // التشغيل التلقائي إذا كان مطلوبًا
          if (autoPlay) {
            videoRef.current.play().catch(error => {
              console.error('خطأ عند التشغيل التلقائي:', error);
            });
          }
          
          setIsLoading(false);
        }
      } catch (err) {
        console.error('خطأ في تحميل الفيديو:', err);
        setError(err instanceof Error ? err : new Error('حدث خطأ غير معروف'));
        setIsLoading(false);
      }
    };
    
    loadVideo();
    
    // تحميل بيانات المستخدم للعلامة المائية
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUserPhone(userData.phone || 'لا يوجد رقم');
        setUserName(userData.name || 'مستخدم');
      } catch (e) {
        console.error('خطأ في قراءة بيانات المستخدم:', e);
      }
    }
    
    // تنظيف عند إلغاء التحميل
    return cleanup;
  }, [src, savedTime, autoPlay]);

  // تحريك العلامة المائية لاسم ورقم هاتف الطالب في جميع أنحاء الفيديو
  useEffect(() => {
    if (!watermarkRef.current || (!userPhone && !userName)) return;
    
    const watermarkElement = watermarkRef.current;
    
    // تنفيذ حركة العلامة المائية
    const moveWatermark = () => {
      const videoContainer = containerRef.current;
      if (!videoContainer) return;
      
      const containerWidth = videoContainer.offsetWidth;
      const containerHeight = videoContainer.offsetHeight;
      const watermarkWidth = watermarkElement.offsetWidth;
      const watermarkHeight = watermarkElement.offsetHeight;
      
      // حساب الموقع الجديد بناءً على الاتجاه الحالي
      const { x, y, direction } = watermarkPosition.current;
      
      // حساب الموقع الجديد مع الحدود
      const maxX = containerWidth - watermarkWidth;
      const maxY = containerHeight - watermarkHeight;
      
      // تحديث الموقع بناءً على الاتجاه
      let newX = x + (direction.x * 50);
      let newY = y + (direction.y * 30);
      
      // عكس الاتجاه عند الوصول إلى الحدود
      if (newX <= 0 || newX >= maxX) {
        direction.x *= -1;
        newX = Math.max(0, Math.min(newX, maxX));
      }
      
      if (newY <= 0 || newY >= maxY) {
        direction.y *= -1;
        newY = Math.max(0, Math.min(newY, maxY));
      }
      
      // تحديث المرجع ووضع العلامة المائية
      watermarkPosition.current = { x: newX, y: newY, direction };
      
      // تطبيق الموقع الجديد على العنصر
      watermarkElement.style.left = `${newX}px`;
      watermarkElement.style.top = `${newY}px`;
    };
    
    // بدء حركة العلامة المائية
    const intervalId = setInterval(moveWatermark, 3000);
    
    // تنظيف عند إلغاء التحميل
    return () => clearInterval(intervalId);
  }, [userPhone, userName]);

  // حفظ تقدم الفيديو للمستخدم على الخادم
  const saveVideoProgress = useCallback(async () => {
    if (!courseId || !lessonId || !videoRef.current) return;
    
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    
    if (isNaN(currentTime) || isNaN(duration) || duration === 0) return;
    
    const percentage = Math.round((currentTime / duration) * 100);
    
    // تسجيل التقدم فقط إذا كان هناك تغير حقيقي
    if (Math.abs(percentage - lastSavedProgressRef.current) < 2 && lastSavedProgressRef.current > 0) {
      return;
    }
    
    // إضافة تأخير قصير لتجنب إرسال الكثير من الطلبات
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      // التحقق مرة أخرى في حالة أن المكون تم إلغاء تحميله خلال التأخير
      if (!videoRef.current) return;
      
      const data = {
        courseId,
        lessonId,
        progress: percentage,
        currentTime,
        duration
      };
      
      // تحديث القيمة المرجعية قبل الإرسال لتجنب الإرسالات المتكررة
      lastSavedProgressRef.current = percentage;
      
      // وضع محاولة حفظ التقدم في وحدة حماية زمنية
      let savePromise = Promise.race([
        progressService.saveProgress(data),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000)) // 5 ثوانٍ للتايم آوت
      ]);
      
      const response = await savePromise;
      
      // تحديث localStorage للتخزين المحلي - باستخدام نمط حساب أكثر كفاءة للذاكرة
      const progressKey = `progress_${courseId}_${lessonId}`;
      localStorage.setItem(progressKey, JSON.stringify({
        progress: percentage,
        currentTime,
        lastUpdated: new Date().toISOString()
      }));
      
      // إظهار إشعار بالنجاح عند اكتمال الفيديو إذا كان التقدم أكثر من 95%
      if (percentage > 95 && !completionNotified) {
        toast.success('تم حفظ تقدمك - الدرس مكتمل');
        setCompletionNotified(true);
        if (onComplete) onComplete();
      }
      
      // ظهور إشعار النجاح بمعدل 10% فقط من المحاولات، لتجنب إظهار الكثير من الإشعارات
      if (Math.random() < 0.1) {
        toast.success('تم حفظ تقدمك');
      }
      
      console.log('Progress saved:', percentage);
      return response;
    } catch (error) {
      console.error('Error saving progress:', error);
      
      // تخزين التقدم محلياً في حالة فشل الاتصال بالخادم - بطريقة أكثر كفاءة للذاكرة
      const offlineProgressKey = `offline_progress`;
      let offlineProgress = JSON.parse(localStorage.getItem(offlineProgressKey) || '[]');
      
      // التأكد من عدم تضخم الذاكرة المحلية - الاحتفاظ بآخر 50 سجل فقط
      if (offlineProgress.length > 50) {
        offlineProgress = offlineProgress.slice(-50);
      }
      
      offlineProgress.push({
        courseId,
        lessonId,
        progress: percentage,
        currentTime,
        duration,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(offlineProgressKey, JSON.stringify(offlineProgress));
      
      // إظهار رسالة فقط إذا لم يتم عرض رسائل فشل متعددة
      const now = Date.now();
      if (now - lastErrorNotificationRef.current > 10000) {  // 10 ثوانٍ بين الإشعارات
        toast.error('فشل حفظ التقدم. سيتم المحاولة لاحقاً');
        lastErrorNotificationRef.current = now;
      }
      
      return null;
    }
  }, [courseId, lessonId, completionNotified, onComplete]);

  // تتبع تقدم الفيديو واستكمال المشاهدة
  const trackProgress = useCallback(async () => {
    if (!courseId || !lessonId || !videoRef.current) return;
    
    try {
      const video = videoRef.current;
      
      // التأكد من أن الفيديو جاهز للتشغيل وأن البيانات صالحة
      if (!video.duration || isNaN(video.duration) || video.duration <= 0 || 
          isNaN(video.currentTime) || video.readyState < 1) {
        return;
      }
      
      const currentVideoTime = video.currentTime;
      const videoDuration = video.duration;
      
      // تحسين آلية التحديث للحد من الطلبات غير الضرورية
      // تحديث فقط إذا مر 5 ثوانٍ أو تقدم أكثر من 5% من آخر تحديث
      const timeDiff = currentVideoTime - lastUpdateTimeRef.current;
      const progressDiff = (timeDiff / videoDuration) * 100;
      
      if (timeDiff > 5 || progressDiff > 5) {
        lastUpdateTimeRef.current = currentVideoTime;
        
        // هل الفيديو مكتمل؟ (نعتبر الفيديو مكتمل إذا شاهد 95% منه)
        const isVideoCompleted = (currentVideoTime / videoDuration) > 0.95;
        
        try {
          await progressService.trackVideoProgress(courseId, lessonId, {
            currentTime: currentVideoTime,
            duration: videoDuration,
            completed: isVideoCompleted
          });

          if (isVideoCompleted && !isCompleted) {
            setIsCompleted(true);
            // إظهار إشعار للمستخدم عند إكمال الدرس
            try {
              toast.success('تم إكمال الدرس بنجاح!');
              // استدعاء دالة الإكمال إذا كانت موجودة
              if (typeof onComplete === 'function') {
                onComplete();
              }
            } catch (toastError) {
              console.error('خطأ في إظهار الإشعار:', toastError);
            }
          }
        } catch (apiError) {
          console.error('خطأ في حفظ تقدم الفيديو:', apiError);
          // تخزين التقدم محلياً في حالة فشل الاتصال بالخادم
          const pendingProgress = JSON.parse(localStorage.getItem('pendingVideoProgress') || '[]');
          pendingProgress.push({
            courseId,
            lessonId,
            currentTime,
            duration: videoDuration,
            completed: isVideoCompleted,
            timestamp: new Date().toISOString()
          });
          localStorage.setItem('pendingVideoProgress', JSON.stringify(pendingProgress));
        }
      }
    } catch (error) {
      console.error('خطأ عام في تتبع تقدم الفيديو:', error);
    }
  }, [courseId, lessonId, onComplete, isCompleted]);

  // تسجيل وقت المشاهدة كل 15 ثانية - تم تحسين الكفاءة
  useEffect(() => {
    if (!courseId || !lessonId || !hasStartedPlaying) return;

    // تسجيل وقت البدء لحساب مدة المشاهدة الإجمالية
    if (!studySessionStartedRef.current) {
      studySessionStartedRef.current = new Date();
    }

    // استخدام دالة مؤقتة لتجنب الاعتماد الدائري
    const saveProgressAndTrack = () => {
      if (isPlaying && videoRef.current && !error) {
        if (typeof saveVideoProgress === 'function') {
          saveVideoProgress();
        }
        if (typeof trackProgress === 'function') {
          trackProgress();
        }
      }
    };

    const saveInterval = setInterval(saveProgressAndTrack, 15000); // حفظ التقدم كل 15 ثانية
    
    // تنظيف الفاصل الزمني عند تفكيك المكون
    return () => clearInterval(saveInterval);
  }, [isPlaying, hasStartedPlaying, courseId, lessonId, error]); 

  // تنظيف الموارد عند إلغاء تحميل المكون
  useEffect(() => {
    return () => {
      // تنظيف الفواصل الزمنية ومراجع الحالة
      if (seekbarTimeoutRef.current) clearTimeout(seekbarTimeoutRef.current);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);

      // حفظ التقدم الأخير قبل إلغاء تحميل المكون
      if (videoRef.current && courseId && lessonId) {
        try {
          const finalTime = videoRef.current.currentTime;
          const finalDuration = videoRef.current.duration;
          if (!isNaN(finalTime) && !isNaN(finalDuration) && finalDuration > 0) {
            const finalPercentage = Math.round((finalTime / finalDuration) * 100);
            const progressKey = `progress_${courseId}_${lessonId}`;
            localStorage.setItem(progressKey, JSON.stringify({
              progress: finalPercentage,
              currentTime: finalTime,
              lastUpdated: new Date().toISOString()
            }));
          }
        } catch (e) {
          console.error('خطأ في حفظ التقدم النهائي:', e);
        }
      }
      
      // تنظيف كامل للذاكرة
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      
      // إيقاف تشغيل الفيديو وتحرير موارده
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src'); // طريقة أكثر أماناً من src = ''
        videoRef.current.load();
      }
      
      // إعادة تعيين المراجع لتجنب تسريب الذاكرة
      studySessionStartedRef.current = null;
      lastSavedProgressRef.current = 0;
      lastErrorNotificationRef.current = 0;
      lastUpdateTimeRef.current = 0;
      playbackTimeRef.current = 0;
    };
  }, [courseId, lessonId]);
  
  // Format time in seconds to MM:SS format
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return (
    <div className="relative bg-black overflow-hidden rounded-lg" ref={containerRef}>
      <video 
        ref={videoRef}
        className="w-full h-auto"
        poster={poster}
        playsInline
      />
      
      {/* العلامة المائية */}
      {(userPhone || userName) && (
        <div 
          ref={watermarkRef} 
          className="absolute p-2 rounded-md text-white text-sm bg-black/20 backdrop-blur-sm z-10"
          style={{ 
            left: '50%', 
            top: '50%', 
            transform: 'translate(-50%, -50%) rotate(-15deg)',
            pointerEvents: 'none',
            direction: 'rtl'
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <div>
              {userName && <span className="font-semibold">{userName}</span>}
              {userPhone && <span className="text-xs opacity-80"> • {userPhone}</span>}
            </div>
          </div>
        </div>
      )}
      
      {/* مؤشر التحميل */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* رسالة الخطأ */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-30 p-6 text-center">
          <FaExclamationTriangle className="text-yellow-500 text-4xl mb-4" />
          <h3 className="text-white text-lg font-bold mb-2">حدث خطأ أثناء تشغيل الفيديو</h3>
          <p className="text-gray-300 mb-4">{error.message}</p>
          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            onClick={() => {
              setError(null);
              setIsLoading(true);
              if (videoRef.current) {
                videoRef.current.load();
              }
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
