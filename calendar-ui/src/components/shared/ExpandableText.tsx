import { useState } from 'react';

const PREVIEW_LENGTH = 100;

/**
 * Renders a plain text string. If the text exceeds PREVIEW_LENGTH characters,
 * it is truncated with a "Show more" / "Show less" inline toggle.
 */
export function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  if (text.length <= PREVIEW_LENGTH) {
    return <>{text}</>;
  }

  return (
    <>
      <span aria-live="polite">
        {expanded ? text : `${text.slice(0, PREVIEW_LENGTH)}…`}
      </span>{' '}
      <button
        type="button"
        aria-expanded={expanded}
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((prev) => !prev);
        }}
        className="text-primary cursor-pointer font-medium hover:underline"
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </>
  );
}
