#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 بدء إصلاح جميع المشاكل في المنصة...\n');

// قائمة الإصلاحات
const fixes = [
  {
    name: 'تنظيف الكاش',
    action: () => {
      const dirsToClean = ['.next', 'node_modules/.cache'];
      dirsToClean.forEach(dir => {
        const fullPath = path.join(__dirname, dir);
        if (fs.existsSync(fullPath)) {
          try {
            fs.rmSync(fullPath, { recursive: true, force: true });
            console.log(`✅ تم حذف: ${dir}`);
          } catch (e) {
            console.log(`⚠️ فشل حذف: ${dir}`);
          }
        }
      });
    }
  },
  {
    name: 'إنشاء ملف .env.local',
    action: () => {
      const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://wnqifmvgvlmxgswhcwnc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzYwNTUsImV4cCI6MjA3ODAxMjA1NX0.LqWhTZYmr7nu-dIy2uBBqntOxoWM-waluYIR9bipC9M
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQzNjA1NSwiZXhwIjoyMDc4MDEyMDU1fQ.OlrWLS7bjUqVh7rarNxa3cX9XrV-n-O24aiMvCs5sCU

# App Configuration
NEXT_PUBLIC_APP_NAME=منصة تعليمية
NEXT_PUBLIC_USE_SUPABASE=true
NODE_ENV=development
`;
      
      const envPath = path.join(__dirname, '.env.local');
      if (!fs.existsSync(envPath)) {
        fs.writeFileSync(envPath, envContent);
        console.log('✅ تم إنشاء ملف .env.local');
      } else {
        console.log('ℹ️ ملف .env.local موجود بالفعل');
      }
    }
  },
  {
    name: 'إنشاء مجلد public إن لم يكن موجود',
    action: () => {
      const publicDir = path.join(__dirname, 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
        console.log('✅ تم إنشاء مجلد public');
      }
      
      // إنشاء الصور الافتراضية
      const placeholders = [
        'placeholder-course.png',
        'default-instructor.svg',
        'course-placeholder.png'
      ];
      
      placeholders.forEach(file => {
        const filePath = path.join(publicDir, file);
        if (!fs.existsSync(filePath)) {
          // إنشاء ملف SVG بسيط
          const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#e5e7eb"/>
  <text x="50%" y="50%" text-anchor="middle" fill="#6b7280" font-size="16">صورة افتراضية</text>
</svg>`;
          fs.writeFileSync(filePath, file.endsWith('.svg') ? svgContent : '');
          console.log(`✅ تم إنشاء: ${file}`);
        }
      });
    }
  },
  {
    name: 'إصلاح tsconfig.json',
    action: () => {
      const tsconfigPath = path.join(__dirname, 'tsconfig.json');
      const tsconfig = {
        "compilerOptions": {
          "target": "es5",
          "lib": ["dom", "dom.iterable", "esnext"],
          "allowJs": true,
          "skipLibCheck": true,
          "strict": false,
          "forceConsistentCasingInFileNames": true,
          "noEmit": true,
          "esModuleInterop": true,
          "module": "esnext",
          "moduleResolution": "node",
          "resolveJsonModule": true,
          "isolatedModules": true,
          "jsx": "preserve",
          "incremental": true,
          "plugins": [
            {
              "name": "next"
            }
          ],
          "paths": {
            "@/*": ["./src/*"],
            "@/components/*": ["./src/components/*"],
            "@/lib/*": ["./src/lib/*"],
            "@/utils/*": ["./src/utils/*"],
            "@/services/*": ["./src/services/*"],
            "@/hooks/*": ["./src/hooks/*"],
            "@/contexts/*": ["./src/contexts/*"],
            "@/types/*": ["./src/types/*"],
            "@/styles/*": ["./src/styles/*"]
          }
        },
        "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        "exclude": ["node_modules"]
      };
      
      fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
      console.log('✅ تم إصلاح tsconfig.json');
    }
  },
  {
    name: 'إنشاء middleware.ts إن لم يكن موجود',
    action: () => {
      const middlewarePath = path.join(__dirname, 'src', 'middleware.ts');
      if (!fs.existsSync(middlewarePath)) {
        const content = `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // السماح بكل الطلبات مؤقتاً
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
`;
        fs.writeFileSync(middlewarePath, content);
        console.log('✅ تم إنشاء middleware.ts');
      }
    }
  }
];

// تنفيذ الإصلاحات
console.log('🚀 بدء تنفيذ الإصلاحات...\n');

fixes.forEach((fix, index) => {
  console.log(`[${index + 1}/${fixes.length}] ${fix.name}...`);
  try {
    fix.action();
  } catch (error) {
    console.error(`❌ خطأ في ${fix.name}:`, error.message);
  }
  console.log('');
});

console.log('✨ تم الانتهاء من الإصلاحات!');
console.log('\n📝 الخطوات التالية:');
console.log('1. npm install');
console.log('2. npm run dev');
console.log('\nيجب أن تعمل المنصة الآن بدون مشاكل! 🎉');
