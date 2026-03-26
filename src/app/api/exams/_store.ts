export type ExamQuestion = {
  id: string;
  type: 'multipleChoice' | 'trueFalse' | 'fillIn' | 'matching';
  content?: string;
  question?: string;
  options?: string[];
  correctAnswer?: any;
  marks?: number;
};

export type ExamItem = {
  id: string;
  title: string;
  courseId: string;
  description?: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  questions: ExamQuestion[];
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
};

let exams: ExamItem[] = [
  {
    id: '1',
    title: 'امتحان منتصف الفصل - جبر',
    courseId: '1',
    description: 'امتحان منتصف الفصل الدراسي في مادة الجبر للثانوية العامة',
    duration: 60,
    totalMarks: 50,
    passingMarks: 25,
    questions: [
      {
        id: 'q1-1',
        question: 'حل المعادلة التالية: 2x + 5 = 15',
        options: ['x = 5', 'x = 7', 'x = 10', 'x = 12'],
        correctAnswer: 'x = 5',
        marks: 5,
        type: 'multipleChoice',
      },
      {
        id: 'q1-2',
        question:
          'ما هو حاصل ضرب المصفوفتين [[1, 2], [3, 4]] و [[2, 0], [1, 3]]؟',
        options: [
          '[[4, 6], [10, 12]]',
          '[[4, 3], [10, 9]]',
          '[[3, 6], [7, 12]]',
          '[[4, 6], [10, 18]]',
        ],
        correctAnswer: '[[4, 6], [10, 12]]',
        marks: 10,
        type: 'multipleChoice',
      },
      {
        id: 'q1-3',
        question: 'أوجد قيمة المحدد للمصفوفة [[3, 5], [1, 2]]',
        options: ['1', '6', '5', '7'],
        correctAnswer: '1',
        marks: 5,
        type: 'multipleChoice',
      },
      {
        id: 'q1-4',
        question: 'ما هي درجة كثيرة الحدود x³ + 2x² - 4x + 7؟',
        options: ['1', '2', '3', '4'],
        correctAnswer: '3',
        marks: 5,
        type: 'multipleChoice',
      },
      {
        id: 'q1-5',
        question:
          'ما هو الحد العام للمتتالية الحسابية التي الحد الأول فيها 3 والفرق المشترك 4؟',
        options: [
          'aₙ = 3 + 4(n-1)',
          'aₙ = 3 + 4n',
          'aₙ = 3(n-1) + 4',
          'aₙ = 3n + 4',
        ],
        correctAnswer: 'aₙ = 3 + 4(n-1)',
        marks: 10,
        type: 'multipleChoice',
      },
      {
        id: 'q1-6',
        question:
          'إذا كان f(x) = x² + 3x + 2 و g(x) = 2x - 1، فما هو (f ∘ g)(x)؟',
        options: [
          '(f ∘ g)(x) = 4x² - 4x + 3',
          '(f ∘ g)(x) = 4x² - 4x + 1',
          '(f ∘ g)(x) = 4x² - 4x + 2',
          '(f ∘ g)(x) = 4x² + 3x - 1',
        ],
        correctAnswer: '(f ∘ g)(x) = 4x² - 4x + 3',
        marks: 15,
        type: 'multipleChoice',
      },
    ],
    startDate: '2023-11-15T09:00:00Z',
    endDate: '2023-11-15T10:00:00Z',
    isActive: true,
  },
  {
    id: '2',
    title: 'امتحان نهاية الفصل - فيزياء',
    courseId: '2',
    description: 'امتحان نهاية الفصل الدراسي في مادة الفيزياء للثانوية العامة',
    duration: 90,
    totalMarks: 100,
    passingMarks: 50,
    questions: [
      {
        id: 'q2-1',
        question: 'ما هو قانون نيوتن الثاني للحركة؟',
        options: ['F = ma', 'F = mg', 'E = mc²', 'P = mv'],
        correctAnswer: 'F = ma',
        marks: 10,
        type: 'multipleChoice',
      },
      {
        id: 'q2-2',
        question: 'ما هي وحدة قياس الطاقة في النظام الدولي للوحدات؟',
        options: ['نيوتن', 'جول', 'واط', 'أمبير'],
        correctAnswer: 'جول',
        marks: 10,
        type: 'multipleChoice',
      },
      {
        id: 'q2-3',
        question: 'ما هو المقصود بظاهرة الحث الكهرومغناطيسي؟',
        options: [
          'توليد تيار كهربائي نتيجة تغير المجال المغناطيسي',
          'توليد مجال مغناطيسي نتيجة مرور تيار كهربائي',
          'انعكاس الضوء عن سطح معدني',
          'انكسار الضوء عند انتقاله بين وسطين',
        ],
        correctAnswer:
          'توليد تيار كهربائي نتيجة تغير المجال المغناطيسي',
        marks: 15,
        type: 'multipleChoice',
      },
      {
        id: 'q2-4',
        question: 'ما هو قانون أوم؟',
        options: ['V = IR', 'I = V/R', 'R = V/I', 'جميع ما سبق صحيح'],
        correctAnswer: 'جميع ما سبق صحيح',
        marks: 10,
        type: 'multipleChoice',
      },
      {
        id: 'q2-5',
        question:
          'ما هو التردد الذي يعطي طول موجي مقداره 2 متر إذا كانت سرعة الضوء 3×10⁸ م/ث؟',
        options: ['150 ميجاهرتز', '1.5×10⁸ هرتز', '1.5 ميجاهرتز', '150×10⁸ هرتز'],
        correctAnswer: '150 ميجاهرتز',
        marks: 15,
        type: 'multipleChoice',
      },
    ],
    startDate: '2023-12-20T10:00:00Z',
    endDate: '2023-12-20T11:30:00Z',
    isActive: true,
  },
  {
    id: '3',
    title: 'امتحان قصير - أحياء',
    courseId: '3',
    description: 'امتحان قصير في مادة الأحياء للثانوية العامة',
    duration: 30,
    totalMarks: 30,
    passingMarks: 15,
    questions: [
      {
        id: 'q3-1',
        question: 'ما هي الوحدة الأساسية لبناء الكائنات الحية؟',
        options: ['الذرة', 'الخلية', 'الجزيء', 'النسيج'],
        correctAnswer: 'الخلية',
        marks: 5,
        type: 'multipleChoice',
      },
      {
        id: 'q3-2',
        question: 'أي من الآتي ليس من وظائف الجهاز الهضمي؟',
        options: [
          'هضم الطعام',
          'امتصاص العناصر الغذائية',
          'نقل الأكسجين إلى الخلايا',
          'التخلص من الفضلات',
        ],
        correctAnswer: 'نقل الأكسجين إلى الخلايا',
        marks: 5,
        type: 'multipleChoice',
      },
      {
        id: 'q3-3',
        question: 'ما هو دور الهيموجلوبين في الدم؟',
        options: ['نقل الأكسجين', 'تخثر الدم', 'محاربة العدوى', 'تنظيم درجة حرارة الجسم'],
        correctAnswer: 'نقل الأكسجين',
        marks: 5,
        type: 'multipleChoice',
      },
      {
        id: 'q3-4',
        question: 'ما هو التمثيل الضوئي؟',
        options: [
          'عملية تحويل الطاقة الضوئية إلى طاقة كيميائية',
          'عملية تحويل الطاقة الكيميائية إلى طاقة حركية',
          'عملية التنفس الخلوي',
          'عملية انقسام الخلايا',
        ],
        correctAnswer:
          'عملية تحويل الطاقة الضوئية إلى طاقة كيميائية',
        marks: 5,
        type: 'multipleChoice',
      },
      {
        id: 'q3-5',
        question: 'ما هو الفرق بين الحمض النووي DNA والحمض النووي RNA؟',
        options: [
          'DNA يحتوي على سكر الرايبوز بينما RNA يحتوي على سكر الديوكسي رايبوز',
          'RNA يحتوي على سكر الرايبوز بينما DNA يحتوي على سكر الديوكسي رايبوز',
          'DNA أحادي الشريط بينما RNA ثنائي الشريط',
          'لا يوجد فرق بينهما',
        ],
        correctAnswer:
          'RNA يحتوي على سكر الرايبوز بينما DNA يحتوي على سكر الديوكسي رايبوز',
        marks: 10,
        type: 'multipleChoice',
      },
    ],
    startDate: '2023-11-10T13:00:00Z',
    endDate: '2023-11-10T13:30:00Z',
    isActive: false,
  },
];

export function getExams() {
  return exams;
}

export function getExam(id: string) {
  return exams.find((e) => e.id === id);
}

export function addExam(newExam: ExamItem) {
  exams.push(newExam);
  return newExam;
}

export function updateExam(id: string, updates: Partial<ExamItem>) {
  const idx = exams.findIndex((e) => e.id === id);
  if (idx === -1) return undefined;
  exams[idx] = { ...exams[idx], ...updates } as ExamItem;
  return exams[idx];
}

export function deleteExam(id: string) {
  const before = exams.length;
  exams = exams.filter((e) => e.id !== id);
  return exams.length < before;
}