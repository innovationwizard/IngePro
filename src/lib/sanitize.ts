// Input sanitization utilities for security

export function sanitizeString(input: string | null | undefined, maxLength: number = 1000): string | null {
  if (!input) return null;
  
  // Remove HTML tags and dangerous characters
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>\"'&]/g, '') // Remove dangerous characters
    .trim()
    .substring(0, maxLength); // Limit length
}

export function sanitizeNumber(input: string | number | null | undefined, min: number = 0, max: number = 999999): number | null {
  if (!input) return null;
  
  const num = parseInt(String(input));
  if (isNaN(num)) return null;
  
  return Math.max(min, Math.min(max, num)); // Clamp between min and max
}

export function sanitizeEmail(input: string | null | undefined): string | null {
  if (!input) return null;
  
  const email = input.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(email) ? email : null;
}

export function sanitizeId(input: string | null | undefined): string | null {
  if (!input) return null;
  
  // Only allow alphanumeric characters, hyphens, and underscores
  const sanitized = input.replace(/[^a-zA-Z0-9\-_]/g, '');
  return sanitized.length > 0 ? sanitized : null;
}

export function sanitizeLimit(input: string | number | null | undefined, defaultLimit: number = 10, maxLimit: number = 100): number {
  const limit = sanitizeNumber(input, 1, maxLimit);
  return limit || defaultLimit;
}

export function sanitizeDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  
  try {
    const date = new Date(input);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

// Validation functions
export function validateRequiredString(value: string | null | undefined, fieldName: string, minLength: number = 2, maxLength: number = 200): string {
  if (!value || value.length < minLength || value.length > maxLength) {
    throw new Error(`${fieldName} debe tener entre ${minLength} y ${maxLength} caracteres`);
  }
  return value;
}

export function validateRequiredId(value: string | null | undefined, fieldName: string): string {
  if (!value) {
    throw new Error(`${fieldName} es requerido`);
  }
  return value;
} 