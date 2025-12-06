import { createClient } from '@supabase/supabase-js';

export type Stats = {
  totalStudents: number;
  totalCourses: number;
  totalTeachers: number;
  totalRevenue: number;
  newStudentsToday: number;
  activeStudents: number;
  pendingPayments: number;
  completionRate: number;
};

export type Transaction = {
  id: string;
  studentName: string;
  courseTitle: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
};

export type Issue = {
  id: string;
  title: string;
  description: string;
  type: 'technical' | 'payment' | 'content';
  status: 'new' | 'in-progress' | 'resolved';
  date: string;
  priority: 'high' | 'medium' | 'low';
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration for admin dashboard. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const resolvedIssueIds = new Set<string>();

function mapPaymentStatusToTransactionStatus(status: string | null | undefined): Transaction['status'] {
  if (status === 'approved') return 'completed';
  if (status === 'rejected' || status === 'failed') return 'failed';
  return 'pending';
}

function mapNotificationTypeToIssueType(type: string | null | undefined): Issue['type'] {
  if (!type) return 'technical';
  if (type.includes('payment')) return 'payment';
  if (type.includes('content')) return 'content';
  return 'technical';
}

function normalizePriority(priority: string | null | undefined): Issue['priority'] {
  if (priority === 'high' || priority === 'medium' || priority === 'low') return priority;
  return 'medium';
}

function getDateRange(period: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString();
  const fromDate = new Date(now);

  switch (period) {
    case 'week':
      fromDate.setDate(fromDate.getDate() - 7);
      break;
    case 'year':
      fromDate.setFullYear(fromDate.getFullYear() - 1);
      break;
    default:
      fromDate.setDate(fromDate.getDate() - 30);
      break;
  }

  return { from: fromDate.toISOString(), to };
}

export async function getStats(): Promise<Stats> {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const [
      studentsRes,
      teachersRes,
      coursesRes,
      pendingPaymentsRes,
      newStudentsRes,
      activeEnrollmentsRes,
      allEnrollmentsRes,
      approvedPaymentsRes,
    ] = await Promise.all([
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student'),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'teacher'),
      supabase
        .from('courses')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('payment_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')
        .gte('created_at', startOfToday),
      supabase
        .from('enrollments')
        .select('user_id')
        .eq('is_active', true),
      supabase
        .from('enrollments')
        .select('id, progress'),
      supabase
        .from('payment_requests')
        .select('amount_paid, course_price, status')
        .eq('status', 'approved'),
    ]);

    const totalStudents = studentsRes.count ?? 0;
    const totalTeachers = teachersRes.count ?? 0;
    const totalCourses = coursesRes.count ?? 0;
    const pendingPayments = pendingPaymentsRes.count ?? 0;
    const newStudentsToday = newStudentsRes.count ?? 0;

    const activeEnrollments = activeEnrollmentsRes.data || [];
    const activeStudents = new Set((activeEnrollments as any[]).map((e: any) => e.user_id)).size;

    const enrollments = allEnrollmentsRes.data as any[] | null | undefined;
    const totalEnrollments = enrollments?.length ?? 0;
    const completedEnrollments = (enrollments || []).filter((e: any) => (e.progress ?? 0) >= 100).length;
    const completionRate = totalEnrollments === 0
      ? 0
      : Math.round((completedEnrollments / totalEnrollments) * 100);

    const approvedPayments = approvedPaymentsRes.data as any[] | null | undefined;
    const totalRevenue = (approvedPayments || []).reduce((sum: number, p: any) => {
      const amount = p.amount_paid ?? p.course_price ?? 0;
      return sum + (typeof amount === 'number' ? amount : 0);
    }, 0);

    return {
      totalStudents,
      totalCourses,
      totalTeachers,
      totalRevenue,
      newStudentsToday,
      activeStudents,
      pendingPayments,
      completionRate,
    };
  } catch (error) {
    console.error('Error fetching admin dashboard stats from Supabase:', error);
    return {
      totalStudents: 0,
      totalCourses: 0,
      totalTeachers: 0,
      totalRevenue: 0,
      newStudentsToday: 0,
      activeStudents: 0,
      pendingPayments: 0,
      completionRate: 0,
    };
  }
}

export async function getTransactions(): Promise<{ transactions: Transaction[] }> {
  try {
    const { data, error } = await supabase
      .from('payment_requests')
      .select('id, student_name, course_name, amount_paid, course_price, created_at, status')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const transactions: Transaction[] = (data || []).map((row: any) => ({
      id: String(row.id),
      studentName: row.student_name || 'طالب',
      courseTitle: row.course_name || 'دورة',
      amount: row.amount_paid ?? row.course_price ?? 0,
      date: row.created_at || new Date().toISOString(),
      status: mapPaymentStatusToTransactionStatus(row.status),
      paymentMethod: 'vodafone_cash',
    }));

    return { transactions };
  } catch (error) {
    console.error('Error fetching admin dashboard transactions from Supabase:', error);
    return { transactions: [] };
  }
}

export async function getIssues(): Promise<{ issues: Issue[] }> {
  try {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('id, title, message, type, priority, created_at, data')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const issues: Issue[] = (data || []).map((row: any) => {
      const id = String(row.id);
      const rowData = row.data || {};
      const persistedResolved =
        rowData && typeof rowData === 'object' && rowData.resolved === true;
      const isResolved = resolvedIssueIds.has(id) || persistedResolved;

      return {
        id,
        title: row.title || 'إشعار',
        description: row.message || '',
        type: mapNotificationTypeToIssueType(row.type),
        status: isResolved ? 'resolved' : 'new',
        date: row.created_at || new Date().toISOString(),
        priority: normalizePriority(row.priority),
      };
    });

    return { issues };
  } catch (error) {
    console.error('Error fetching admin dashboard issues from Supabase:', error);
    return { issues: [] };
  }
}

export async function getCharts(period: string) {
  try {
    const { from, to } = getDateRange(period);

    const { data, error } = await supabase
      .from('payment_requests')
      .select('amount_paid, course_price, status, created_at')
      .gte('created_at', from)
      .lte('created_at', to);

    if (error) throw error;

    const payments = (data || []) as any[];
    const approved = payments.filter((p) => p.status === 'approved');

    const revenueByDay = new Map<string, number>();
    const enrollByDay = new Map<string, number>();

    approved.forEach((p) => {
      if (!p.created_at) return;
      const dateKey = new Date(p.created_at).toISOString().slice(0, 10);
      const amount = p.amount_paid ?? p.course_price ?? 0;
      const safeAmount = typeof amount === 'number' ? amount : 0;

      revenueByDay.set(dateKey, (revenueByDay.get(dateKey) || 0) + safeAmount);
      enrollByDay.set(dateKey, (enrollByDay.get(dateKey) || 0) + 1);
    });

    const sortedKeys = Array.from(revenueByDay.keys()).sort();
    const labels = sortedKeys.map((key) => {
      const d = new Date(key);
      return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
    });

    const revenueData = sortedKeys.map((key) => revenueByDay.get(key) || 0);
    const enrollmentData = sortedKeys.map((key) => enrollByDay.get(key) || 0);

    const paymentMethods = {
      labels: ['Vodafone Cash'],
      data: [approved.length],
    };

    return {
      revenue: { labels, data: revenueData },
      enrollment: { labels, data: enrollmentData },
      paymentMethods,
      period,
    };
  } catch (error) {
    console.error('Error fetching admin dashboard charts from Supabase:', error);
    const labels = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];
    return {
      revenue: { labels, data: [0, 0, 0, 0, 0, 0] },
      enrollment: { labels, data: [0, 0, 0, 0, 0, 0] },
      paymentMethods: { labels: [], data: [] },
      period,
    };
  }
}

async function activateEnrollmentForPaymentRequest(paymentRequest: any, requestId: string) {
  const { data: studentData } = await supabase
    .from('users')
    .select('id')
    .eq('phone', paymentRequest.student_phone)
    .single();

  if (!studentData) return;

  const { data: existingEnrollment } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('student_id', studentData.id)
    .eq('course_id', paymentRequest.course_id)
    .maybeSingle();

  if (!existingEnrollment) {
    await supabase
      .from('course_enrollments')
      .insert({
        student_id: studentData.id,
        course_id: paymentRequest.course_id,
        payment_request_id: requestId,
        is_active: true,
        access_type: 'full',
      });
  } else {
    await supabase
      .from('course_enrollments')
      .update({
        is_active: true,
        payment_request_id: requestId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingEnrollment.id);
  }

  try {
    const { data: existingLegacyEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', studentData.id)
      .eq('course_id', paymentRequest.course_id)
      .maybeSingle();

    if (!existingLegacyEnrollment) {
      await supabase
        .from('enrollments')
        .insert({
          user_id: studentData.id,
          course_id: paymentRequest.course_id,
          progress: 0,
          is_active: true,
          enrolled_at: new Date().toISOString(),
        });
    } else {
      await supabase
        .from('enrollments')
        .update({
          is_active: true,
        })
        .eq('id', existingLegacyEnrollment.id);
    }
  } catch (legacyError) {
    console.error('Error syncing enrollments for achievements (updateTransaction):', legacyError);
  }

  try {
    await supabase
      .from('notifications')
      .insert({
        user_id: studentData.id,
        title: 'تم قبول طلب الاشتراك',
        message: `تم قبول طلب اشتراكك في كورس ${paymentRequest.course_name}`,
        type: 'payment',
        link: `/courses/${paymentRequest.course_id}`,
      });
  } catch (notifError) {
    console.error('Error creating approval notification (updateTransaction):', notifError);
  }
}

export async function resolveIssue(id: string): Promise<boolean> {
  const issueId = String(id);

  try {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('id, data')
      .eq('id', issueId)
      .maybeSingle();

    if (error || !data) {
      console.error('Error fetching issue for resolveIssue:', error);
      return false;
    }

    const currentData = (data as any).data || {};
    const newData = {
      ...currentData,
      resolved: true,
      resolved_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('admin_notifications')
      .update({ data: newData })
      .eq('id', issueId);

    if (updateError) {
      console.error('Error updating issue as resolved:', updateError);
      return false;
    }

    // نحفظه أيضًا في الذاكرة للجلسة الحالية لتحسين الأداء
    resolvedIssueIds.add(issueId);
    return true;
  } catch (err) {
    console.error('Unexpected error in resolveIssue:', err);
    return false;
  }
}

export async function updateTransaction(id: string, action: 'approve' | 'decline'): Promise<boolean> {
  try {
    const status = action === 'approve' ? 'approved' : 'rejected';

    const { data: paymentRequest, error: fetchError } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !paymentRequest) {
      console.error('Payment request not found in updateTransaction:', fetchError);
      return false;
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('payment_requests')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating payment request status in updateTransaction:', updateError);
      return false;
    }

    if (status === 'approved') {
      await activateEnrollmentForPaymentRequest(paymentRequest, id).catch((err) => {
        console.error('Error activating enrollment for payment request (updateTransaction):', err);
      });
    }

    return true;
  } catch (error) {
    console.error('Error in updateTransaction:', error);
    return false;
  }
}