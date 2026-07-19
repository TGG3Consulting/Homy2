import { z, ZodError, ZodSchema } from 'zod';
import { NextResponse } from 'next/server';

/**
 * Validation result type
 * Either successful with typed data, or failed with NextResponse error
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: NextResponse };

/**
 * Parse and validate request body
 * Returns typed data or NextResponse with formatted errors
 *
 * @example
 * const validation = validateBody(registerSchema, body);
 * if (!validation.success) {
 *   return validation.error;
 * }
 * const { email, password } = validation.data;
 */
export function validateBody<T>(
  schema: ZodSchema<T>,
  body: unknown
): ValidationResult<T> {
  const result = schema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: formatZodError(result.error),
    };
  }

  return { success: true, data: result.data };
}

/**
 * Parse and validate query params from URLSearchParams
 * Converts URLSearchParams to object before validation
 *
 * @example
 * const validation = validateQuery(searchPropertiesSchema, req.nextUrl.searchParams);
 * if (!validation.success) {
 *   return validation.error;
 * }
 * const { page, limit, property_type } = validation.data;
 */
export function validateQuery<T>(
  schema: ZodSchema<T>,
  params: URLSearchParams
): ValidationResult<T> {
  const obj = Object.fromEntries(params.entries());
  return validateBody(schema, obj);
}

/**
 * Parse body and throw on validation failure
 * Use with try-catch in handlers for simpler control flow
 *
 * @throws {ZodError} When validation fails
 * @example
 * try {
 *   const { email, password } = parseBody(registerSchema, body);
 *   // ... handler logic
 * } catch (error) {
 *   const validationResponse = handleValidationError(error);
 *   if (validationResponse) return validationResponse;
 *   // Handle other errors
 * }
 */
export function parseBody<T>(schema: ZodSchema<T>, body: unknown): T {
  return schema.parse(body);
}

/**
 * Human-readable summary of the FIRST validation issue — surfaced as `error`
 * so any FE that renders `d.error` shows something actionable instead of a
 * generic "Validation failed". Schema-provided custom messages (incl. Russian
 * admin texts) pass through as-is; zod defaults get the field name prefixed.
 */
const ZOD_DEFAULTISH = /^(Required|Invalid|Expected|Unrecognized|String must|Number must|Array must)/;
function firstIssueMessage(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'Validation failed';
  const field = issue.path.join('.');
  // Default zod texts ("Required", "Invalid input", …) are meaningless without
  // the field; custom messages are already self-explanatory.
  return field && ZOD_DEFAULTISH.test(issue.message)
    ? `${field}: ${issue.message}`
    : issue.message;
}

/**
 * Format ZodError into standardized API response
 * Groups errors by field path
 */
function formatZodError(error: ZodError): NextResponse {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return NextResponse.json(
    {
      error: firstIssueMessage(error),
      errors,
      code: 'VALIDATION_ERROR',
    },
    { status: 422 }
  );
}

/**
 * Format ZodError as flat message string
 * Useful for simple error cases or logging
 */
export function formatZodErrorFlat(error: ZodError): string {
  return error.issues.map(i => i.message).join(', ');
}

/**
 * Handle Zod errors in catch block
 * Returns formatted NextResponse if error is ZodError, null otherwise
 *
 * @example
 * catch (error) {
 *   const validationResponse = handleValidationError(error);
 *   if (validationResponse) return validationResponse;
 *   // Handle other errors
 * }
 */
export function handleValidationError(error: unknown): NextResponse | null {
  if (error instanceof ZodError) {
    return formatZodError(error);
  }
  return null;
}

// Standardized error codes
export const ValidationErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_FORMAT: 'INVALID_FORMAT',
  MISSING_FIELD: 'MISSING_FIELD',
  OUT_OF_RANGE: 'OUT_OF_RANGE',
} as const;

export interface ApiValidationError {
  error: string;
  code: string;
  errors?: Record<string, string[]>;
  field?: string;
}

/**
 * Create a validation error response
 * Utility for custom validation error responses
 */
export function validationError(
  message: string,
  errors?: Record<string, string[]>
): NextResponse<ApiValidationError> {
  return NextResponse.json(
    {
      error: message,
      code: ValidationErrorCode.VALIDATION_ERROR,
      errors,
    },
    { status: 422 }
  );
}
