import { NextRequest, NextResponse } from 'next/server';
import { sanitizeErrorContext } from '@/lib/utils/error-sanitizer';

/**
 * POST /api/error/report
 *
 * Creates a GitHub issue from a sanitized error context.
 * Rate limited to 5 reports per hour per IP.
 *
 * Body: { errorType, message, technicalDetails?, url?, timestamp, userAgent?, provider?, digest? }
 * Returns: { success: true, issueUrl, issueNumber } | { error: string }
 */

const rateLimit = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS) return false;
  entry.count++;
  return true;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

function determineLabels(errorType: string): string[] {
  const labels = ['bug', 'auto-report'];

  const lower = errorType.toLowerCase();
  if (lower.includes('oauth') || lower.includes('auth') || lower.includes('credential')) {
    labels.push('auth');
  }
  if (lower.includes('prisma') || lower.includes('database') || lower.includes('db')) {
    labels.push('database');
  }
  if (lower.includes('configuration') || lower.includes('config')) {
    labels.push('config');
  }

  return labels;
}

function buildIssueMarkdown(context: Record<string, unknown>): string {
  const errorType = String(context.errorType || 'Unknown');
  const message = String(context.message || 'Pas de message');
  const url = context.url ? String(context.url) : 'N/A';
  const timestamp = context.timestamp ? String(context.timestamp) : new Date().toISOString();
  const provider = context.provider ? String(context.provider) : 'N/A';
  const digest = context.digest ? String(context.digest) : 'N/A';
  const technicalDetails = context.technicalDetails
    ? String(context.technicalDetails)
    : 'Non disponible';
  const userAgent = context.userAgent ? String(context.userAgent) : 'N/A';

  return `## Rapport de Bug Automatique

### Informations
| Champ | Valeur |
|-------|--------|
| **Type d'erreur** | \`${errorType}\` |
| **URL** | \`${url}\` |
| **Date** | ${timestamp} |
| **Fournisseur Auth** | ${provider} |
| **Digest** | \`${digest}\` |

### Message
${message}

### Details techniques
\`\`\`
${technicalDetails}
\`\`\`

### Environnement
- **User Agent:** \`${userAgent}\`
- **Source:** Rapport automatique depuis l'interface utilisateur

---
*Ce ticket a ete cree automatiquement via le systeme de signalement d'erreurs Kpsull.*`;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Trop de signalements. Reessayez dans une heure.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.errorType || !body.message) {
      return NextResponse.json(
        { error: 'Champs requis manquants (errorType, message)' },
        { status: 400 }
      );
    }

    const token = process.env.GITHUB_ISSUES_TOKEN;
    if (!token) {
      console.error('GITHUB_ISSUES_TOKEN is not configured');
      return NextResponse.json(
        { error: 'Le signalement de bugs n\'est pas configure sur ce serveur' },
        { status: 503 }
      );
    }

    // Double sanitization (defense in depth)
    const sanitized = sanitizeErrorContext(body);

    const title = `[Bug Auto] ${sanitized.errorType}: ${truncate(String(sanitized.message || ''), 80)}`;
    const issueBody = buildIssueMarkdown(sanitized);
    const labels = determineLabels(String(sanitized.errorType || ''));

    const response = await fetch(
      'https://api.github.com/repos/kpsull-org/kpsull/issues',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({ title, body: issueBody, labels }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('GitHub API error:', response.status, errorData);
      return NextResponse.json(
        { error: 'Erreur lors de la creation du ticket GitHub' },
        { status: 502 }
      );
    }

    const issue = await response.json();

    return NextResponse.json({
      success: true,
      issueUrl: issue.html_url,
      issueNumber: issue.number,
    });
  } catch (error) {
    console.error('Error creating GitHub issue:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
