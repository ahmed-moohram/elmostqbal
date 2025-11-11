@echo off
echo ========================================
echo Installing Security & Performance Packages
echo ========================================

echo.
echo Installing security packages...
npm install bcryptjs jsonwebtoken helmet express-rate-limit csrf dotenv --save

echo.
echo Installing performance packages...
npm install compression workbox-webpack-plugin @loadable/component react-intersection-observer --save

echo.
echo Installing monitoring packages...
npm install @sentry/nextjs web-vitals --save

echo.
echo Installing development tools...
npm install --save-dev @types/bcryptjs @types/jsonwebtoken lighthouse webpack-bundle-analyzer --save-dev

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Configure environment variables in .env.local
echo 2. Update next.config.js with security headers
echo 3. Initialize Sentry for error tracking
echo 4. Run performance audit: npm run analyze
echo.
pause
