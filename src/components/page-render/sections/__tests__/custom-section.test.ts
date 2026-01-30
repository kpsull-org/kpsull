import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../custom-section';

describe('CustomSection - HTML Sanitization', () => {
  describe('sanitizeHtml', () => {
    describe('XSS attack prevention', () => {
      it('should remove script tags', () => {
        const maliciousHtml = '<script>alert(1)</script>';
        const result = sanitizeHtml(maliciousHtml);

        expect(result).not.toContain('<script>');
        expect(result).not.toContain('alert');
        expect(result).toBe('');
      });

      it('should remove script tags with content around them', () => {
        const maliciousHtml = '<p>Hello</p><script>alert("xss")</script><p>World</p>';
        const result = sanitizeHtml(maliciousHtml);

        expect(result).not.toContain('<script>');
        expect(result).not.toContain('alert');
        expect(result).toContain('<p>Hello</p>');
        expect(result).toContain('<p>World</p>');
      });

      it('should remove inline event handlers', () => {
        const maliciousHtml = '<img src="x" onerror="alert(1)">';
        const result = sanitizeHtml(maliciousHtml);

        expect(result).not.toContain('onerror');
        expect(result).not.toContain('alert');
      });

      it('should remove javascript: URLs', () => {
        const maliciousHtml = '<a href="javascript:alert(1)">Click me</a>';
        const result = sanitizeHtml(maliciousHtml);

        expect(result).not.toContain('javascript:');
      });

      it('should remove data: URLs with scripts', () => {
        const maliciousHtml = '<a href="data:text/html,<script>alert(1)</script>">Click</a>';
        const result = sanitizeHtml(maliciousHtml);

        expect(result).not.toContain('data:text/html');
      });

      it('should remove iframe elements', () => {
        const maliciousHtml = '<iframe src="https://evil.com"></iframe>';
        const result = sanitizeHtml(maliciousHtml);

        expect(result).not.toContain('<iframe');
        expect(result).not.toContain('evil.com');
      });

      it('should remove object elements', () => {
        const maliciousHtml = '<object data="malicious.swf"></object>';
        const result = sanitizeHtml(maliciousHtml);

        expect(result).not.toContain('<object');
      });

      it('should remove embed elements', () => {
        const maliciousHtml = '<embed src="malicious.swf">';
        const result = sanitizeHtml(maliciousHtml);

        expect(result).not.toContain('<embed');
      });
    });

    describe('safe HTML preservation', () => {
      it('should preserve paragraph tags', () => {
        const safeHtml = '<p>This is a paragraph.</p>';
        const result = sanitizeHtml(safeHtml);

        expect(result).toBe('<p>This is a paragraph.</p>');
      });

      it('should preserve heading tags (h1-h6)', () => {
        const safeHtml = '<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>';
        const result = sanitizeHtml(safeHtml);

        expect(result).toContain('<h1>Title</h1>');
        expect(result).toContain('<h2>Subtitle</h2>');
        expect(result).toContain('<h3>Section</h3>');
      });

      it('should preserve list elements (ul, ol, li)', () => {
        const safeHtml = '<ul><li>Item 1</li><li>Item 2</li></ul>';
        const result = sanitizeHtml(safeHtml);

        expect(result).toContain('<ul>');
        expect(result).toContain('<li>Item 1</li>');
        expect(result).toContain('<li>Item 2</li>');
        expect(result).toContain('</ul>');
      });

      it('should preserve image tags with safe src', () => {
        const safeHtml = '<img src="https://example.com/image.jpg" alt="Example">';
        const result = sanitizeHtml(safeHtml);

        expect(result).toContain('<img');
        expect(result).toContain('src="https://example.com/image.jpg"');
        expect(result).toContain('alt="Example"');
      });

      it('should preserve anchor tags with safe href', () => {
        const safeHtml = '<a href="https://example.com">Link</a>';
        const result = sanitizeHtml(safeHtml);

        expect(result).toContain('<a');
        expect(result).toContain('href="https://example.com"');
        expect(result).toContain('Link</a>');
      });

      it('should preserve text formatting tags (strong, em, b, i, u)', () => {
        const safeHtml = '<strong>Bold</strong> <em>Italic</em> <b>Also bold</b> <i>Also italic</i> <u>Underline</u>';
        const result = sanitizeHtml(safeHtml);

        expect(result).toContain('<strong>Bold</strong>');
        expect(result).toContain('<em>Italic</em>');
        expect(result).toContain('<b>Also bold</b>');
        expect(result).toContain('<i>Also italic</i>');
        expect(result).toContain('<u>Underline</u>');
      });

      it('should preserve blockquote elements', () => {
        const safeHtml = '<blockquote>A famous quote</blockquote>';
        const result = sanitizeHtml(safeHtml);

        expect(result).toBe('<blockquote>A famous quote</blockquote>');
      });

      it('should preserve div and span elements', () => {
        const safeHtml = '<div><span>Content</span></div>';
        const result = sanitizeHtml(safeHtml);

        expect(result).toBe('<div><span>Content</span></div>');
      });

      it('should preserve table elements', () => {
        const safeHtml = '<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>';
        const result = sanitizeHtml(safeHtml);

        expect(result).toContain('<table>');
        expect(result).toContain('<th>Header</th>');
        expect(result).toContain('<td>Cell</td>');
        expect(result).toContain('</table>');
      });

      it('should preserve br and hr elements', () => {
        const safeHtml = '<p>Line 1<br>Line 2</p><hr>';
        const result = sanitizeHtml(safeHtml);

        expect(result).toContain('<br>');
        expect(result).toContain('<hr>');
      });

      it('should preserve code and pre elements', () => {
        const safeHtml = '<pre><code>const x = 1;</code></pre>';
        const result = sanitizeHtml(safeHtml);

        expect(result).toContain('<pre>');
        expect(result).toContain('<code>');
        expect(result).toContain('const x = 1;');
      });
    });

    describe('edge cases', () => {
      it('should handle empty string', () => {
        const result = sanitizeHtml('');

        expect(result).toBe('');
      });

      it('should handle plain text without HTML', () => {
        const plainText = 'Just some plain text without any HTML';
        const result = sanitizeHtml(plainText);

        expect(result).toBe(plainText);
      });

      it('should handle nested malicious content', () => {
        const maliciousHtml = '<div><p><script>alert(1)</script></p></div>';
        const result = sanitizeHtml(maliciousHtml);

        expect(result).not.toContain('<script>');
        expect(result).toContain('<div>');
        expect(result).toContain('<p>');
      });

      it('should handle mixed safe and unsafe content', () => {
        const mixedHtml = `
          <h1>Welcome</h1>
          <p>This is safe content.</p>
          <script>alert('XSS')</script>
          <img src="image.jpg" onerror="alert('XSS')">
          <a href="https://safe.com">Safe link</a>
          <a href="javascript:void(0)">Unsafe link</a>
        `;
        const result = sanitizeHtml(mixedHtml);

        expect(result).toContain('<h1>Welcome</h1>');
        expect(result).toContain('<p>This is safe content.</p>');
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('onerror');
        expect(result).toContain('href="https://safe.com"');
        expect(result).not.toContain('javascript:');
      });
    });
  });
});
