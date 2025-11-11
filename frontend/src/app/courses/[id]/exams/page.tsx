"use client";

import { useState, useEffect } from "react";
import { Exam, Question } from "../../../../types/exam";
import { useRouter, useParams } from "next/navigation";
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
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;

  // جلب الاختبارات للمادة
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}/exams`);
        const data = await response.json();
        setExams(data);
      } catch (error) {
        console.error('Error fetching exams:', error);
      }
    };
    fetchExams();
  }, [courseId]);

  // بدء الاختبار
  const startExam = (exam: Exam) => {
    setSelectedExam(exam);
    setShowExamModal(true);
    setCurrentQuestion(0);
    setAnswers({});
    setTimeLeft(exam.duration * 60); // تحويل الدقائق إلى ثواني
    // بدء التوقيت العكسي
    const timer = setInterval(() => {
      setTimeLeft(prev => {
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
  const submitExam = async () => {
    if (!selectedExam) return;

    try {
      await fetch('/api/exams/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selectedExam.id,
          answers,
          courseId
        })
      });
      setShowExamModal(false);
      setSelectedExam(null);
    } catch (error) {
      console.error('Error submitting exam:', error);
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
          <div className="space-y-4">
            <p className="text-lg font-semibold">{question.content}</p>
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={answer === option}
                  onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'trueFalse':
        return (
          <div className="space-y-4">
            <p className="text-lg font-semibold">{question.content}</p>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={question.id}
                  value="true"
                  checked={answer === 'true'}
                  onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>صحيح</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={question.id}
                  value="false"
                  checked={answer === 'false'}
                  onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>خطأ</span>
              </label>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam) => (
          <motion.div
            key={exam.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            <div className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6">
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
                </div>
                <button
                  onClick={() => startExam(exam)}
                  className="px-6 py-3 bg-white text-primary font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <span className="flex items-center space-x-2">
                    <FaPlay className="text-primary" />
                    <span>بدء الاختبار</span>
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal لعرض الاختبار */}
      {showExamModal && selectedExam && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full relative"
          >
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setShowExamModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">{selectedExam.title}</h2>
              <div className="flex items-center space-x-2 text-gray-600">
                <FaClock />
                <span>{Math.floor(timeLeft / 60)}:{timeLeft % 60}</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-xl mb-8">
              {renderQuestion()}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  if (currentQuestion > 0) {
                    setCurrentQuestion(prev => prev - 1);
                  }
                }}
                disabled={currentQuestion === 0}
                className="flex items-center px-6 py-3 bg-gray-100 rounded-full hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                <FaArrowLeft className="mr-2" />
                السابق
              </button>
              <button
                onClick={() => {
                  if (currentQuestion < selectedExam.questions.length - 1) {
                    setCurrentQuestion(prev => prev + 1);
                  } else {
                    submitExam();
                  }
                }}
                className="flex items-center px-6 py-3 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
              >
                {currentQuestion < selectedExam.questions.length - 1 ? (
                  <>
                    التالي
                    <FaArrowRight className="ml-2" />
                  </>
                ) : (
                  <>
                    تسليم
                    <FaCheck className="ml-2" />
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 text-center text-gray-500">
              السؤال {currentQuestion + 1} من {selectedExam.questions.length}
            </div>
          </motion.div>
        </motion.div>
      )}
      {showExamModal && selectedExam && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white rounded-lg p-6 max-w-2xl w-full"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{selectedExam.title}</h2>
              <div className="flex items-center space-x-2">
                <FaClock />
                <span>{Math.floor(timeLeft / 60)}:{timeLeft % 60}</span>
              </div>
            </div>

            {renderQuestion()}

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => {
                  if (currentQuestion > 0) {
                    setCurrentQuestion(prev => prev - 1);
                  }
                }}
                disabled={currentQuestion === 0}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                السابق
              </button>
              <button
                onClick={() => {
                  if (currentQuestion < selectedExam.questions.length - 1) {
                    setCurrentQuestion(prev => prev + 1);
                  } else {
                    submitExam();
                  }
                }}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                {currentQuestion < selectedExam.questions.length - 1 ? 'التالي' : 'تسليم'}
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              السؤال {currentQuestion + 1} من {selectedExam.questions.length}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
