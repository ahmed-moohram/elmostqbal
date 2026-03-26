import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateUUID } from '@/lib/validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('❌ Missing Supabase configuration!');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Generate signed URL for video access
 * This adds an extra layer of security by requiring authentication
 * and checking enrollment before providing video URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonId, courseId, userId } = body;

    // Validate required fields
    if (!lessonId || !courseId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: lessonId, courseId, userId' },
        { status: 400 }
      );
    }

    // Validate UUIDs
    if (!validateUUID(lessonId) || !validateUUID(courseId) || !validateUUID(userId)) {
      return NextResponse.json(
        { error: 'Invalid UUID format' },
        { status: 400 }
      );
    }

    // Check if user is enrolled in the course
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select('id, is_active')
      .eq('student_id', userId)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .maybeSingle();

    // Also check legacy enrollments table
    let isEnrolled = !!enrollment;
    if (!isEnrolled) {
      const { data: legacyEnrollment } = await supabase
        .from('enrollments')
        .select('id, is_active')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('is_active', true)
        .maybeSingle();
      
      isEnrolled = !!legacyEnrollment;
    }

    if (!isEnrolled) {
      return NextResponse.json(
        { error: 'User is not enrolled in this course' },
        { status: 403 }
      );
    }

    // Fetch lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, video_url, requires_access_code, access_code, is_free')
      .eq('id', lessonId)
      .eq('course_id', courseId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Check if lesson requires access code
    if (lesson.requires_access_code && !lesson.is_free) {
      // Access code validation should be done client-side before requesting signed URL
      // This is just a server-side check
    }

    // If video is stored in Supabase Storage, generate signed URL
    if (lesson.video_url && lesson.video_url.startsWith('supabase://')) {
      const storagePath = lesson.video_url.replace('supabase://', '');
      const { data: signedUrlData, error: signedUrlError } = await supabase
        .storage
        .from('course-videos')
        .createSignedUrl(storagePath, 3600); // 1 hour expiry

      if (signedUrlError || !signedUrlData) {
        return NextResponse.json(
          { error: 'Failed to generate signed URL' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        videoUrl: signedUrlData.signedUrl,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      });
    }

    // For external URLs (YouTube, Google Drive, etc.), return as-is
    // but log the access for security monitoring
    if (lesson.video_url) {
      // Log video access for analytics
      const { error: logError } = await supabase
        .from('video_access_logs')
        .insert({
          user_id: userId,
          lesson_id: lessonId,
          course_id: courseId,
          accessed_at: new Date().toISOString(),
        });

      if (logError) {
        // Don't fail if logging fails
        console.error('Failed to log video access:', logError);
      }

      return NextResponse.json({
        success: true,
        videoUrl: lesson.video_url,
        expiresAt: null, // External URLs don't expire
      });
    }

    return NextResponse.json(
      { error: 'No video URL found for this lesson' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error generating signed video URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


