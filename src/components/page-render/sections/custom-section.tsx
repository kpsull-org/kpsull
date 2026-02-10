import DOMPurify from "isomorphic-dompurify";

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
    <section className="bg-[#D9D9D9] px-6 py-16 md:px-12 md:py-24 lg:px-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-8 text-center font-[family-name:var(--font-montserrat)] text-xl font-semibold uppercase md:text-2xl lg:text-[40px] lg:leading-[1.22]">
          {title}
        </h2>
        {html && (
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
          />
        )}
        {markdown && !html && (
          <div className="prose prose-lg max-w-none">
            <p className="whitespace-pre-wrap font-[family-name:var(--font-montserrat)]">
              {markdown}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
