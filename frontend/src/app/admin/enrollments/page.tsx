"use client";
import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaTimesCircle, FaSearch, FaUserCircle, FaBookOpen } from "react-icons/fa";
import AdminLayout from "../../../components/AdminLayout";
import Link from "next/link";
import userStorage from "@/services/userStorage";

interface EnrollmentRequest {
  _id: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  studentEmail: string;
  studentAvatar?: string;
  courseTitle: string;
  courseId: string;
  paymentStatus: "paid" | "pending" | "failed";
  requestStatus: "pending" | "accepted" | "rejected";
  requestDate: string;
  createdAt: string;
}

export default function EnrollmentRequestsPage() {
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "rejected">("pending");

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const token = userStorage.getAuthToken();
        if (!token) {
          setError("غير مصرح به. الرجاء تسجيل الدخول");
          setLoading(false);
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/enrollments`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error(`فشل جلب طلبات الاشتراك: ${res.status}`);
        }

        const data = await res.json();
        
        // تحويل البيانات إلى الشكل المطلوب
        const formattedRequests = data.enrollments.map((enrollment: any) => ({
          _id: enrollment._id,
          studentId: enrollment.student._id,
          studentName: enrollment.student.name,
          studentPhone: enrollment.student.phone || 'غير متوفر',
          studentEmail: enrollment.student.email,
          studentAvatar: enrollment.student.avatar,
          courseTitle: enrollment.course.title,
          courseId: enrollment.course._id,
          paymentStatus: enrollment.paymentStatus,
          requestStatus: enrollment.status,
          requestDate: new Date(enrollment.createdAt).toISOString().split('T')[0],
          createdAt: enrollment.createdAt
        }));

        setRequests(formattedRequests);
      } catch (err) {
        console.error('خطأ في تحميل طلبات الاشتراك:', err);
        setError("تعذر تحميل طلبات الاشتراك. يرجى المحاولة مرة أخرى لاحقًا.");
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, []);

  const handleAccept = async (id: string) => {
    try {
      const token = userStorage.getAuthToken();
      if (!token) {
        setError("غير مصرح به. الرجاء تسجيل الدخول");
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/enrollments/${id}/accept`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`فشل قبول الطلب: ${res.status}`);
      }

      // تحديث حالة الطلب محليًا
      setRequests((prev) =>
        prev.map((req) =>
          req._id === id ? { ...req, requestStatus: "accepted" } : req
        )
      );
    } catch (err) {
      console.error('خطأ في قبول الطلب:', err);
      setError("تعذر قبول الطلب. يرجى المحاولة مرة أخرى لاحقًا.");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const token = userStorage.getAuthToken();
      if (!token) {
        setError("غير مصرح به. الرجاء تسجيل الدخول");
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/enrollments/${id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`فشل رفض الطلب: ${res.status}`);
      }

      // تحديث حالة الطلب محليًا
      setRequests((prev) =>
        prev.map((req) =>
          req._id === id ? { ...req, requestStatus: "rejected" } : req
        )
      );
    } catch (err) {
      console.error('خطأ في رفض الطلب:', err);
      setError("تعذر رفض الطلب. يرجى المحاولة مرة أخرى لاحقًا.");
    }
  };

  const filteredRequests = requests.filter(
    (req) =>
      (filter === "all" || req.requestStatus === filter) &&
      (req.studentName.toLowerCase().includes(search.toLowerCase()) || 
       req.courseTitle.toLowerCase().includes(search.toLowerCase()) || 
       req.studentEmail.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto py-10">
        <h1 className="text-3xl font-bold mb-8 text-center text-primary drop-shadow-lg">طلبات اشتراك الطلاب في الدورات</h1>
        <div className="flex flex-wrap gap-3 items-center mb-6 justify-between">
          <div className="flex gap-2 items-center bg-white rounded-lg shadow px-3 py-2">
            <FaSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="بحث باسم الطالب أو الدورة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none border-0 bg-transparent text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${filter === "all" ? "bg-primary text-white" : "bg-white text-primary border-primary"}`}
              onClick={() => setFilter("all")}
            >
              الكل
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${filter === "pending" ? "bg-yellow-400 text-white" : "bg-white text-yellow-600 border-yellow-400"}`}
              onClick={() => setFilter("pending")}
            >
              قيد المراجعة
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${filter === "accepted" ? "bg-green-500 text-white" : "bg-white text-green-600 border-green-500"}`}
              onClick={() => setFilter("accepted")}
            >
              مقبول
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${filter === "rejected" ? "bg-red-500 text-white" : "bg-white text-red-600 border-red-500"}`}
              onClick={() => setFilter("rejected")}
            >
              مرفوض
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-2xl p-4 overflow-x-auto">
          {loading ? (
            <div className="text-center py-10 text-lg text-gray-500">جاري التحميل...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-10 text-lg text-gray-500">لا يوجد طلبات بهذا التصنيف.</div>
          ) : (
            <table className="w-full text-center">
              <thead>
                <tr className="bg-primary/10 text-primary text-lg">
                  <th className="py-3 px-2">#</th>
                  <th className="py-3 px-2">الطالب / رقم الهاتف / رقم الطالب</th>
                  <th className="py-3 px-2">الإيميل</th>
                  <th className="py-3 px-2">الدورة</th>
                  <th className="py-3 px-2">تاريخ الطلب</th>
                  <th className="py-3 px-2">الحالة</th>
                  <th className="py-3 px-2">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req, idx) => (
                  <tr key={req._id} className="border-b hover:bg-primary/5 transition">
                    <td className="py-2 px-2 font-bold">{idx + 1}</td>
                    <td className="py-2 px-2 flex flex-col items-center gap-1 justify-center">
  <div className="flex items-center gap-2">
    {req.studentAvatar ? (
      <img src={req.studentAvatar} alt={req.studentName} className="w-8 h-8 rounded-full object-cover border-2 border-primary shadow" />
    ) : (
      <FaUserCircle className="w-8 h-8 text-primary/80" />
    )}
    <span className="font-medium text-gray-800">{req.studentName}</span>
  </div>
  <span className="text-xs text-primary font-bold bg-primary/10 rounded px-2 py-0.5 mt-1">{req.studentPhone}</span>
  <span className="text-xs text-gray-700 font-bold bg-gray-100 rounded px-2 py-0.5 mt-1">رقم الطالب: {req.studentId}</span>
</td>
                    <td className="py-2 px-2 text-gray-600">{req.studentEmail}</td>
                    <td className="py-2 px-2 flex items-center gap-2 justify-center">
  <FaBookOpen className="text-accent" />
  <Link
    href={`/admin/courses/${req.courseId}`}
    className="text-accent font-bold underline underline-offset-2 hover:text-primary transition-colors cursor-pointer"
  >
    {req.courseTitle}
  </Link>
</td>
                    <td className="py-2 px-2 text-gray-500">{req.requestDate}</td>
                    <td className="py-2 px-2">
                      {req.requestStatus === "pending" && (
                        <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">قيد المراجعة</span>
                      )}
                      {req.requestStatus === "accepted" && (
                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">مقبول</span>
                      )}
                      {req.requestStatus === "rejected" && (
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">مرفوض</span>
                      )}
                    </td>
                    <td className="py-2 px-2">
                      {req.requestStatus === "pending" && (
                        <div className="flex gap-2 justify-center">
                          <button
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded-full shadow font-bold flex items-center gap-1"
                            onClick={() => handleAccept(req._id)}
                          >
                            <FaCheckCircle className="ml-1" /> قبول
                          </button>
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-full shadow font-bold flex items-center gap-1"
                            onClick={() => handleReject(req._id)}
                          >
                            <FaTimesCircle className="ml-1" /> رفض
                          </button>
                        </div>
                      )}
                      {req.requestStatus !== "pending" && (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
