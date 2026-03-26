import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API Route for Automated Database Backup
 * ========================================
 * يجب حماية هذا الـ Route بـ Authentication
 * يمكن استخدامه مع Vercel Cron Jobs أو Scheduled Tasks
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Secret key for backup API (يجب تغييره في Production)
const BACKUP_SECRET = process.env.BACKUP_SECRET || 'change-this-in-production';

export async function GET(request: NextRequest) {
  try {
    // Verify secret key
    const authHeader = request.headers.get('authorization');
    const secret = authHeader?.replace('Bearer ', '') || request.nextUrl.searchParams.get('secret');

    if (secret !== BACKUP_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Important tables to backup
    const tables = [
      'users',
      'courses',
      'sections',
      'lessons',
      'course_enrollments',
      'exams',
      'quiz_results',
      'certificates',
      'messages',
      'notifications',
      'payment_requests',
      'achievements',
    ];

    const backupData: Record<string, any> = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      tables: {},
    };

    // Fetch data from each table
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(10000); // Limit to prevent memory issues

        if (error) {
          console.error(`Error backing up table ${table}:`, error);
          backupData.tables[table] = { error: error.message };
        } else {
          backupData.tables[table] = data || [];
        }
      } catch (err: any) {
        console.error(`Error backing up table ${table}:`, err);
        backupData.tables[table] = { error: err.message };
      }
    }

    // Return backup data (in production, save to file or cloud storage)
    return NextResponse.json({
      success: true,
      backup: backupData,
      message: 'Backup completed successfully',
    });
  } catch (error: any) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { error: error.message || 'Backup failed' },
      { status: 500 }
    );
  }
}


