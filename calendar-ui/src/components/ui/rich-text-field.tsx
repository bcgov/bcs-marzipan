import { EditorContent, useEditor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  RemoveFormatting,
} from 'lucide-react';
import sanitizeHtml from 'sanitize-html';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { RichTextLinkDialog } from '@/components/ui/rich-text-field-link-dialog';
import { Separator } from '@/components/ui/separator';
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

const PASTE_ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'a',
  'ul',
  'ol',
  'li',
];
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

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkHadMark, setLinkHadMark] = useState(false);
  const linkRangeRef = useRef<{ from: number; to: number } | null>(null);

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
          '[&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-5 [&_ul]:pl-5',
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

  const openLinkDialog = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
    editor.commands.focus();
    const hadLink = editor.isActive('link');
    if (hadLink) {
      editor.commands.extendMarkRange('link');
    }
    const { from, to } = editor.state.selection;
    linkRangeRef.current = { from, to };
    setLinkUrl(String(editor.getAttributes('link').href ?? ''));
    setLinkText(editor.state.doc.textBetween(from, to, '\n', '\n'));
    setLinkHadMark(hadLink);
    setLinkDialogOpen(true);
  }, [editor]);

  const focusEditorAfterDialog = useCallback(() => {
    requestAnimationFrame(() => {
      editor?.commands.focus();
    });
  }, [editor]);

  const handleLinkDialogOpenChange = useCallback(
    (open: boolean) => {
      setLinkDialogOpen(open);
      if (!open) {
        focusEditorAfterDialog();
      }
    },
    [focusEditorAfterDialog]
  );

  const saveLinkFromDialog = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
    const r = linkRangeRef.current;
    if (!r) {
      setLinkDialogOpen(false);
      focusEditorAfterDialog();
      return;
    }
    const trimmedUrl = linkUrl.trim();

    if (trimmedUrl === '') {
      editor
        .chain()
        .focus()
        .setTextSelection({ from: r.from, to: r.to })
        .unsetLink()
        .run();
      setLinkDialogOpen(false);
      focusEditorAfterDialog();
      return;
    }

    const displayText = linkText.trim() === '' ? trimmedUrl : linkText;
    editor
      .chain()
      .focus()
      .setTextSelection({ from: r.from, to: r.to })
      .deleteSelection()
      .insertContent({
        type: 'text',
        text: displayText,
        marks: [{ type: 'link', attrs: { href: trimmedUrl } }],
      })
      .run();
    setLinkDialogOpen(false);
    focusEditorAfterDialog();
  }, [editor, linkUrl, linkText, focusEditorAfterDialog]);

  const removeLinkFromDialog = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
    const r = linkRangeRef.current;
    if (!r) {
      setLinkDialogOpen(false);
      focusEditorAfterDialog();
      return;
    }
    editor
      .chain()
      .focus()
      .setTextSelection({ from: r.from, to: r.to })
      .unsetLink()
      .run();
    setLinkDialogOpen(false);
    focusEditorAfterDialog();
  }, [editor, focusEditorAfterDialog]);

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
      queueMicrotask(() => {
        if (!editor || editor.isDestroyed) return;
        editor.commands.setContent(args.content, { emitUpdate: false });
      });
      return;
    }
    const md = editor.getMarkdown?.() ?? '';
    if (md === value) {
      return;
    }
    queueMicrotask(() => {
      if (!editor || editor.isDestroyed) return;
      editor.commands.setContent(args.content, {
        contentType: 'markdown',
        emitUpdate: false,
      });
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
    <div className={cn(className)} data-field={dataField}>
      <input type="hidden" name={name} value={value} readOnly />
      <RichTextLinkDialog
        open={linkDialogOpen}
        onOpenChange={handleLinkDialogOpenChange}
        url={linkUrl}
        onUrlChange={setLinkUrl}
        text={linkText}
        onTextChange={setLinkText}
        canRemoveLink={linkHadMark}
        onSave={saveLinkFromDialog}
        onRemoveLink={removeLinkFromDialog}
      />
      <div
        className={cn(
          'bg-background border-input overflow-hidden rounded-md border',
          editable && 'focus-within:ring-ring focus-within:ring-2'
        )}
      >
        {editable ? (
          <div
            className="border-input flex flex-wrap items-center gap-0.5 border-b px-1.5 py-1"
            role="toolbar"
            aria-label="Text formatting"
          >
            <Button
              type="button"
              variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleBold().run()}
              aria-pressed={editor.isActive('bold')}
              aria-label="Bold"
            >
              <Bold className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              aria-pressed={editor.isActive('italic')}
              aria-label="Italic"
            >
              <Italic className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() =>
                editor.chain().focus().unsetAllMarks().clearNodes().run()
              }
              aria-label="Clear formatting"
            >
              <RemoveFormatting className="size-3.5" />
            </Button>
            <Separator
              orientation="vertical"
              className="mx-1 h-5 data-[orientation=vertical]:h-5"
            />
            <Button
              type="button"
              variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              aria-pressed={editor.isActive('bulletList')}
              aria-label="Bulleted list"
            >
              <List className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              aria-pressed={editor.isActive('orderedList')}
              aria-label="Numbered list"
            >
              <ListOrdered className="size-3.5" />
            </Button>
            <Separator
              orientation="vertical"
              className="mx-1 h-5 data-[orientation=vertical]:h-5"
            />
            <Button
              type="button"
              variant={editor.isActive('link') ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onMouseDown={(e) => e.preventDefault()}
              onClick={openLinkDialog}
              aria-pressed={editor.isActive('link')}
              aria-label="Link"
            >
              <LinkIcon className="size-3.5" />
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
    </div>
  );
}
