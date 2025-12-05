/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Performance optimizations
  images: {
    domains: ['wnqifmvgvlmxgswhcwnc.supabase.co'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  // Security Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' *.youtube.com *.ytimg.com;
              style-src 'self' 'unsafe-inline' fonts.googleapis.com;
              font-src 'self' fonts.gstatic.com;
              img-src 'self' data: blob: *.supabase.co *.ytimg.com;
              media-src 'self' *.youtube.com;
              connect-src 'self' *.supabase.co wss://*.supabase.co api.whatsapp.com;
              frame-src 'self' *.youtube.com;
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'none';
              upgrade-insecure-requests;
            `.replace(/\n/g, ' ').trim()
          }
        ]
      }
    ];
  },
  
  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    // Code splitting
    if (!isServer && !dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true
            },
            styles: {
              name: 'styles',
              test: /\.(css|scss)$/,
              chunks: 'all',
              enforce: true
            }
          }
        },
        runtimeChunk: {
          name: 'runtime'
        }
      };
    }
    
    // Bundle analyzer
    if (process.env.ANALYZE) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: './analyze.html',
          openAnalyzer: true
        })
      );
    }
    
    // Service Worker
    if (!isServer && !dev) {
      const { InjectManifest } = require('workbox-webpack-plugin');
      config.plugins.push(
        new InjectManifest({
          swSrc: './public/service-worker.js',
          swDest: '../public/service-worker.js',
          include: [/\.(js|css|html|json|png|jpg|jpeg|svg|ico)$/],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 // 5MB
        })
      );
    }
    
    return config;
  },
  
  // Compression
  compress: true,
  
  // Progressive Web App
  experimental: {
    optimizeCss: false, // Disable due to chunk loading issues
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    SENTRY_DSN: process.env.SENTRY_DSN,
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/panel',
        permanent: true,
      },
    ];
  },
  
  // Rewrites for API proxying
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://wnqifmvgvlmxgswhcwnc.supabase.co/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
