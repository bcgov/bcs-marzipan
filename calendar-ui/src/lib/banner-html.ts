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
];

const ALLOWED_BANNER_ATTRIBUTES: sanitizeHtml.IOptions['allowedAttributes'] = {
  a: ['href', 'target', 'rel'],
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
