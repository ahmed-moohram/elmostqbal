import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase environment variables are missing for admin courses content API");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const courseId = params.id;

  if (!courseId) {
    return NextResponse.json({ error: "Missing course id" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { courseUpdates, sections } = body || {};

    if (!courseUpdates) {
      return NextResponse.json({ error: "Missing courseUpdates in request body" }, { status: 400 });
    }

    // 1) تحديث بيانات الكورس الأساسية
    const updates: any = {
      title: courseUpdates.title,
      description: courseUpdates.description,
      short_description: courseUpdates.short_description,
      price: courseUpdates.price,
      category: courseUpdates.category,
      level: courseUpdates.level,
      preview_video: courseUpdates.preview_video,
      thumbnail: courseUpdates.thumbnail,
      is_published: courseUpdates.is_published,
      status: courseUpdates.is_published ? "published" : "draft",
      is_active: courseUpdates.is_published ? true : false,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedCourse, error: courseError } = await supabase
      .from("courses")
      .update(updates)
      .eq("id", courseId)
      .select("*")
      .single();

    if (courseError) {
      console.error("❌ خطأ في تحديث بيانات الكورس:", courseError);
      return NextResponse.json({ error: courseError.message }, { status: 500 });
    }

    // 2) مزامنة الأقسام والدروس بدون حذف شامل للحفاظ على IDs قدر الإمكان
    // - الأقسام الموجودة مع id يتم تحديثها فقط
    // - الأقسام الجديدة (بدون id) يتم إدخالها
    // - الأقسام التي حُذفت من الفورم يتم حذفها من قاعدة البيانات
    // ونفس المنطق يطبّق على الدروس داخل كل قسم

    if (!Array.isArray(sections)) {
      // لا يوجد محتوى لتعديله، نكتفي بتحديث بيانات الكورس
      return NextResponse.json({ success: true, course: updatedCourse });
    }

    // جلب الأقسام الحالية لهذا الكورس
    const { data: existingSections, error: existingSectionsError } = await supabase
      .from("sections")
      .select("id")
      .eq("course_id", courseId);

    if (existingSectionsError) {
      console.error("❌ خطأ في جلب الأقسام الحالية:", existingSectionsError);
      return NextResponse.json({ error: existingSectionsError.message }, { status: 500 });
    }

    const existingSectionIds: string[] = (existingSections || []).map((s: any) => s.id);
    const payloadSectionIds: string[] = sections
      .filter((s: any) => !!s.id)
      .map((s: any) => s.id as string);

    // الأقسام التي تم حذفها في الواجهة (موجودة في قاعدة البيانات ولكن ليست في الفورم)
    const sectionsToDelete = existingSectionIds.filter(
      (id) => !payloadSectionIds.includes(id)
    );

    if (sectionsToDelete.length > 0) {
      // حذف دروس هذه الأقسام أولاً ثم حذف الأقسام نفسها
      const { error: deleteLessonsError } = await supabase
        .from("lessons")
        .delete()
        .in("section_id", sectionsToDelete);

      if (deleteLessonsError) {
        console.error("❌ خطأ في حذف دروس الأقسام المحذوفة:", deleteLessonsError);
        return NextResponse.json({ error: deleteLessonsError.message }, { status: 500 });
      }

      const { error: deleteSectionsError } = await supabase
        .from("sections")
        .delete()
        .in("id", sectionsToDelete);

      if (deleteSectionsError) {
        console.error("❌ خطأ في حذف الأقسام المحذوفة:", deleteSectionsError);
        return NextResponse.json({ error: deleteSectionsError.message }, { status: 500 });
      }
    }

    // 3) مزامنة كل قسم ودروسه
    for (let sIndex = 0; sIndex < sections.length; sIndex++) {
      const section = sections[sIndex];
      if (!section || !section.title || !Array.isArray(section.lessons) || section.lessons.length === 0) {
        continue;
      }

      let sectionId: string | null = section.id || null;

      if (sectionId) {
        // تحديث قسم موجود
        const { error: updateSectionError } = await supabase
          .from("sections")
          .update({
            title: section.title,
            description: section.description || "",
            order_index: section.order ?? sIndex,
          })
          .eq("id", sectionId);

        if (updateSectionError) {
          console.error("❌ خطأ في تحديث بيانات قسم موجود:", updateSectionError);
          continue;
        }
      } else {
        // إنشاء قسم جديد
        const { data: insertedSection, error: insertSectionError } = await supabase
          .from("sections")
          .insert({
            course_id: courseId,
            title: section.title,
            description: section.description || "",
            order_index: section.order ?? sIndex,
          })
          .select("*")
          .single();

        if (insertSectionError || !insertedSection) {
          console.error("❌ خطأ في إنشاء قسم جديد:", insertSectionError);
          continue;
        }

        sectionId = insertedSection.id as string;
      }

      // في حال فشل الحصول على sectionId لأي سبب، نتخطى هذا القسم
      if (!sectionId) continue;

      // مزامنة دروس هذا القسم
      const { data: existingLessons, error: existingLessonsError } = await supabase
        .from("lessons")
        .select("id")
        .eq("section_id", sectionId);

      if (existingLessonsError) {
        console.error("❌ خطأ في جلب الدروس الحالية للقسم:", existingLessonsError);
        continue;
      }

      const existingLessonIds: string[] = (existingLessons || []).map((l: any) => l.id);
      const payloadLessonIds: string[] = section.lessons
        .filter((l: any) => !!l.id)
        .map((l: any) => l.id as string);

      const lessonsToDelete = existingLessonIds.filter(
        (id) => !payloadLessonIds.includes(id)
      );

      if (lessonsToDelete.length > 0) {
        const { error: deleteLessonsError } = await supabase
          .from("lessons")
          .delete()
          .in("id", lessonsToDelete);

        if (deleteLessonsError) {
          console.error("❌ خطأ في حذف الدروس المحذوفة من القسم:", deleteLessonsError);
          continue;
        }
      }

      // تحديث/إنشاء كل درس
      for (let idx = 0; idx < section.lessons.length; idx++) {
        const lesson = section.lessons[idx];
        const orderIndex = lesson.order ?? idx;
        const baseLesson = {
          title: lesson.title,
          description: lesson.description || "",
          video_url: lesson.videoUrl || "",
          duration: Math.max(1, Number(lesson.duration) || 0),
          duration_minutes: Math.max(1, Number(lesson.duration) || 0),
          order_index: orderIndex,
          is_preview: !!lesson.isPreview,
          is_published: true,
        };

        if (lesson.id) {
          // تحديث درس موجود
          const { error: updateLessonError } = await supabase
            .from("lessons")
            .update(baseLesson)
            .eq("id", lesson.id as string);

          if (updateLessonError) {
            console.error("❌ خطأ في تحديث درس موجود:", updateLessonError);
          }
        } else {
          // إنشاء درس جديد
          const { error: insertLessonError } = await supabase
            .from("lessons")
            .insert({
              section_id: sectionId,
              course_id: courseId,
              ...baseLesson,
            });

          if (insertLessonError) {
            console.error("❌ خطأ في إنشاء درس جديد للقسم:", insertLessonError);
          }
        }
      }
    }

    return NextResponse.json({ success: true, course: updatedCourse });
  } catch (e: any) {
    console.error("❌ خطأ غير متوقع في API تعديل محتوى الكورس:", e);
    return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
  }
}
