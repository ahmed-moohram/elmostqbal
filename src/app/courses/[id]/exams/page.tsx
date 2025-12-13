"use client";

import { useState, useEffect } from "react";
import { Exam, Question } from "../../../../types/exam";
import { useRouter, useParams } from "next/navigation";
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { FaClock, FaCheck, FaTimes, FaStar, FaShieldAlt, FaBook, FaPlay, FaArrowLeft, FaArrowRight, FaQuestionCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import Link from "next/link";

export default function CourseExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showExamModal, setShowExamModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [examFinished, setExamFinished] = useState(false);
  const [examResultCard, setExamResultCard] = useState<{
    examTitle: string;
    score: number | null;
    passed: boolean | null;
  } | null>(null);
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const { user } = useAuth();

  const [examStatuses, setExamStatuses] = useState<Record<string, {
    attemptCount: number;
    cheatAttempts: number;
    nonCheatAttempts: number;
    hasAnyResult: boolean;
    lastScore: number | null;
    lastPassed: boolean | null;
  }>>({});
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const CHEAT_LIMIT = 1;

  const totalQuestions = selectedExam?.questions?.length || 0;
  const progressPercent = totalQuestions > 0
    ? Math.round(((currentQuestion + 1) / totalQuestions) * 100)
    : 0;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // جلب الاختبارات للمادة
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await fetch('/api/exams');
        const data = await response.json();
        const filtered = Array.isArray(data) ? data.filter((e: any) => e.courseId === courseId) : [];
        setExams(filtered);
      } catch (error) {
        console.error('Error fetching exams:', error);
      }
    };

    fetchExams();
  }, [courseId]);

  // جلب حالة كل امتحان لهذا الطالب (عدد المحاولات ومحاولات الغش)
  useEffect(() => {
    if (!user?.id || !courseId || exams.length === 0) return;

    const loadStatuses = async () => {
      try {
        setLoadingStatuses(true);
        const map: Record<string, {
          attemptCount: number;
          cheatAttempts: number;
          nonCheatAttempts: number;
          hasAnyResult: boolean;
          lastScore: number | null;
          lastPassed: boolean | null;
        }> = {};

        await Promise.all(
          exams.map(async (exam) => {
            try {
              const res = await fetch(
                `/api/student/exams/status?courseId=${courseId}&examId=${exam.id}&userId=${user.id}`,
              );
              const json = await res.json().catch(() => null);
              if (res.ok && json?.success) {
                map[exam.id] = {
                  attemptCount: Number(json.attemptCount || 0),
                  cheatAttempts: Number(json.cheatAttempts || 0),
                  nonCheatAttempts: Number(json.nonCheatAttempts || 0),
                  hasAnyResult: !!json.hasAnyResult,
                  lastScore:
                    typeof json.lastScore === 'number' ? Number(json.lastScore) : null,
                  lastPassed:
                    typeof json.lastPassed === 'boolean' ? Boolean(json.lastPassed) : null,
                };
              }
            } catch (err) {
              console.error('Error loading exam status for student:', err);
            }
          }),
        );

        setExamStatuses(map);
      } finally {
        setLoadingStatuses(false);
      }
    };

    loadStatuses();
  }, [courseId, user?.id, exams]);

  // اعتباره غش إذا غادر الطالب الشاشة أو غيّر التبويب أثناء الامتحان
  useEffect(() => {
    if (!showExamModal || !selectedExam) return;

    let handled = false;

    const handleCheat = () => {
      if (handled) return;
      handled = true;
      alert('تم إنهاء الامتحان بسبب مغادرة الشاشة، وتم تسجيل المحاولة كمحاولة غش.');
      submitExam(true);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleCheat();
      }
    };

    const handleBlur = () => {
      handleCheat();
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [showExamModal, selectedExam]);

  // بدء الاختبار
  const startExam = async (exam: Exam) => {
    if (!user?.id) {
      alert('يجب تسجيل الدخول لحل الامتحان.');
      return;
    }

    // مسح أي كارت نتيجة قديم عند بدء امتحان جديد
    setExamResultCard(null);

    // التحقق من حالة هذا الامتحان لحظياً من الخادم قبل السماح بالدخول
    try {
      setLoadingStatuses(true);
      const res = await fetch(
        `/api/student/exams/status?courseId=${courseId}&examId=${exam.id}&userId=${user.id}`,
      );
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 403 && json?.error === 'not_enrolled') {
          alert('ليس لديك صلاحية لدخول هذا الامتحان. يرجى الاشتراك في الكورس أولاً.');
        } else {
          alert('تعذر التحقق من حالة هذا الامتحان حالياً، برجاء المحاولة لاحقاً.');
        }
        return;
      }

      if (!json?.success) {
        alert('تعذر التحقق من حالة هذا الامتحان حالياً، برجاء المحاولة لاحقاً.');
        return;
      }

      const statusFromApi = {
        attemptCount: Number(json.attemptCount || 0),
        cheatAttempts: Number(json.cheatAttempts || 0),
        nonCheatAttempts: Number(json.nonCheatAttempts || 0),
        hasAnyResult: !!json.hasAnyResult,
        lastScore:
          typeof json.lastScore === 'number' ? Number(json.lastScore) : null,
        lastPassed:
          typeof json.lastPassed === 'boolean' ? Boolean(json.lastPassed) : null,
      } as {
        attemptCount: number;
        cheatAttempts: number;
        nonCheatAttempts: number;
        hasAnyResult: boolean;
        lastScore: number | null;
        lastPassed: boolean | null;
      };

      // تحديث الحالة في الواجهة لاستخدامها في عرض المعلومات
      setExamStatuses((prev) => ({
        ...prev,
        [exam.id]: statusFromApi,
      }));

      // إذا كان هناك أي محاولة بدون غش، يمنع الإعادة إلا بسماح المدرس
      if (statusFromApi.nonCheatAttempts > 0) {
        alert('لقد قمت بحل هذا الامتحان من قبل. لا يمكن الإعادة إلا بعد سماح المدرس من صفحته.');
        return;
      }

      // إذا تجاوز عدد محاولات الغش الحد المسموح، يُغلق الامتحان تمامًا
      if (statusFromApi.cheatAttempts >= CHEAT_LIMIT) {
        alert('تم إيقاف هذا الامتحان بسبب تكرار محاولات الغش. يرجى التواصل مع المدرس.');
        return;
      }
    } catch (err) {
      console.error('Error checking exam status before start:', err);
      alert('تعذر التحقق من حالة هذا الامتحان حالياً، برجاء المحاولة لاحقاً.');
      return;
    } finally {
      setLoadingStatuses(false);
    }

    // إذا وصلنا هنا فالمحاولة مسموحة
    setSelectedExam(exam);
    setShowExamModal(true);
    setCurrentQuestion(0);
    setAnswers({});
    setTimeLeft(exam.duration * 60); // تحويل الدقائق إلى ثواني
    setExamFinished(false);
    // بدء التوقيت العكسي
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          submitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // تسليم الاختبار
  const submitExam = async (cheated: boolean = false) => {
    if (!selectedExam || !user?.id || examFinished) return;

    const currentExamId = selectedExam.id;

    setExamFinished(true);

    try {
      const res = await fetch('/api/exams/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selectedExam.id,
          answers,
          courseId,
          userId: user.id,
          cheated,
        }),
      });
      const json = await res.json().catch(() => null);

      if (res.ok && json?.success) {
        if (cheated) {
          alert('تم إنهاء الامتحان وتسجيله كمحاولة غش، ولن تُحتسب لك درجة في هذا الامتحان.');
        } else {
          const score = typeof json.score === 'number' ? json.score : null;
          const passed = typeof json.passed === 'boolean' ? json.passed : null;

          setExamResultCard({
            examTitle: selectedExam.title,
            score,
            passed,
          });
        }
      } else {
        console.error('Error submitting exam, response not ok:', json);

        if (json?.error === 'already_attempted') {
          alert(
            json.message ||
              'لقد تم حل هذا الامتحان مسبقاً ولا يمكن إعادته إلا بعد سماح المدرس.',
          );
        } else if (json?.error === 'cheat_limit_reached') {
          alert(
            json.message ||
              'تم إيقاف هذا الامتحان بسبب تكرار محاولات الغش. يرجى التواصل مع المدرس.',
          );
        } else if (json?.error === 'missing_required_fields') {
          alert('حدثت مشكلة في بيانات الطلب، برجاء إعادة تحميل الصفحة وإعادة المحاولة.');
        } else if (json?.message) {
          alert(json.message);
        } else {
          alert('حدث خطأ أثناء تسليم الامتحان، برجاء المحاولة لاحقاً.');
        }
      }

      // تحديث حالة هذا الامتحان من الخادم بعد تسجيل المحاولة
      try {
        const statusRes = await fetch(
          `/api/student/exams/status?courseId=${courseId}&examId=${currentExamId}&userId=${user?.id}`,
        );
        const statusJson = await statusRes.json().catch(() => null);
        if (statusRes.ok && statusJson?.success) {
          setExamStatuses((prev) => ({
            ...prev,
            [currentExamId]: {
              attemptCount: Number(statusJson.attemptCount || 0),
              cheatAttempts: Number(statusJson.cheatAttempts || 0),
              nonCheatAttempts: Number(statusJson.nonCheatAttempts || 0),
              hasAnyResult: !!statusJson.hasAnyResult,
              lastScore:
                typeof statusJson.lastScore === 'number'
                  ? Number(statusJson.lastScore)
                  : null,
              lastPassed:
                typeof statusJson.lastPassed === 'boolean'
                  ? Boolean(statusJson.lastPassed)
                  : null,
            },
          }));
        }
      } catch (err) {
        console.error('Error refreshing exam status after submit:', err);
      }

      setShowExamModal(false);
      setSelectedExam(null);
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('حدث خطأ أثناء تسليم الامتحان، برجاء المحاولة لاحقاً.');
    }
  };

  // عرض السؤال الحالي
  const renderQuestion = () => {
    if (!selectedExam || !selectedExam.questions[currentQuestion]) return null;

    const question = selectedExam.questions[currentQuestion];
    const answer = answers[question.id];

    switch (question.type) {
      case 'multipleChoice':
        return (
          <div className="space-y-5">
            <p className="text-lg md:text-xl font-semibold text-slate-800 leading-relaxed">
              {question.content}
            </p>
            <div className="space-y-3">
              {question.options?.map((option, index) => {
                const isSelected = answer === option;
                const optionLabel = String.fromCharCode(65 + index); // A, B, C, ...

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setAnswers({ ...answers, [question.id]: option })}
                    className={`w-full text-right px-4 py-3 rounded-2xl border transition-all duration-200 shadow-sm flex items-center gap-3 ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {optionLabel}
                    </span>
                    <span className="flex-1 text-sm md:text-base leading-relaxed">{option}</span>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 border border-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'trueFalse':
        return (
          <div className="space-y-5">
            <p className="text-lg md:text-xl font-semibold text-slate-800 leading-relaxed">
              {question.content}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { value: 'true', label: 'صحيح' },
                { value: 'false', label: 'خطأ' },
              ].map((opt) => {
                const isSelected = answer === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setAnswers({
                        ...answers,
                        [question.id]: opt.value,
                      })
                    }
                    className={`w-full text-center px-4 py-3 rounded-2xl border transition-all duration-200 shadow-sm text-sm md:text-base font-semibold ${
                      isSelected
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'fillIn':
        return (
          <div className="space-y-4">
            <p className="text-lg font-semibold">{question.content}</p>
            <input
              type="text"
              value={answer || ''}
              onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="أدخل إجابتك هنا"
            />
          </div>
        );

      case 'matching':
        return (
          <div className="space-y-4">
            <p className="text-lg font-semibold">{question.content}</p>
            <div className="grid grid-cols-2 gap-4">
              {question.options?.map((option, index) => (
                <div key={index} className="flex flex-col space-y-2">
                  <p>{option}</p>
                  <select
                    value={answer?.[index] || ''}
                    onChange={(e) => {
                      const newAnswers = { ...answers };
                      newAnswers[question.id] = newAnswers[question.id] || {};
                      newAnswers[question.id][index] = e.target.value;
                      setAnswers(newAnswers);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">اختر...</option>
                    {question.options?.map((matchOption, matchIndex) => (
                      <option key={matchIndex} value={matchOption}>
                        {matchOption}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary flex items-center space-x-2">
          <FaBook className="text-2xl" />
          <span>الاختبارات</span>
        </h1>
        <div className="flex items-center space-x-4">
          <Link
            href="/profile/exam-results"
            className="flex items-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FaCheck className="mr-2" />
            نتائجي
          </Link>
          <Link
            href="/courses"
            className="flex items-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FaBook className="mr-2" />
            المواد
          </Link>
        </div>
      </div>

      {examResultCard && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 max-w-xl mx-auto bg-white rounded-2xl shadow-lg border border-emerald-100 p-4 md:p-5 flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
              <FaCheck className="text-emerald-600 text-lg" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-semibold text-emerald-700 mb-1">
                تم تسليم الامتحان بنجاح
              </p>
              <p className="text-sm md:text-base font-bold text-slate-800">
                {examResultCard.examTitle}
              </p>
              {examResultCard.score !== null && (
                <p className="mt-1 text-sm md:text-base text-slate-700">
                  درجتك:{' '}
                  <span className="font-bold text-emerald-700">
                    {examResultCard.score}
                  </span>{' '}
                  من 100
                </p>
              )}
              {examResultCard.passed !== null && (
                <p className="mt-1 text-xs md:text-sm">
                  الحالة:{' '}
                  <span
                    className={
                      examResultCard.passed
                        ? 'text-emerald-700 font-semibold'
                        : 'text-red-600 font-semibold'
                    }
                  >
                    {examResultCard.passed ? 'ناجح' : 'لم تحقق درجة النجاح'}
                  </span>
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExamResultCard(null)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="إغلاق كارت النتيجة"
          >
            <FaTimes />
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam) => {
          const status = examStatuses[exam.id];
          const hasNonCheatAttempts = status && status.nonCheatAttempts > 0;
          const reachedCheatLimit = status && status.cheatAttempts >= CHEAT_LIMIT;
          const alreadyAttempted = !!hasNonCheatAttempts;

          const lastScore = status?.lastScore ?? null;
          const lastPassed = status?.lastPassed ?? null;
          const hasCheatAttempts = (status?.cheatAttempts || 0) > 0;

          return (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{exam.title}</h2>
                    <div className="flex items-center space-x-4 text-gray-200">
                      <span className="flex items-center space-x-1">
                        <FaClock className="text-sm" />
                        <span>{exam.duration} دقيقة</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <FaQuestionCircle className="text-sm" />
                        <span>{exam.questions.length} سؤال</span>
                      </span>
                    </div>
                    {status && (lastScore !== null || hasCheatAttempts) && (
                      <div className="mt-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/25 shadow-inner flex flex-col gap-2 text-xs md:text-sm text-white">
                          {lastScore !== null && (
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                                  <FaStar className="text-yellow-300 text-sm" />
                                </div>
                                <div>
                                  <p className="text-[11px] md:text-xs text-white/80">درجتك في هذا الامتحان</p>
                                  <p className="text-base md:text-lg font-bold">
                                    {lastScore}
                                    <span className="text-[11px] md:text-xs font-semibold text-white/80 ml-1">
                                      / 100
                                    </span>
                                  </p>
                                </div>
                              </div>
                              {lastPassed !== null && (
                                <span
                                  className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] md:text-xs font-semibold border ${
                                    lastPassed
                                      ? 'bg-emerald-500/15 text-emerald-100 border-emerald-300/50'
                                      : 'bg-red-500/15 text-red-100 border-red-300/50'
                                  }`}
                                >
                                  {lastPassed ? 'ناجح' : 'لم تحقق درجة النجاح'}
                                </span>
                              )}
                            </div>
                          )}
                          {hasCheatAttempts && (
                            <div className="flex items-center justify-between gap-2 text-[11px] md:text-xs text-yellow-50">
                              <span>محاولات غش مسجلة</span>
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400/20 border border-yellow-200/60 text-[11px] font-semibold">
                                {status.cheatAttempts}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 md:mt-0 flex flex-col items-center md:items-end gap-2">
                    {reachedCheatLimit ? (
                      <span className="text-xs md:text-sm text-red-100 bg-red-500/20 px-3 py-1 rounded-full border border-red-200/60">
                        تم إيقاف هذا الامتحان بسبب تكرار محاولات الغش. تواصل مع المدرس.
                      </span>
                    ) : alreadyAttempted ? (
                      <span className="text-xs md:text-sm text-yellow-50 bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-200/60">
                        لقد قمت بحل هذا الامتحان، لا يمكن الإعادة إلا بعد سماح المدرس.
                      </span>
                    ) : (
                      <button
                        onClick={() => startExam(exam)}
                        disabled={loadingStatuses}
                        className="px-6 py-3 bg-white text-primary font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="flex items-center space-x-2">
                          <FaPlay className="text-primary" />
                          <span>
                            {loadingStatuses ? 'جاري التحقق من الحالة...' : 'بدء الاختبار'}
                          </span>
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* مودال الامتحان الجديد */}
      {showExamModal && selectedExam && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-slate-900/90 flex items-center justify-center px-4 py-8"
        >
          <motion.div
            initial={{ y: 20, opacity: 0.9 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0.9 }}
            className="relative w-full max-w-3xl rounded-3xl bg-white/95 shadow-2xl overflow-hidden border border-slate-200"
          >
            {/* شريط علوي */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary to-purple-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                  <FaQuestionCircle className="text-xl" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold line-clamp-1">{selectedExam.title}</h2>
                  <p className="text-xs md:text-sm text-white/80 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1">
                      <FaClock className="text-[11px]" />
                      <span>الوقت المتبقي: {formatTime(timeLeft)}</span>
                    </span>
                    {totalQuestions > 0 && (
                      <span className="hidden md:inline-flex items-center gap-1 text-white/80">
                        السؤال {currentQuestion + 1} من {totalQuestions}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowExamModal(false)}
                className="text-white/80 hover:text-white transition-colors text-xl"
              >
                <FaTimes />
              </button>
            </div>

            {/* شريط التقدّم */}
            {totalQuestions > 0 && (
              <div className="px-6 pt-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-500">تقدّم الامتحان</span>
                  <span className="text-xs font-semibold text-primary">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* منطقة السؤال */}
            <div className="px-6 py-5 md:py-6">
              <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-4 md:p-6 min-h-[220px]">
                {renderQuestion()}
              </div>
            </div>

            {/* أزرار التنقّل */}
            <div className="px-6 pb-5 md:pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t border-slate-100 bg-slate-50/60">
              <div className="text-xs md:text-sm text-slate-500">
                السؤال <span className="font-semibold text-primary">{currentQuestion + 1}</span> من{' '}
                <span className="font-semibold">{totalQuestions}</span>
              </div>

              <div className="flex items-center gap-3 md:gap-4 justify-end">
                <button
                  onClick={() => {
                    if (currentQuestion > 0) {
                      setCurrentQuestion((prev) => prev - 1);
                    }
                  }}
                  disabled={currentQuestion === 0}
                  className="inline-flex items-center justify-center px-4 md:px-5 py-2.5 rounded-full border text-xs md:text-sm font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-slate-200 text-slate-700 hover:bg-slate-100 bg-white"
                >
                  <FaArrowLeft className="ml-1" />
                  السابق
                </button>

                <button
                  onClick={() => {
                    if (currentQuestion < totalQuestions - 1) {
                      setCurrentQuestion((prev) => prev + 1);
                    } else {
                      submitExam();
                    }
                  }}
                  className="inline-flex items-center justify-center px-6 md:px-7 py-2.5 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white text-xs md:text-sm font-semibold shadow-md hover:shadow-lg hover:from-primary/95 hover:to-purple-700 transition-all"
                >
                  {currentQuestion < totalQuestions - 1 ? (
                    <>
                      التالي
                      <FaArrowRight className="mr-1" />
                    </>
                  ) : (
                    <>
                      تسليم الامتحان
                      <FaCheck className="mr-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
