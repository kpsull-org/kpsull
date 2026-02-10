/**
 * Error Sanitizer
 *
 * Sanitizes error details before displaying to users or sending to GitHub issues.
 * Removes sensitive data: tokens, passwords, database URLs, API keys.
 */

const SENSITIVE_PATTERNS: RegExp[] = [
  // JWT tokens
  /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
  // GitHub personal access tokens
  /ghp_[A-Za-z0-9]{36,}/g,
  /github_pat_[A-Za-z0-9_]{22,}/g,
  // Stripe keys
  /sk_(?:test|live)_[A-Za-z0-9]{20,}/g,
  /pk_(?:test|live)_[A-Za-z0-9]{20,}/g,
  // Database URLs
  /(?:postgresql|postgres|mysql|mongodb(?:\+srv)?):\/\/[^\s"']+/gi,
  // Generic key=value secrets
  /(?:password|passwd|pwd|secret|token|api[_-]?key|auth|bearer|credential)\s*[:=]\s*['"]?[^\s'"}{,]+/gi,
  // Environment variable assignments
  /(?:DATABASE_URL|NEXTAUTH_SECRET|NEXTAUTH_URL|GOOGLE_CLIENT_SECRET|GOOGLE_CLIENT_ID|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|GITHUB_ISSUES_TOKEN|AUTH_SECRET)\s*=\s*\S+/gi,
  // Bearer tokens in headers
  /Bearer\s+[A-Za-z0-9._~+/=-]+/gi,
  // Email addresses (partial redaction for privacy)
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
];

const REDACTED = '[REDACTED]';

export function sanitizeErrorDetails(text: string): string {
  if (!text) return '';

  let sanitized = text;
  for (const pattern of SENSITIVE_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    sanitized = sanitized.replace(pattern, REDACTED);
  }
  return sanitized;
}

export function sanitizeErrorContext(
  context: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(context)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeErrorDetails(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeErrorContext(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
