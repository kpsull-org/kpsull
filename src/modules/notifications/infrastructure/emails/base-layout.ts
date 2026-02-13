const YEAR = new Date().getFullYear();

export function baseLayout(title: string, content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;padding:40px 20px;margin:0;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
  <div style="background:#111827;padding:24px;text-align:center;">
    <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0;">Kpsull</h1>
  </div>
  <div style="padding:32px 40px;">
    <h2 style="font-size:20px;color:#111827;margin:0 0 16px;">${title}</h2>
    ${content}
  </div>
  <div style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
      &copy; ${YEAR} Kpsull. Tous droits r&eacute;serv&eacute;s.
    </p>
  </div>
</div></body></html>`;
}

export function paragraph(text: string): string {
  return `<p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">${text}</p>`;
}

export function ctaButton(text: string, url: string): string {
  return `<div style="text-align:center;margin:24px 0;">
    <a href="${url}" style="display:inline-block;background:#111827;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">${text}</a>
  </div>`;
}

export function infoBox(text: string): string {
  return `<div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;">
    <p style="color:#4b5563;font-size:14px;margin:0;">${text}</p>
  </div>`;
}

export function highlight(label: string, value: string): string {
  return `<p style="margin:4px 0;color:#4b5563;"><strong style="color:#111827;">${label}:</strong> ${value}</p>`;
}
