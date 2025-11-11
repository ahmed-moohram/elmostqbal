#!/bin/bash

# =============================================
# سكريبت إعداد ملف البيئة للمنصة التعليمية
# =============================================

echo "🚀 إعداد ملف البيئة للمنصة التعليمية..."

# إنشاء ملف .env
cat > frontend/.env << 'EOF'
# =============================================
# Supabase Configuration
# =============================================
NEXT_PUBLIC_SUPABASE_URL=https://wnqifmvgvlmxgswhcwnc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzYwNTUsImV4cCI6MjA3ODAxMjA1NX0.LqWhTZYmr7nu-dIy2uBBqntOxoWM-waluYIR9bipC9M
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQzNjA1NSwiZXhwIjoyMDc4MDEyMDU1fQ.OlrWLS7bjUqVh7rarNxa3cX9XrV-n-O24aiMvCs5sCU

# =============================================
# Authentication
# =============================================
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-change-this-in-production-2024

# =============================================
# Database
# =============================================
DATABASE_URL=postgresql://postgres:password@db.wnqifmvgvlmxgswhcwnc.supabase.co:5432/postgres

# =============================================
# API Configuration
# =============================================
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_USE_SUPABASE=true

# =============================================
# Payment Configuration (Vodafone Cash)
# =============================================
NEXT_PUBLIC_VODAFONE_NUMBER=01070333143
NEXT_PUBLIC_VODAFONE_NAME=MR

# =============================================
# Application Settings
# =============================================
NEXT_PUBLIC_APP_NAME=المنصة التعليمية
NEXT_PUBLIC_APP_URL=http://localhost:3000

# =============================================
# Environment
# =============================================
NODE_ENV=development

# =============================================
# Optional: Email Service (for future use)
# =============================================
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password

# =============================================
# Optional: SMS Service (for future use)
# =============================================
# SMS_API_KEY=your-sms-api-key
# SMS_SENDER=YourPlatform

# =============================================
# Optional: Storage (for future use)
# =============================================
# AWS_ACCESS_KEY_ID=your-aws-access-key
# AWS_SECRET_ACCESS_KEY=your-aws-secret-key
# AWS_REGION=us-east-1
# S3_BUCKET=your-bucket-name

# =============================================
# Optional: Analytics (for future use)
# =============================================
# GA_TRACKING_ID=UA-XXXXXXXXX-X
# MIXPANEL_TOKEN=your-mixpanel-token

EOF

echo "✅ تم إنشاء ملف .env بنجاح في frontend/.env"
echo ""
echo "⚠️  تذكير مهم:"
echo "   1. قم بتغيير JWT_SECRET و NEXTAUTH_SECRET في الإنتاج"
echo "   2. لا ترفع ملف .env على GitHub أبداً"
echo "   3. احتفظ بنسخة احتياطية من المفاتيح في مكان آمن"
echo ""
echo "🚀 يمكنك الآن تشغيل المشروع:"
echo "   cd frontend"
echo "   npm run dev"
