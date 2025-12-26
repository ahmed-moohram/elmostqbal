import { z, ZodError, ZodSchema } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Validate request body against a Zod schema
 * Returns validated data or error response
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'validation_error',
            message: 'خطأ في التحقق من البيانات',
            errors,
          },
          { status: 400 }
        ),
      };
    }

    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'invalid_request',
          message: 'طلب غير صحيح',
        },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate form data against a Zod schema
 */
export function validateFormData<T>(
  formData: FormData,
  schema: ZodSchema<T>
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  try {
    const data = Object.fromEntries(formData.entries());
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Validate UUID string
 */
export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Safe parse with custom error handling
 */
export function safeParse<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

