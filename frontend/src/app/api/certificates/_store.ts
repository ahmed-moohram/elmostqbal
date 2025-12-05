export type Cert = {
  _id: string;
  certificateNumber: string;
  issueDate: string;
  completionDate: string;
  grade?: number;
  status: 'issued' | 'pending' | 'revoked';
  courseId: { _id: string; title: string; description?: string; image?: string };
};

let certs: Cert[] = [
  { _id: 'c1', certificateNumber: 'CERT-123', issueDate: new Date().toISOString(), completionDate: new Date().toISOString(), grade: 95, status: 'issued', courseId: { _id: '1', title: 'رياضيات', description: 'أساسيات الجبر' } },
  { _id: 'c2', certificateNumber: 'CERT-456', issueDate: new Date().toISOString(), completionDate: new Date().toISOString(), grade: 88, status: 'issued', courseId: { _id: '2', title: 'فيزياء', description: 'ميكانيكا' } },
];

export function listStudentCertificates(_studentId?: string) {
  return certs;
}

export function getCert(id: string) {
  return certs.find((c) => c._id === id);
}

export function verifyCert(number: string) {
  const c = certs.find((x) => x.certificateNumber === number);
  return !!c;
}