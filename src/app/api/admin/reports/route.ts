import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/lib/supabase-server';

function toIsoRange(from: string, to: string): { fromIso: string; toIso: string } {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new Error('Invalid date range');
  }

  return { fromIso: fromDate.toISOString(), toIso: toDate.toISOString() };
}

function isSuccessfulPayment(status: any): boolean {
  const s = String(status || '').toLowerCase();
  return ['approved', 'success', 'completed', 'paid'].includes(s);
}

type ReportResponse = {
  newRegistrations: number;
  revenue: number;
  coursesSold: number;
  growthRate: number | null;
  details: Array<{ date: string; registrations: number; revenue: number; courses: number }>;
  topCourses: Array<{ name: string; sales: number; revenue: number }>;
};

async function computeReport(fromIso: string, toIso: string): Promise<Omit<ReportResponse, 'growthRate'>> {
  const [studentsRes, paymentsRes, enrollmentsRes] = await Promise.all([
    supabase
      .from('users')
      .select('id, created_at')
      .eq('role', 'student')
      .gte('created_at', fromIso)
      .lte('created_at', toIso),
    supabase
      .from('payment_requests')
      .select('id, amount_paid, course_price, status, course_id, approved_at, created_at')
      .gte('created_at', fromIso)
      .lte('created_at', toIso),
    supabase
      .from('enrollments')
      .select('id, course_id, enrolled_at')
      .gte('enrolled_at', fromIso)
      .lte('enrolled_at', toIso),
  ]);

  const safeStudents = (studentsRes.data || []) as any[];
  const safePayments = (paymentsRes.data || []) as any[];
  const safeEnrollments = (enrollmentsRes.data || []) as any[];

  const successfulPayments = safePayments.filter((p: any) => isSuccessfulPayment(p.status));

  const newRegistrations = safeStudents.length;
  const revenue = successfulPayments.reduce(
    (sum: number, p: any) => sum + (Number(p.amount_paid ?? p.course_price ?? 0) || 0),
    0
  );

  const soldCourseIds = new Set<string>();
  successfulPayments.forEach((p: any) => {
    if (p.course_id) soldCourseIds.add(String(p.course_id));
  });
  safeEnrollments.forEach((e: any) => {
    if (e.course_id) soldCourseIds.add(String(e.course_id));
  });

  const coursesSold = soldCourseIds.size;

  const dayMap = new Map<string, { registrations: number; revenue: number; courses: Set<string> }>();

  const addDayEntry = (
    dateStr: string | null | undefined,
    updater: (entry: { registrations: number; revenue: number; courses: Set<string> }) => void
  ) => {
    if (!dateStr) return;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return;
    const dayKey = d.toISOString().slice(0, 10);
    if (!dayMap.has(dayKey)) {
      dayMap.set(dayKey, { registrations: 0, revenue: 0, courses: new Set<string>() });
    }
    updater(dayMap.get(dayKey)!);
  };

  safeStudents.forEach((s: any) => {
    addDayEntry(s.created_at, (entry) => {
      entry.registrations += 1;
    });
  });

  successfulPayments.forEach((p: any) => {
    const paymentDate = p.approved_at || p.created_at;
    addDayEntry(paymentDate, (entry) => {
      entry.revenue += Number(p.amount_paid ?? p.course_price ?? 0) || 0;
      if (p.course_id) entry.courses.add(String(p.course_id));
    });
  });

  safeEnrollments.forEach((e: any) => {
    addDayEntry(e.enrolled_at, (entry) => {
      if (e.course_id) entry.courses.add(String(e.course_id));
    });
  });

  const details = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      date,
      registrations: value.registrations,
      revenue: value.revenue,
      courses: value.courses.size,
    }));

  const courseRevenueMap = new Map<string, { revenue: number; sales: number }>();
  successfulPayments.forEach((p: any) => {
    if (!p.course_id) return;
    const courseId = String(p.course_id);
    const current = courseRevenueMap.get(courseId) || { revenue: 0, sales: 0 };
    current.revenue += Number(p.amount_paid ?? p.course_price ?? 0) || 0;
    current.sales += 1;
    courseRevenueMap.set(courseId, current);
  });

  let courseTitlesMap = new Map<string, string>();
  const courseIds = Array.from(courseRevenueMap.keys());

  if (courseIds.length > 0) {
    const { data: coursesData } = await supabase
      .from('courses')
      .select('id, title')
      .in('id', courseIds);

    courseTitlesMap = new Map((coursesData || []).map((c: any) => [String(c.id), String(c.title || '')]));
  }

  const topCourses = Array.from(courseRevenueMap.entries())
    .map(([courseId, info]) => ({
      name: courseTitlesMap.get(courseId) || 'دورة بدون اسم',
      sales: info.sales,
      revenue: info.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    newRegistrations,
    revenue,
    coursesSold,
    details,
    topCourses,
  };
}

export async function GET(request: NextRequest) {
  try {
    const roleCookie = request.cookies.get('user-role')?.value;
    if (roleCookie !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json({ error: 'from and to are required' }, { status: 400 });
    }

    const { fromIso, toIso } = toIsoRange(from, to);
    const report = await computeReport(fromIso, toIso);

    const rangeMs = new Date(toIso).getTime() - new Date(fromIso).getTime();
    const prevTo = new Date(new Date(fromIso).getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - rangeMs);

    const prevReport = await computeReport(prevFrom.toISOString(), prevTo.toISOString());

    let growthRate: number | null = null;
    if (prevReport.revenue > 0) {
      growthRate = Math.round(((report.revenue - prevReport.revenue) / prevReport.revenue) * 1000) / 10;
    }

    const response: ReportResponse = {
      ...report,
      growthRate,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/admin/reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
