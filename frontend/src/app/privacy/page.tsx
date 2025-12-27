'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import GlowingText from '../../components/GlowingText';

export default function PrivacyPage() {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h1 className="text-3xl font-bold mb-4">سياسة الخصوصية</h1>
            <p className="text-gray-600 dark:text-gray-400">
              آخر تحديث: 24 مايو 2025
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="prose dark:prose-dark max-w-none"
          >
            <h2 className="text-2xl font-bold mb-4">سياسة الخصوصية لأكاديمية <GlowingText text="المستقبل" className="inline-block" /></h2>
            
            <p className="mb-6">
              في أكاديمية المستقبل، نحن نقدر خصوصية زوارنا ومستخدمينا. تصف سياسة الخصوصية هذه أنواع المعلومات الشخصية التي نجمعها ونستخدمها، وكيف نحميها، ومع من قد نشاركها.
            </p>
            
            <p className="mb-6">
              باستخدام منصتنا، فإنك توافق على الممارسات الموضحة في سياسة الخصوصية هذه.
            </p>
            
            <h3 className="text-xl font-bold mt-8 mb-4">1. المعلومات التي نجمعها</h3>
            
            <h4 className="text-lg font-semibold mt-6 mb-3">معلومات التسجيل</h4>
            <p className="mb-4">
              عندما تقوم بالتسجيل في منصتنا، نقوم بجمع معلومات شخصية مثل:
            </p>
            <ul className="space-y-2 mb-4">
              <li>الاسم الكامل</li>
              <li>عنوان البريد الإلكتروني</li>
              <li>رقم الهاتف</li>
              <li>تاريخ الميلاد</li>
              <li>العنوان (اختياري)</li>
            </ul>
            
            <h4 className="text-lg font-semibold mt-6 mb-3">معلومات الدفع</h4>
            <p className="mb-4">
              عند شراء دورة تدريبية أو منتج، نجمع معلومات الدفع، بما في ذلك:
            </p>
            <ul className="space-y-2 mb-4">
              <li>تفاصيل بطاقة الدفع (يتم معالجتها بواسطة مزودي خدمة الدفع المعتمدين)</li>
              <li>عنوان الفواتير</li>
              <li>سجل المعاملات</li>
            </ul>
            
            <h4 className="text-lg font-semibold mt-6 mb-3">بيانات الاستخدام</h4>
            <p className="mb-4">
              نجمع بيانات حول كيفية تفاعلك مع منصتنا، بما في ذلك:
            </p>
            <ul className="space-y-2 mb-4">
              <li>الدورات التي تشاهدها</li>
              <li>تقدم التعلم الخاص بك</li>
              <li>الوقت الذي تقضيه على المنصة</li>
              <li>تفضيلات المحتوى الخاصة بك</li>
              <li>تفاعلاتك مع المحتوى والمستخدمين الآخرين</li>
            </ul>
            
            <h4 className="text-lg font-semibold mt-6 mb-3">البيانات الفنية</h4>
            <p className="mb-4">
              نجمع أيضًا بيانات فنية عندما تزور منصتنا، مثل:
            </p>
            <ul className="space-y-2 mb-4">
              <li>عنوان IP</li>
              <li>نوع المتصفح والإصدار</li>
              <li>نوع الجهاز ونظام التشغيل</li>
              <li>معلومات ملفات تعريف الارتباط</li>
              <li>بيانات الموقع الجغرافي التقريبي</li>
            </ul>
            
            <h3 className="text-xl font-bold mt-8 mb-4">2. كيف نستخدم معلوماتك</h3>
            
            <p className="mb-4">
              نستخدم المعلومات التي نجمعها للأغراض التالية:
            </p>
            
            <ul className="space-y-3 mb-6">
              <li>توفير خدماتنا وتحسينها وتخصيصها</li>
              <li>معالجة المدفوعات وإدارة الاشتراكات</li>
              <li>التواصل معك بشأن دوراتك وتحديثات المنصة</li>
              <li>تقديم الدعم الفني وخدمة العملاء</li>
              <li>تحليل استخدام المنصة وتحسين تجربة المستخدم</li>
              <li>إرسال رسائل تسويقية ذات صلة (إذا اخترت الاشتراك)</li>
              <li>منع الاحتيال وحماية أمن المنصة</li>
              <li>الامتثال للالتزامات القانونية</li>
            </ul>
            
            <h3 className="text-xl font-bold mt-8 mb-4">3. مشاركة المعلومات</h3>
            
            <p className="mb-4">
              قد نشارك معلوماتك الشخصية مع:
            </p>
            
            <ul className="space-y-3 mb-6">
              <li>
                <strong>مزودي الخدمة:</strong> شركات تساعدنا في تقديم خدماتنا (مثل معالجة الدفع، وتحليلات البيانات، وخدمة البريد الإلكتروني).
              </li>
              <li>
                <strong>الشركاء التعليميين:</strong> المدربين والمؤسسات التعليمية التي نتعاون معها لتقديم المحتوى.
              </li>
              <li>
                <strong>الجهات القانونية:</strong> عندما نكون ملزمين قانونًا بذلك، أو لحماية حقوقنا القانونية.
              </li>
            </ul>
            
            <p className="mb-4">
              لن نبيع معلوماتك الشخصية لأطراف ثالثة للأغراض التسويقية دون موافقتك الصريحة.
            </p>
            
            <h3 className="text-xl font-bold mt-8 mb-4">4. أمن البيانات</h3>
            
            <p className="mb-6">
              نحن نتخذ تدابير أمنية معقولة لحماية معلوماتك الشخصية من الفقدان أو سوء الاستخدام أو الوصول غير المصرح به. تشمل هذه التدابير التشفير، وجدران الحماية، وأنظمة الكشف عن التسلل.
            </p>
            
            <p className="mb-6">
              على الرغم من أننا نبذل قصارى جهدنا لحماية معلوماتك، لا يمكننا ضمان أمان البيانات المرسلة عبر الإنترنت بنسبة 100٪.
            </p>
            
            <h3 className="text-xl font-bold mt-8 mb-4">5. ملفات تعريف الارتباط</h3>
            
            <p className="mb-6">
              نستخدم ملفات تعريف الارتباط وتقنيات مماثلة لتحسين تجربتك وجمع معلومات حول كيفية استخدامك لمنصتنا. يمكنك ضبط متصفحك لرفض ملفات تعريف الارتباط، ولكن قد يؤدي ذلك إلى عدم عمل بعض أجزاء موقعنا بشكل صحيح.
            </p>
            
            <h3 className="text-xl font-bold mt-8 mb-4">6. حقوقك</h3>
            
            <p className="mb-4">
              اعتمادًا على موقعك، قد يكون لديك الحقوق التالية فيما يتعلق بمعلوماتك الشخصية:
            </p>
            
            <ul className="space-y-3 mb-6">
              <li>الوصول إلى معلوماتك وتصحيحها</li>
              <li>حذف معلوماتك (مع مراعاة بعض الاستثناءات)</li>
              <li>تقييد معالجة معلوماتك</li>
              <li>نقل معلوماتك (قابلية نقل البيانات)</li>
              <li>الاعتراض على معالجة معلوماتك</li>
              <li>سحب موافقتك في أي وقت</li>
            </ul>
            
            <p className="mb-4">
              لممارسة هذه الحقوق، يرجى الاتصال بنا عبر معلومات الاتصال أدناه.
            </p>
            
            <h3 className="text-xl font-bold mt-8 mb-4">7. تغييرات على سياسة الخصوصية</h3>
            
            <p className="mb-6">
              قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنخطرك بأي تغييرات جوهرية عن طريق نشر إشعار بارز على منصتنا أو عن طريق إرسال بريد إلكتروني إليك.
            </p>
            
            <h3 className="text-xl font-bold mt-8 mb-4">8. الاتصال بنا</h3>
            
            <p className="mb-4">
              إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى الاتصال بنا عبر:
            </p>
            
            <ul className="space-y-2 mb-6">
              <li>الهاتف: <a href="tel:+966500000000" className="text-primary hover:underline">+966 50 000 0000</a></li>
              <li>العنوان: الرياض، المملكة العربية السعودية، شارع الملك فهد، برج المستقبل، الطابق 15</li>
            </ul>
            
            <div className="mt-10 text-center">
              <Link 
                href="/"
                className="inline-block py-3 px-6 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
              >
                العودة إلى الصفحة الرئيسية
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
