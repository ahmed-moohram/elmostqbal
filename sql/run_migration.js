#!/usr/bin/env node

/**
 * سكريبت تشغيل التحويل من MongoDB إلى PostgreSQL/Supabase
 * Run Migration Script
 */

const MigrationTool = require('./migration_from_mongo');

// ========================================
// التكوين الافتراضي
// ========================================

const defaultConfig = {
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
        database: process.env.MONGO_DB_NAME || 'education_platform'
    },
    supabase: {
        url: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
        anonKey: process.env.SUPABASE_ANON_KEY || 'your-anon-key',
        serviceKey: process.env.SUPABASE_SERVICE_KEY || 'your-service-key'
    },
    options: {
        batchSize: 100,
        dryRun: false,
        verbose: true,
        continueOnError: true
    }
};

// ========================================
// معالج المعاملات
// ========================================

function parseArguments() {
    const args = process.argv.slice(2);
    const options = {};
    
    args.forEach(arg => {
        if (arg.startsWith('--')) {
            const [key, value] = arg.substring(2).split('=');
            options[key] = value;
        }
    });
    
    return options;
}

function printHelp() {
    console.log(`
استخدام: node run_migration.js [OPTIONS]

الخيارات:
  --mongoUri=URI          MongoDB connection URI
  --mongoDb=NAME          MongoDB database name
  --supabaseUrl=URL       Supabase project URL
  --supabaseKey=KEY       Supabase service key
  --dryRun=true/false     تشغيل تجريبي بدون حفظ (default: false)
  --batchSize=NUMBER      حجم الدفعة (default: 100)
  --help                  عرض هذه المساعدة

مثال:
  node run_migration.js --mongoUri=mongodb://localhost:27017 --mongoDb=mydb --supabaseUrl=https://xxx.supabase.co --supabaseKey=xxx

متغيرات البيئة:
  MONGODB_URI             MongoDB URI
  MONGO_DB_NAME          MongoDB database name
  SUPABASE_URL           Supabase URL
  SUPABASE_SERVICE_KEY   Supabase service key
`);
}

// ========================================
// التشغيل الرئيسي
// ========================================

async function main() {
    const options = parseArguments();
    
    // عرض المساعدة
    if (options.help) {
        printHelp();
        process.exit(0);
    }
    
    // تحديث التكوين
    const config = { ...defaultConfig };
    
    if (options.mongoUri) config.mongodb.uri = options.mongoUri;
    if (options.mongoDb) config.mongodb.database = options.mongoDb;
    if (options.supabaseUrl) config.supabase.url = options.supabaseUrl;
    if (options.supabaseKey) config.supabase.serviceKey = options.supabaseKey;
    if (options.dryRun !== undefined) config.options.dryRun = options.dryRun === 'true';
    if (options.batchSize) config.options.batchSize = parseInt(options.batchSize);
    
    console.log('🚀 بدء عملية التحويل من MongoDB إلى Supabase');
    console.log('⚙️ التكوين:');
    console.log(`   MongoDB: ${config.mongodb.uri}/${config.mongodb.database}`);
    console.log(`   Supabase: ${config.supabase.url}`);
    console.log(`   Dry Run: ${config.options.dryRun}`);
    console.log(`   Batch Size: ${config.options.batchSize}`);
    console.log('');
    
    // إنشاء أداة التحويل
    const migrator = new MigrationTool(config);
    
    // معالجة إيقاف البرنامج
    process.on('SIGINT', async () => {
        console.log('\n⚠️ تم إيقاف عملية التحويل...');
        await migrator.disconnect();
        process.exit(0);
    });
    
    // تشغيل التحويل
    try {
        await migrator.run();
        console.log('\n✅ تمت عملية التحويل بنجاح!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ فشلت عملية التحويل:', error);
        process.exit(1);
    }
}

// تشغيل البرنامج
if (require.main === module) {
    main();
}
