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

let stats: Stats = {
  totalStudents: 1200,
  totalCourses: 35,
  totalTeachers: 18,
  totalRevenue: 250000,
  newStudentsToday: 12,
  activeStudents: 540,
  pendingPayments: 9,
  completionRate: 64,
};

let transactions: Transaction[] = [
  { id: 'tx-1', studentName: 'طالب 1', courseTitle: 'رياضيات', amount: 200, date: new Date().toISOString(), status: 'pending', paymentMethod: 'vodafone_cash' },
  { id: 'tx-2', studentName: 'طالب 2', courseTitle: 'فيزياء', amount: 180, date: new Date().toISOString(), status: 'completed', paymentMethod: 'credit_card' },
];

let issues: Issue[] = [
  { id: 'is-1', title: 'مشكلة في تسجيل الدفع', description: 'إيصال غير واضح', type: 'payment', status: 'new', date: new Date().toISOString(), priority: 'medium' },
  { id: 'is-2', title: 'درس لا يفتح', description: 'محتوى الفيديو لا يعمل', type: 'technical', status: 'in-progress', date: new Date().toISOString(), priority: 'high' },
];

export function getStats() {
  return stats;
}

export function getTransactions() {
  return { transactions };
}

export function getIssues() {
  return { issues };
}

export function getCharts(period: string) {
  const labels = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];
  const revenue = { labels, data: [1000, 1200, 900, 1500, 1700, 1600] };
  const enrollment = { labels, data: [50, 65, 40, 80, 90, 85] };
  const paymentMethods = { labels: ['Vodafone Cash', 'Credit Card', 'Fawry'], data: [60, 30, 10] };
  return { revenue, enrollment, paymentMethods, period };
}

export function resolveIssue(id: string) {
  const idx = issues.findIndex((i) => i.id === id);
  if (idx === -1) return false;
  issues[idx] = { ...issues[idx], status: 'resolved' };
  return true;
}

export function updateTransaction(id: string, action: 'approve' | 'decline') {
  const idx = transactions.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  transactions[idx] = { ...transactions[idx], status: action === 'approve' ? 'completed' : 'failed' };
  if (action === 'approve') stats = { ...stats, totalRevenue: stats.totalRevenue + (transactions[idx].amount || 0), pendingPayments: Math.max(0, stats.pendingPayments - 1) };
  return true;
}