import { EditorContent, useEditor } from '@tiptap/react';
import { Bold, Italic, Link as LinkIcon } from 'lucide-react';
import sanitizeHtml from 'sanitize-html';
import { useEffect, useMemo, useRef } from 'react';

import { Button } from '@/components/ui/button';
import {
  getActivityRichTextEditorExtensions,
  getSetContentArgs,
} from '@/lib/activity-rich-text-extensions';
import { cn } from '@/lib/utils';

export type RichTextFieldProps = {
  id?: string;
  name: string;
  value: string;
  onChange: (json: string) => void;
  onBlur: () => void;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
  'data-field'?: string;
};

const PASTE_ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'a'];
const PASTE_ALLOWED_ATTR = { a: ['href'] };

export function RichTextField({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder = '',
  readOnly = false,
  disabled = false,
  className,
  'data-field': dataField,
}: RichTextFieldProps) {
  const editable = !readOnly && !disabled;
  const initialArgs = useRef(getSetContentArgs(value));
  const extensions = useMemo(
    () => getActivityRichTextEditorExtensions({ placeholder }),
    [placeholder]
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: initialArgs.current.content,
    contentType: initialArgs.current.contentType,
    editable,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class: cn(
          'prose prose-sm max-w-none dark:prose-invert outline-none',
          'min-h-[120px] px-3 py-2 text-sm',
          'focus-visible:ring-ring rounded-md border border-input bg-transparent focus-visible:ring-2',
          !editable && 'cursor-default opacity-80'
        ),
      },
      transformPastedHTML(html) {
        return sanitizeHtml(html, {
          allowedTags: PASTE_ALLOWED_TAGS,
          allowedAttributes: PASTE_ALLOWED_ATTR,
        });
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(JSON.stringify(ed.getJSON()));
    },
  });

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const args = getSetContentArgs(value);
    if (args.contentType === 'json') {
      if (JSON.stringify(args.content) === JSON.stringify(editor.getJSON())) {
        return;
      }
      editor.commands.setContent(args.content, { emitUpdate: false });
      return;
    }
    const md = editor.getMarkdown?.() ?? '';
    if (md === value) {
      return;
    }
    editor.commands.setContent(args.content, {
      contentType: 'markdown',
      emitUpdate: false,
    });
  }, [editor, value]);

  if (!editor) {
    return (
      <div
        className={cn(
          'border-input text-muted-foreground min-h-[120px] rounded-md border border-dashed px-3 py-2 text-sm',
          className
        )}
      >
        Loading editor…
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)} data-field={dataField}>
      <input type="hidden" name={name} value={value} readOnly />
      {editable ? (
        <div className="border-border flex flex-wrap gap-1 border-b pb-2">
          <Button
            type="button"
            variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-2"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-pressed={editor.isActive('bold')}
            aria-label="Bold"
          >
            <Bold className="size-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-2"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-pressed={editor.isActive('italic')}
            aria-label="Italic"
          >
            <Italic className="size-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('link') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-2"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const prev = editor.getAttributes('link').href as
                | string
                | undefined;
              const raw = window.prompt('Link URL', prev ?? 'https://');
              if (raw === null) return;
              const url = raw.trim();
              if (url === '') {
                editor
                  .chain()
                  .focus()
                  .extendMarkRange('link')
                  .unsetLink()
                  .run();
                return;
              }
              editor
                .chain()
                .focus()
                .extendMarkRange('link')
                .setLink({ href: url })
                .run();
            }}
            aria-pressed={editor.isActive('link')}
            aria-label="Link"
          >
            <LinkIcon className="size-4" />
          </Button>
        </div>
      ) : null}
      <EditorContent
        editor={editor}
        onBlur={() => {
          onBlur();
        }}
      />
    </div>
  );
}
