/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true, // ✅ تفعيل للكشف عن الأخطاء المحتملة
    swcMinify: true,
    output: 'standalone', // إضافة لتحسين الأداء في الإنتاج
    poweredByHeader: false, // إزالة رأس Powered-By للأمان
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
    },
    images: {
        formats: ['image/avif', 'image/webp'],
        remotePatterns: [{
                protocol: 'https',
                hostname: 'chikfjvpkqtivtyhvvzt.supabase.co', // ✅ Supabase فقط (المشروع الجديد)
            },
            {
                protocol: 'https',
                hostname: '**.supabase.co', // ✅ أي Supabase subdomain
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com', // ✅ صور من Unsplash
            },
        ],
    },
    experimental: {
        optimizeCss: false, // تعطيل مؤقتاً لحل مشاكل التحميل
        scrollRestoration: true,
        optimizePackageImports: ['react-icons'],
    },
    webpack: (config, { isServer }) => {
        // حل مشاكل الـ chunks
        if (!isServer) {
            config.optimization.splitChunks = {
                chunks: 'all',
                cacheGroups: {
                    default: {
                        minChunks: 2,
                        priority: -20,
                        reuseExistingChunk: true,
                    },
                },
            };
        }
        return config;
    },
    // إعدادات التخزين المؤقت
    onDemandEntries: {
        // للتطوير فقط
        maxInactiveAge: 25 * 1000,
        pagesBufferLength: 5,
    },
    // إعدادات الأمان
    headers: async() => {
        return [{
            source: '/:path*',
            headers: [{
                    key: 'X-Content-Type-Options',
                    value: 'nosniff',
                },
                {
                    key: 'X-Frame-Options',
                    value: 'DENY',
                },
                {
                    key: 'X-XSS-Protection',
                    value: '1; mode=block',
                },
            ],
        }, ];
    },
    redirects: async() => {
        return [{
            source: '/admin',
            destination: '/admin/dashboard',
            permanent: false,
        }];
    },
}

module.exports = nextConfig