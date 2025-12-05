const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const WorkboxPlugin = require('workbox-webpack-plugin');

/**
 * تكوين Webpack للأداء الفائق
 * Ultra Performance Webpack Configuration
 */

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    mode: isProduction ? 'production' : 'development',
    
    // ========================================
    // 1. نقاط الدخول المحسّنة
    // ========================================
    entry: {
      // تقسيم الكود لتحميل أسرع
      app: './src/index.js',
      vendor: ['react', 'react-dom', 'react-router-dom'],
      performance: './src/utils/performance.js'
    },
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction 
        ? 'js/[name].[contenthash:8].js' 
        : 'js/[name].js',
      chunkFilename: isProduction 
        ? 'js/[name].[contenthash:8].chunk.js' 
        : 'js/[name].chunk.js',
      publicPath: '/',
      clean: true
    },
    
    // ========================================
    // 2. التحسينات
    // ========================================
    optimization: {
      minimize: isProduction,
      minimizer: [
        // ضغط JavaScript
        new TerserPlugin({
          terserOptions: {
            parse: { ecma: 8 },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
              drop_console: isProduction,
              drop_debugger: isProduction,
              pure_funcs: ['console.log']
            },
            mangle: { safari10: true },
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true
            }
          },
          parallel: true
        }),
        
        // ضغط CSS
        new CssMinimizerPlugin({
          minimizerOptions: {
            preset: [
              'default',
              {
                discardComments: { removeAll: true },
                normalizeUnicode: false
              }
            ]
          }
        })
      ],
      
      // تقسيم الكود الذكي
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true
          },
          
          // React components
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
            name: 'react',
            priority: 20
          },
          
          // UI Components
          ui: {
            test: /[\\/]src[\\/]components[\\/]/,
            name: 'ui',
            priority: 5,
            minSize: 0
          },
          
          // Utilities
          utils: {
            test: /[\\/]src[\\/]utils[\\/]/,
            name: 'utils',
            priority: 5,
            minSize: 0
          },
          
          // Common chunks
          common: {
            minChunks: 2,
            priority: -10,
            reuseExistingChunk: true
          }
        }
      },
      
      // Runtime chunk منفصل
      runtimeChunk: {
        name: 'runtime'
      },
      
      // Module IDs ثابتة للكاش
      moduleIds: 'deterministic'
    },
    
    // ========================================
    // 3. القواعد والمحملات
    // ========================================
    module: {
      rules: [
        // JavaScript/JSX
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: '> 0.25%, not dead',
                  useBuiltIns: 'usage',
                  corejs: 3
                }],
                ['@babel/preset-react', {
                  runtime: 'automatic'
                }]
              ],
              plugins: [
                '@babel/plugin-syntax-dynamic-import',
                '@babel/plugin-proposal-class-properties',
                isProduction && 'transform-remove-console'
              ].filter(Boolean),
              cacheDirectory: true
            }
          }
        },
        
        // CSS
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                modules: {
                  auto: true,
                  localIdentName: isProduction 
                    ? '[hash:base64:5]' 
                    : '[name]__[local]--[hash:base64:5]'
                }
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    'postcss-preset-env',
                    'autoprefixer',
                    isProduction && 'cssnano'
                  ].filter(Boolean)
                }
              }
            }
          ]
        },
        
        // الصور
        {
          test: /\.(png|jpg|jpeg|gif|webp|avif)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024 // 8kb
            }
          },
          generator: {
            filename: 'images/[name].[hash:8][ext]'
          }
        },
        
        // الخطوط
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name].[hash:8][ext]'
          }
        },
        
        // SVG
        {
          test: /\.svg$/,
          use: ['@svgr/webpack', 'url-loader']
        }
      ]
    },
    
    // ========================================
    // 4. الإضافات
    // ========================================
    plugins: [
      // HTML
      new HtmlWebpackPlugin({
        template: './public/index.html',
        inject: true,
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true
        } : false
      }),
      
      // استخراج CSS
      isProduction && new MiniCssExtractPlugin({
        filename: 'css/[name].[contenthash:8].css',
        chunkFilename: 'css/[name].[contenthash:8].chunk.css'
      }),
      
      // ضغط Gzip/Brotli
      isProduction && new CompressionPlugin({
        filename: '[path][base].gz',
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 8192,
        minRatio: 0.8
      }),
      
      isProduction && new CompressionPlugin({
        filename: '[path][base].br',
        algorithm: 'brotliCompress',
        test: /\.(js|css|html|svg)$/,
        compressionOptions: { level: 11 },
        threshold: 8192,
        minRatio: 0.8
      }),
      
      // Service Worker
      isProduction && new WorkboxPlugin.GenerateSW({
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60 // 5 minutes
              }
            }
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          },
          {
            urlPattern: /\.(js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-cache'
            }
          }
        ]
      }),
      
      // تحليل الحزم
      process.env.ANALYZE && new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
        reportFilename: 'bundle-report.html'
      }),
      
      // متغيرات البيئة
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(argv.mode),
        'process.env.API_URL': JSON.stringify(process.env.API_URL || 'http://localhost:5000')
      }),
      
      // Progress
      new webpack.ProgressPlugin()
    ].filter(Boolean),
    
    // ========================================
    // 5. الحل والأداء
    // ========================================
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@styles': path.resolve(__dirname, 'src/styles'),
        '@assets': path.resolve(__dirname, 'src/assets')
      },
      // تسريع الحل
      symlinks: false,
      cacheWithContext: false
    },
    
    // ========================================
    // 6. خادم التطوير
    // ========================================
    devServer: {
      static: {
        directory: path.join(__dirname, 'public')
      },
      compress: true,
      hot: true,
      port: 3000,
      open: true,
      historyApiFallback: true,
      
      // تحسينات الأداء
      client: {
        overlay: {
          errors: true,
          warnings: false
        },
        progress: true
      },
      
      // Proxy للـ API
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true
        }
      }
    },
    
    // ========================================
    // 7. إعدادات الأداء
    // ========================================
    performance: {
      maxEntrypointSize: 512000, // 500kb
      maxAssetSize: 512000, // 500kb
      hints: isProduction ? 'warning' : false,
      assetFilter: (assetFilename) => {
        return !/\.(map|LICENSE)$/.test(assetFilename);
      }
    },
    
    // Cache
    cache: {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename]
      }
    },
    
    // Source Maps
    devtool: isProduction 
      ? 'hidden-source-map' 
      : 'eval-cheap-module-source-map',
    
    // Stats
    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false
    }
  };
};
