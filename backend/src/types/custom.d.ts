declare module 'compression';
declare module 'response-time';

// تمديد واجهة Response لإصلاح خطأ TypeScript
declare namespace Express {
  interface Response {
    json: any;
  }
} 