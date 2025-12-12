'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaBookOpen, FaClock, FaPlus, FaTrash, FaUsers, FaWhatsapp, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { Exam } from '@/types/exam';
import { useAuth } from '@/contexts/AuthContext';

interface ExamResultDto {
  id: string;
  studentId: string;
  studentName: string;
  email: string;
  parentPhone: string | null;
  score: number;
  totalQuestions: number;
  passed: boolean;
  attemptedAt: string | null;
  cheated: boolean;
}

export default function TeacherCourseExamsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = (params as any)?.courseId as string | undefined;
  const { user, isAuthenticated, isLoading } = useAuth();

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDuration, setFormDuration] = useState<number>(60);
  const [formPassingMarks, setFormPassingMarks] = useState<number>(50);
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState<'A' | 'B' | 'C' | 'D' | ''>('');
  const [questionMarks, setQuestionMarks] = useState<number>(10);
  const [draftQuestions, setDraftQuestions] = useState<any[]>([]);

  const [resultsExamId, setResultsExamId] = useState<string | null>(null);
  const [results, setResults] = useState<ExamResultDto[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    const loadExams = async () => {
      if (!courseId) return;
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/exams');
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.exams || [];
        const filtered = list.filter((e: any) => String(e.courseId) === String(courseId));
        setExams(filtered);
      } catch (err) {
        console.error('Error loading exams for teacher course:', err);
        setError('تعذر تحميل الامتحانات لهذا الكورس');
      } finally {
        setLoading(false);
      }
    };

    loadExams();
  }, [courseId]);

  const handleResetExamForAllStudents = async (examId: string) => {
    if (!courseId || !user?.id) {
      toast.error('يجب تسجيل الدخول كمدرس لإعادة الامتحان للطلاب');
      return;
    }

    if (!window.confirm('هل تريد إعادة هذا الامتحان لجميع طلاب هذا الكورس؟ سيتم حذف جميع النتائج الحالية وسيُسمح لهم بحله من جديد.')) {
      return;
    }

    try {
      const res = await fetch('/api/teacher/exams/reset-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          examId,
          teacherId: user.id,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        console.error('Error resetting exam for all students:', json);
        toast.error('فشل إعادة الامتحان لجميع الطلاب');
        return;
      }

      // في حال كنا نعرض نتائج هذا الامتحان الآن، نفرغ القائمة
      if (resultsExamId === examId) {
        setResults([]);
      }

      toast.success('تم إعادة الامتحان لجميع الطلاب، ويمكنهم حله من جديد.');
    } catch (err) {
      console.error('Unexpected error resetting exam for all students:', err);
      toast.error('حدث خطأ أثناء إعادة الامتحان لجميع الطلاب');
    }
  };

  const handleAddQuestion = () => {
    const qText = questionText.trim();
    if (!qText) {
      toast.error('يرجى إدخال نص السؤال');
      return;
    }

    const opts = [optionA, optionB, optionC, optionD]
      .map((o) => o.trim())
      .filter((o) => o);
    if (opts.length < 2) {
      toast.error('يرجى إدخال اختيارين صالحين على الأقل للسؤال');
      return;
    }

    const optionMap: Record<string, string> = {
      A: optionA.trim(),
      B: optionB.trim(),
      C: optionC.trim(),
      D: optionD.trim(),
    };
    const selected = correctOption ? optionMap[correctOption] : '';
    if (!selected || !opts.includes(selected)) {
      toast.error('يرجى اختيار إجابة صحيحة من بين الاختيارات');
      return;
    }

    const marks = questionMarks > 0 ? questionMarks : 1;

    const newQuestion = {
      id: `q${draftQuestions.length + 1}`,
      type: 'multipleChoice' as const,
      content: qText,
      options: opts,
      correctAnswer: selected,
      marks,
    };

    setDraftQuestions((prev) => [...prev, newQuestion]);
    setQuestionText('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setCorrectOption('');
    setQuestionMarks(10);
  };

  const handleRemoveQuestion = (id: string) => {
    setDraftQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !user?.id) {
      toast.error('يجب تسجيل الدخول كمدرس لإنشاء الامتحانات');
      return;
    }

    const title = formTitle.trim();
    if (!title) {
      toast.error('يرجى إدخال عنوان للامتحان');
      return;
    }
    if (draftQuestions.length === 0) {
      toast.error('يرجى إضافة سؤال واحد على الأقل للامتحان عبر زر "إضافة السؤال إلى الامتحان"');
      return;
    }

    const examId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${courseId}-${Date.now()}`;
    const totalMarks = draftQuestions.reduce(
      (sum, q) => sum + (Number(q.marks) || 0),
      0,
    );
    const payload: any = {
      id: examId,
      title,
      courseId: String(courseId),
      description: '',
      duration: Number(formDuration) || 60,
      totalMarks,
      passingMarks: Number(formPassingMarks) || 0,
      isActive: true,
      questions: draftQuestions,
    };

    try {
      setSaving(true);
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.exam) {
        console.error('Failed to create exam via /api/exams:', json);
        toast.error('فشل إنشاء الامتحان');
        return;
      }

      const created = json.exam as Exam;
      setExams((prev) => [...prev, created]);

      setFormTitle('');
      setFormDuration(60);
      setFormPassingMarks(50);
      setQuestionText('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setOptionD('');
      setCorrectOption('');
      setQuestionMarks(10);
      setDraftQuestions([]);
      setShowForm(false);
      toast.success('تم إنشاء الامتحان بنجاح');
    } catch (err) {
      console.error('Unexpected error creating exam:', err);
      toast.error('حدث خطأ أثناء إنشاء الامتحان');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الامتحان؟')) return;

    try {
      const res = await fetch(`/api/exams/${examId}`, { method: 'DELETE' });
      if (!res.ok) {
        console.error('Failed to delete exam', await res.text());
        toast.error('فشل حذف الامتحان');
        return;
      }
      setExams(prev => prev.filter(e => e.id !== examId));
    } catch (err) {
      console.error('Unexpected error deleting exam:', err);
      toast.error('حدث خطأ أثناء حذف الامتحان');
    }
  };

  const handleLoadResults = async (examId: string) => {
    if (!courseId || !user?.id) {
      toast.error('يجب تسجيل الدخول كمدرس لعرض النتائج');
      return;
    }

    try {
      setLoadingResults(true);
      setResultsExamId(examId);
      const params = new URLSearchParams();
      params.set('courseId', String(courseId));
      params.set('examId', String(examId));
      params.set('teacherId', user.id);

      const res = await fetch(`/api/teacher/exams/results?${params.toString()}`);
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        console.error('Error fetching teacher exam results:', json);
        setResults([]);
        toast.error('تعذر تحميل نتائج الامتحان');
        return;
      }

      const list = Array.isArray(json?.results) ? (json.results as ExamResultDto[]) : [];
      setResults(list);
    } catch (err) {
      console.error('Unexpected error fetching teacher exam results:', err);
      toast.error('تعذر تحميل نتائج الامتحان');
    } finally {
      setLoadingResults(false);
    }
  };

  const handleSendResultToParent = (exam: Exam | null, result: ExamResultDto) => {
    const rawPhone = (result.parentPhone || '').replace(/[^0-9]/g, '');
    if (!rawPhone) {
      toast.error('لا يوجد رقم ولي أمر صالح لهذا الطالب');
      return;
    }

    const examTitle = exam?.title || '';

    let statusText: string;
    if (result.cheated) {
      statusText = 'تم رصد محاولة غش في هذا الامتحان، وتم إلغاء الدرجة وعدم احتسابها.';
    } else if (result.passed) {
      statusText = 'ناجح في الامتحان وحقق درجة النجاح المطلوبة.';
    } else {
      statusText = 'لم يحقق درجة النجاح في هذا الامتحان.';
    }

    const text = `السلام عليكم ورحمة الله وبركاته\n\nولي أمر الطالب/ة ${result.studentName}\n\nنود إبلاغكم بنتيجة الامتحان "${examTitle}" في هذا الكورس.\n\n- الدرجة: ${result.score} من 100\n- عدد الأسئلة: ${result.totalQuestions}\n- حالة الطالب: ${statusText}\n\nمع تحيات منصة المستقبل التعليمية.`;

    const url = `https://wa.me/2${rawPhone}?text=${encodeURIComponent(text)}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  };

  const handleResetExamForStudent = async (examId: string, result: ExamResultDto) => {
    if (!courseId || !user?.id) {
      toast.error('يجب تسجيل الدخول كمدرس لإعادة الامتحان');
      return;
    }

    if (!window.confirm(`هل تريد السماح للطالب ${result.studentName} بإعادة هذا الامتحان؟`)) {
      return;
    }

    try {
      const res = await fetch('/api/teacher/exams/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          examId,
          studentId: result.studentId,
          teacherId: user.id,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        console.error('Error resetting exam for student:', json);
        toast.error('فشل إعادة الامتحان لهذا الطالب');
        return;
      }

      setResults((prev) => prev.filter((r) => r.id !== result.id));
      toast.success('تم السماح للطالب بإعادة الامتحان، وستُسجل المحاولة الجديدة عند حلّه مرة أخرى');
    } catch (err) {
      console.error('Unexpected error resetting exam for student:', err);
      toast.error('حدث خطأ أثناء إعادة الامتحان للطالب');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== 'teacher') {
    return null;
  }

  if (!courseId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">لم يتم تحديد كورس.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-4 pb-10 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-slate-800">
            <FaBookOpen className="text-primary text-xl" />
            <h1 className="text-2xl font-bold">امتحانات الكورس</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/teacher/dashboard`}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition whitespace-nowrap"
            >
              رجوع للوحة المدرس
            </Link>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm whitespace-nowrap shadow-sm"
              onClick={() => setShowForm((v) => !v)}
            >
              <FaPlus />
              {showForm ? 'إغلاق النموذج' : 'إضافة امتحان'}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-2 sm:mb-4 lg:mb-6 p-4 sm:p-5 lg:p-6">
            <h2 className="text-lg font-bold mb-4 text-slate-800">إنشاء امتحان جديد</h2>
            <form onSubmit={handleCreateExam} className="space-y-4 text-sm">
              <div>
                <label className="block mb-1 font-medium">عنوان الامتحان</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1 font-medium">مدة الامتحان (دقيقة)</label>
                  <input
                    type="number"
                    min={1}
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">درجة النجاح (علامات)</label>
                  <input
                    type="number"
                    min={0}
                    value={formPassingMarks}
                    onChange={(e) => setFormPassingMarks(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">درجة السؤال</label>
                  <input
                    type="number"
                    min={1}
                    value={questionMarks}
                    onChange={(e) => setQuestionMarks(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-medium">نص السؤال (اختيار من متعدد)</label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-medium">الاختيار A</label>
                  <input
                    type="text"
                    value={optionA}
                    onChange={(e) => setOptionA(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">الاختيار B</label>
                  <input
                    type="text"
                    value={optionB}
                    onChange={(e) => setOptionB(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">الاختيار C</label>
                  <input
                    type="text"
                    value={optionC}
                    onChange={(e) => setOptionC(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">الاختيار D</label>
                  <input
                    type="text"
                    value={optionD}
                    onChange={(e) => setOptionD(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-medium">الإجابة الصحيحة</label>
                <select
                  value={correctOption}
                  onChange={(e) => setCorrectOption(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">اختر الإجابة الصحيحة</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-4 py-2 text-xs rounded-lg border border-dashed border-gray-400 text-gray-700 hover:bg-gray-50"
                >
                  إضافة السؤال إلى الامتحان
                </button>
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                  >
                    {saving ? 'جاري الحفظ...' : 'حفظ الامتحان'}
                  </button>
                </div>
              </div>

              {draftQuestions.length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <h3 className="font-semibold text-sm mb-2">
                    الأسئلة المضافة ({draftQuestions.length})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
                    {draftQuestions.map((q, index) => (
                      <div
                        key={q.id}
                        className="flex items-start justify-between gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                      >
                        <div className="flex-1 text-right">
                          <div className="font-medium mb-1">
                            {index + 1}. {q.content}
                          </div>
                          <div className="flex flex-wrap gap-2 text-gray-600">
                            {q.options?.map((opt: string, idx: number) => (
                              <span
                                key={idx}
                                className={`px-2 py-0.5 rounded-full border text-[11px] ${
                                  opt === q.correctAnswer
                                    ? 'bg-green-50 border-green-300 text-green-700'
                                    : 'bg-white border-gray-300'
                                }`}
                              >
                                {opt}
                              </span>
                            ))}
                            <span className="ml-auto text-gray-500">الدرجة: {q.marks}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(q.id)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500 space-y-4">
            <p>لا توجد امتحانات لهذا الكورس حتى الآن.</p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary/90"
            >
              <FaPlus />
              إضافة أول امتحان للكورس
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-xl shadow flex items-center justify-between p-4"
              >
                <div>
                  <h2 className="font-bold text-lg mb-1">{exam.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <FaClock />
                      <span>{exam.duration} دقيقة</span>
                    </span>
                    <span>
                      عدد الأسئلة: {exam.questions?.length || 0}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
                    onClick={() => handleLoadResults(exam.id)}
                  >
                    <FaUsers />
                    نتائج الطلاب
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 text-sm bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition flex items-center gap-1"
                    onClick={() => handleResetExamForAllStudents(exam.id)}
                  >
                    إعادة الامتحان لكل الطلاب
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center gap-1"
                    onClick={() => handleDeleteExam(exam.id)}
                  >
                    <FaTrash />
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {resultsExamId && (
          <div className="mt-8 bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FaUsers className="text-primary" />
                <h2 className="text-lg font-bold">نتائج الطلاب للامتحان المحدد</h2>
              </div>
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setResultsExamId(null);
                  setResults([]);
                }}
              >
                إخفاء النتائج
              </button>
            </div>

            {loadingResults ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : results.length === 0 ? (
              <p className="text-sm text-gray-500">
                لا توجد محاولات مسجلة بعد لهذا الامتحان.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">الطالب</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">البريد الإلكتروني</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">الدرجة</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">الحالة</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">التاريخ</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {results.map((r) => {
                      const currentExam = exams.find((e) => e.id === resultsExamId) || null;
                      return (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap">{r.studentName}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-gray-500">{r.email}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {r.score} / 100
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                                r.cheated
                                  ? 'bg-yellow-50 text-yellow-700'
                                  : r.passed
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {r.cheated ? (
                                <FaTimes />
                              ) : r.passed ? (
                                <FaCheckCircle />
                              ) : (
                                <FaTimes />
                              )}
                              {r.cheated ? 'محاولة غش' : r.passed ? 'ناجح' : 'راسب'}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                            {r.attemptedAt
                              ? new Date(r.attemptedAt).toLocaleString('ar-EG')
                              : ''}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                type="button"
                                onClick={() => handleSendResultToParent(currentExam, r)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 text-xs"
                              >
                                <FaWhatsapp />
                                إرسال النتيجة لولي الأمر
                              </button>
                              {resultsExamId && (
                                <button
                                  type="button"
                                  onClick={() => handleResetExamForStudent(String(resultsExamId), r)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs"
                                >
                                  إعادة الامتحان
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
