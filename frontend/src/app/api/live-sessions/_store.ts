export type LiveSession = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  teacher: string;
  meetingUrl?: string;
  cancelled?: boolean;
};

let sessions: LiveSession[] = [
  { id: 'ls-1', title: 'مراجعة جبر', startTime: new Date(Date.now() + 3600_000).toISOString(), endTime: new Date(Date.now() + 7200_000).toISOString(), teacher: 'أستاذ أحمد' },
  { id: 'ls-2', title: 'فيزياء تطبيقية', startTime: new Date(Date.now() + 10800_000).toISOString(), endTime: new Date(Date.now() + 14400_000).toISOString(), teacher: 'أستاذة ليلى' },
];

export function upcoming() {
  return sessions.filter((s) => !s.cancelled);
}

export function join(id: string) {
  const s = sessions.find((x) => x.id === id);
  if (!s || s.cancelled) return null;
  s.meetingUrl = s.meetingUrl || `https://meet.example.com/${id}`;
  return s.meetingUrl;
}

export function leave(_id: string) {
  return true;
}

export function cancel(id: string) {
  const s = sessions.find((x) => x.id === id);
  if (!s) return false;
  s.cancelled = true;
  return true;
}