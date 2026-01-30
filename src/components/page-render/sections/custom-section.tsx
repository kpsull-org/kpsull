import DOMPurify from 'isomorphic-dompurify';

interface CustomContent {
  html?: string;
  markdown?: string;
}

interface CustomSectionProps {
  title: string;
  content: CustomContent;
}

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Removes dangerous elements like script tags while preserving safe HTML.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}

export function CustomSection({ title, content }: CustomSectionProps) {
  const { html, markdown } = content;

  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>
        {html && (
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
          />
        )}
        {markdown && !html && (
          <div className="prose prose-lg max-w-none">
            <p className="whitespace-pre-wrap">{markdown}</p>
          </div>
        )}
      </div>
    </section>
  );
}
