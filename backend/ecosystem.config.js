module.exports = {
  apps: [{
    name: 'edufutura-api',
    script: 'dist/index.js',
    instances: 'max', // استخدام أقصى عدد من المعالجات
    exec_mode: 'cluster', // تشغيل بنظام cluster
    autorestart: true, // إعادة تشغيل تلقائية عند الفشل
    watch: false, // عدم مراقبة التغييرات في وضع الإنتاج
    max_memory_restart: '1G', // إعادة التشغيل إذا تجاوزت الذاكرة 1GB
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 5000,
    }
  }]
}; 