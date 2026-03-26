import { studyTimeService } from "../services/api";

// معرفات للتخزين المؤقت
const ACTIVE_SESSION_KEY = 'activeStudySession';
const PENDING_LOGS_KEY = 'pendingStudyLogs';

/**
 * تتبع جلسات التعلم وحساب الوقت المستغرق
 */
class StudySessionTracker {
  constructor() {
    this.activeSession = null;
    this.isTracking = false;
    
    // محاولة استعادة جلسة نشطة من التخزين المحلي
    this._restoreActiveSession();
    
    // مزامنة السجلات المعلقة
    this._syncPendingLogs();
  }
  
  /**
   * بدء جلسة تعلم جديدة
   * @param {Object} sessionData بيانات الجلسة
   */
  startSession(sessionData) {
    if (this.isTracking) {
      // إنهاء الجلسة النشطة الحالية أولاً
      this.endSession();
    }
    
    this.activeSession = {
      ...sessionData,
      startTime: new Date(),
      lastUpdated: new Date(),
      duration: 0,
    };
    
    this.isTracking = true;
    this._saveActiveSession();
    
    // بدء التحديث الدوري كل دقيقة
    this._startPeriodicUpdate();
    
    return this.activeSession;
  }
  
  /**
   * تحديث جلسة التعلم النشطة
   * @param {Object} updateData بيانات التحديث
   */
  updateSession(updateData) {
    if (!this.isTracking || !this.activeSession) {
      return null;
    }
    
    const now = new Date();
    const elapsedSinceLastUpdate = (now - new Date(this.activeSession.lastUpdated)) / 1000;
    
    this.activeSession = {
      ...this.activeSession,
      ...updateData,
      lastUpdated: now,
      duration: this.activeSession.duration + elapsedSinceLastUpdate
    };
    
    this._saveActiveSession();
    return this.activeSession;
  }
  
  /**
   * إنهاء جلسة التعلم الحالية
   * @returns {Object} بيانات الجلسة المنتهية
   */
  endSession() {
    if (!this.isTracking || !this.activeSession) {
      return null;
    }
    
    const now = new Date();
    const elapsedSinceLastUpdate = (now - new Date(this.activeSession.lastUpdated)) / 1000;
    
    const finalSession = {
      ...this.activeSession,
      endTime: now,
      duration: this.activeSession.duration + elapsedSinceLastUpdate
    };
    
    // إنهاء التتبع
    this.isTracking = false;
    this.activeSession = null;
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    
    // إيقاف التحديث الدوري
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
      this._updateInterval = null;
    }
    
    // حفظ سجل الجلسة في الخادم
    this._logSession(finalSession);
    
    return finalSession;
  }
  
  /**
   * الحصول على الجلسة النشطة الحالية
   * @returns {Object|null} بيانات الجلسة النشطة أو null إذا لم تكن هناك جلسة
   */
  getActiveSession() {
    if (!this.isTracking || !this.activeSession) {
      return null;
    }
    
    // حساب المدة الحالية
    const now = new Date();
    const elapsedSinceLastUpdate = (now - new Date(this.activeSession.lastUpdated)) / 1000;
    
    return {
      ...this.activeSession,
      currentDuration: this.activeSession.duration + elapsedSinceLastUpdate
    };
  }
  
  /**
   * استئناف تتبع الجلسة
   */
  resumeTracking() {
    if (this.activeSession && !this.isTracking) {
      this.isTracking = true;
      this.activeSession.lastUpdated = new Date();
      this._saveActiveSession();
      this._startPeriodicUpdate();
    }
  }
  
  /**
   * إيقاف تتبع الجلسة مؤقتًا
   */
  pauseTracking() {
    if (this.isTracking) {
      this.isTracking = false;
      this.updateSession({});
      
      if (this._updateInterval) {
        clearInterval(this._updateInterval);
        this._updateInterval = null;
      }
    }
  }
  
  /**
   * تنسيق وقت الدراسة بتنسيق مقروء
   * @param {number} seconds الوقت بالثواني
   * @returns {string} الوقت المنسق
   */
  static formatStudyTime(seconds) {
    if (!seconds || seconds < 0) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }
    
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }
  
  /**
   * بدء التحديث الدوري للجلسة
   * @private
   */
  _startPeriodicUpdate() {
    // إيقاف التحديث الحالي إذا كان موجودًا
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
    }
    
    // تحديث كل 60 ثانية
    this._updateInterval = setInterval(() => {
      if (this.isTracking) {
        this.updateSession({});
      }
    }, 60 * 1000);
  }
  
  /**
   * حفظ الجلسة النشطة في التخزين المحلي
   * @private
   */
  _saveActiveSession() {
    if (this.activeSession) {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(this.activeSession));
    }
  }
  
  /**
   * استعادة الجلسة النشطة من التخزين المحلي
   * @private
   */
  _restoreActiveSession() {
    try {
      const savedSession = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (savedSession) {
        this.activeSession = JSON.parse(savedSession);
        const lastUpdated = new Date(this.activeSession.lastUpdated);
        const now = new Date();
        
        // إذا كان آخر تحديث منذ أكثر من 30 دقيقة، نعتبر الجلسة منتهية
        if ((now - lastUpdated) > 30 * 60 * 1000) {
          this.endSession();
        } else {
          this.isTracking = true;
          this._startPeriodicUpdate();
        }
      }
    } catch (error) {
      console.error('خطأ في استعادة جلسة التعلم', error);
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  }
  
  /**
   * تسجيل جلسة التعلم في الخادم
   * @param {Object} session بيانات الجلسة
   * @private
   */
  async _logSession(session) {
    // تجاهل الجلسات القصيرة جدًا (أقل من 30 ثانية)
    if (session.duration < 30) {
      return;
    }
    
    const sessionData = {
      courseId: session.courseId,
      lessonId: session.lessonId,
      duration: session.duration,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime.toISOString(),
      progress: session.progress || 0
    };
    
    try {
      await studyTimeService.logStudySession(sessionData);
    } catch (error) {
      console.error('خطأ في تسجيل جلسة التعلم', error);
      
      // تخزين في قائمة الانتظار للمزامنة لاحقًا
      this._addToPendingLogs(sessionData);
    }
  }
  
  /**
   * إضافة سجل جلسة إلى قائمة الانتظار
   * @param {Object} sessionData بيانات الجلسة
   * @private
   */
  _addToPendingLogs(sessionData) {
    try {
      const pendingLogs = JSON.parse(localStorage.getItem(PENDING_LOGS_KEY) || '[]');
      pendingLogs.push(sessionData);
      localStorage.setItem(PENDING_LOGS_KEY, JSON.stringify(pendingLogs));
    } catch (error) {
      console.error('خطأ في تخزين سجل معلق', error);
    }
  }
  
  /**
   * مزامنة السجلات المعلقة مع الخادم
   * @private
   */
  async _syncPendingLogs() {
    try {
      const pendingLogs = JSON.parse(localStorage.getItem(PENDING_LOGS_KEY) || '[]');
      if (pendingLogs.length === 0) return;
      
      const successfulLogs = [];
      
      for (const log of pendingLogs) {
        try {
          await studyTimeService.logStudySession(log);
          successfulLogs.push(log);
        } catch (error) {
          console.error('خطأ في مزامنة سجل معلق', error);
        }
      }
      
      // إزالة السجلات التي تمت مزامنتها بنجاح
      if (successfulLogs.length > 0) {
        const remainingLogs = pendingLogs.filter(log => !successfulLogs.includes(log));
        localStorage.setItem(PENDING_LOGS_KEY, JSON.stringify(remainingLogs));
      }
    } catch (error) {
      console.error('خطأ في مزامنة السجلات المعلقة', error);
    }
  }
}

// إنشاء كائن واحد للاستخدام في التطبيق
const studySessionTracker = new StudySessionTracker();

export default studySessionTracker; 