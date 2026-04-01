import sanitizeHtml from 'sanitize-html';

const ALLOWED_BANNER_TAGS = [
  'a',
  'b',
  'br',
  'code',
  'em',
  'i',
  'li',
  'ol',
  'p',
  'span',
  'strong',
  'u',
  'ul',
  'div',
  'button',
  'svg',
  'path',
];

// Allow `class` (so Tailwind classes survive), and a small set of safe
// attributes for SVG elements used in the default banner HTML. We keep
// onclick/style attributes disallowed for security.
const ALLOWED_BANNER_ATTRIBUTES: sanitizeHtml.IOptions['allowedAttributes'] = {
  '*': ['class', 'role', 'aria-hidden'],
  a: ['href', 'target', 'rel', 'class'],
  svg: ['viewBox', 'fill', 'class', 'xmlns'],
  path: ['d', 'fill', 'class'],
  button: ['type', 'class'],
};

const ALLOWED_BANNER_SCHEMES = ['http', 'https', 'mailto', 'tel'];

export function sanitizeBannerHtml(content: string): string {
  return sanitizeHtml(content, {
    allowedTags: ALLOWED_BANNER_TAGS,
    allowedAttributes: ALLOWED_BANNER_ATTRIBUTES,
    allowedSchemes: ALLOWED_BANNER_SCHEMES,
    allowedSchemesAppliedToAttributes: ['href'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer',
        target: '_blank',
      }),
    },
  }).trim();
}
