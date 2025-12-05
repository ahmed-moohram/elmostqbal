'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import GlowingText from '../../components/GlowingText';

export default function TermsPage() {
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
            <h1 className="text-3xl font-bold mb-4">الشروط والأحكام</h1>
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
            <h2 className="text-2xl font-bold mb-4">مرحباً بك في أكاديمية <GlowingText text="المستقبل" className="inline-block" /></h2>
            
            <p className="mb-6">
              تحدد هذه الشروط والأحكام القواعد واللوائح الخاصة باستخدام موقع أكاديمية المستقبل التعليمية، الموجود على الإنترنت.
            </p>
            
            <p className="mb-6">
              من خلال الوصول إلى هذا الموقع، نفترض أنك تقبل هذه الشروط والأحكام بالكامل. لا تستمر في استخدام أكاديمية المستقبل إذا كنت لا توافق على جميع الشروط والأحكام المذكورة في هذه الصفحة.
            </p>
            
            <h3 className="text-xl font-bold mt-8 mb-4">1. التعريفات</h3>
            
            <ul className="space-y-3 mb-6">
              <li>
                <strong>المستخدم:</strong> الشخص الذي يقوم بالتسجيل والوصول إلى المنصة لاستخدام خدماتها.
              </li>
              <li>
                <strong>المحتوى:</strong> جميع المواد المتاحة على المنصة، بما في ذلك النصوص والصور ومقاطع الفيديو والمواد التعليمية.
              </li>
              <li>
                <strong>الاشتراك:</strong> العملية التي يدفع من خلالها المستخدم رسوماً للوصول إلى محتوى أو خدمات محددة.
              </li>
            </ul>
            
            <h3 className="text-xl font-bold mt-8 mb-4">2. التسجيل والحسابات</h3>
            
            <p className="mb-4">
              عند التسجيل في منصتنا، يجب عليك تقديم معلومات دقيقة وكاملة وحالية. عدم القيام بذلك يعتبر خرقاً للشروط، مما قد يؤدي إلى الإنهاء الفوري لحسابك.
            </p>
            
            <p className="mb-4">
              أنت مسؤول عن الحفاظ على سرية حسابك وكلمة المرور، وعن تقييد الوصول إلى جهاز الكمبيوتر الخاص بك. وبالتالي، فإنك توافق على تحمل المسؤولية عن جميع الأنشطة التي تحدث تحت حسابك أو كلمة المرور الخاصة بك.
            </p>
            
            <h3 className="text-xl font-bold mt-8 mb-4">3. الملكية الفكرية</h3>
            
            <p className="mb-4">
              المحتوى المتوفر على منصتنا، بما في ذلك على سبيل المثال لا الحصر، النصوص والرسومات والشعارات والصور ومقاطع الفيديو والدورات التدريبية، هو ملك لأكاديمية المستقبل ومحمي بموجب قوانين حقوق النشر والعلامات التجارية.
            </p>
            
            <p className="mb-4">
              لا يجوز استخدام أي جزء من المحتوى الموجود على منصتنا لأي غرض تجاري دون الحصول على إذن صريح منا.
            </p>
            
            <h3 className="text-xl font-bold mt-8 mb-4">4. اشتراكات الدورات والمدفوعات</h3>
            
            <p className="mb-4">
              عند شراء اشتراك في دورة تدريبية، فإنك توافق على دفع الرسوم المحددة لهذه الدورة. جميع المدفوعات نهائية ولا يمكن استردادها إلا في الحالات المنصوص عليها في سياسة الاسترداد.
            </p>
            
            <p className="mb-4">
              نحتفظ بالحق في تغيير أسعار الاشتراك في أي وقت، ولكن سيتم إخطارك بأي تغييرات في الأسعار قبل أن تؤثر عليك.
            </p>
            
            <h3 className="text-xl font-bold mt-8 mb-4">5. سلوك المستخدم</h3>
            
            <p className="mb-4">
              كمستخدم للمنصة، فإنك توافق على عدم:
            </p>
            
            <ul className="space-y-3 mb-6">
              <li>انتحال شخصية أي شخص أو كيان آخر.</li>
              <li>نشر أو تحميل أي محتوى غير قانوني أو ضار أو مسيء أو مضايق أو تشهيري أو فاحش.</li>
              <li>نشر أو تحميل أي محتوى ينتهك حقوق الملكية الفكرية لأي طرف.</li>
              <li>استخدام المنصة لأي غرض غير قانوني أو غير مصرح به.</li>
              <li>تعطيل أو إضعاف أداء المنصة أو خوادمها.</li>
            </ul>
            
            <h3 className="text-xl font-bold mt-8 mb-4">6. تعديل الشروط</h3>
            
            <p className="mb-4">
              نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سنبذل جهداً معقولاً لإبلاغك بأي تغييرات جوهرية، ولكن يجب عليك مراجعة هذه الصفحة بانتظام للتأكد من أنك على علم بأي تغييرات.
            </p>
            
            <h3 className="text-xl font-bold mt-8 mb-4">7. الاتصال بنا</h3>
            
            <p className="mb-4">
              إذا كان لديك أي أسئلة حول هذه الشروط والأحكام، يرجى الاتصال بنا عبر:
            </p>
            
            <ul className="space-y-2 mb-6">
              <li>البريد الإلكتروني: <a href="mailto:info@edufutura.com" className="text-primary hover:underline">info@edufutura.com</a></li>
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
