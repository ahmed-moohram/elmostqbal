@echo off
REM =============================================
REM Script to setup environment file for Educational Platform
REM =============================================

echo.
echo ===================================================
echo Setting up environment file for Educational Platform
echo ===================================================
echo.

REM Create .env file
(
echo # =============================================
echo # Supabase Configuration
echo # =============================================
echo NEXT_PUBLIC_SUPABASE_URL=https://wnqifmvgvlmxgswhcwnc.supabase.co
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzYwNTUsImV4cCI6MjA3ODAxMjA1NX0.LqWhTZYmr7nu-dIy2uBBqntOxoWM-waluYIR9bipC9M
echo SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQzNjA1NSwiZXhwIjoyMDc4MDEyMDU1fQ.OlrWLS7bjUqVh7rarNxa3cX9XrV-n-O24aiMvCs5sCU
echo.
echo # =============================================
echo # Authentication
echo # =============================================
echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
echo NEXTAUTH_URL=http://localhost:3000
echo NEXTAUTH_SECRET=your-nextauth-secret-key-change-this-in-production-2024
echo.
echo # =============================================
echo # Database
echo # =============================================
echo DATABASE_URL=postgresql://postgres:password@db.wnqifmvgvlmxgswhcwnc.supabase.co:5432/postgres
echo.
echo # =============================================
echo # API Configuration
echo # =============================================
echo NEXT_PUBLIC_API_URL=http://localhost:3000/api
echo NEXT_PUBLIC_USE_SUPABASE=true
echo.
echo # =============================================
echo # Payment Configuration ^(Vodafone Cash^)
echo # =============================================
echo NEXT_PUBLIC_VODAFONE_NUMBER=01070333143
echo NEXT_PUBLIC_VODAFONE_NAME=MR
echo.
echo # =============================================
echo # Application Settings
echo # =============================================
echo NEXT_PUBLIC_APP_NAME=المنصة التعليمية
echo NEXT_PUBLIC_APP_URL=http://localhost:3000
echo.
echo # =============================================
echo # Environment
echo # =============================================
echo NODE_ENV=development
) > frontend\.env

echo.
echo ===================================================
echo SUCCESS: .env file created at frontend\.env
echo ===================================================
echo.
echo IMPORTANT REMINDERS:
echo   1. Change JWT_SECRET and NEXTAUTH_SECRET in production
echo   2. Never upload .env file to GitHub
echo   3. Keep backup of your keys in a secure place
echo.
echo You can now run the project:
echo   cd frontend
echo   npm run dev
echo.
pause
