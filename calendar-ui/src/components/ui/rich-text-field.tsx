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

import {
  EMPTY_RICH_TEXT_DOC,
  isActivityRichTextEffectivelyEmpty,
  plainTextFromActivityRichField,
} from '@corpcal/shared/utils';
import { Button } from '@/components/ui/button';
import { RichTextLinkDialog } from '@/components/ui/rich-text-field-link-dialog';
import { Separator } from '@/components/ui/separator';
import {
  getActivityRichTextEditorExtensions,
  getSetContentArgs,
} from '@/lib/activity-rich-text-extensions';
import { coalesceRichTextFormStorageValue } from '@/lib/normalize-activity-rich-text-form';
import { cn } from '@/lib/utils';

export type RichTextFieldProps = {
  id?: string;
  name: string;
  value: string;
  onChange: (json: string) => void;
  onBlur: () => void;
  placeholder?: string;
  maxLength?: number;
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

export function shouldIgnoreStaleEmptyRichTextUpdate({
  editorIsFocused,
  nextValue,
  currentValue,
}: {
  editorIsFocused: boolean;
  nextValue: string;
  currentValue: string;
}): boolean {
  return (
    !editorIsFocused &&
    isActivityRichTextEffectivelyEmpty(nextValue) &&
    !isActivityRichTextEffectivelyEmpty(currentValue)
  );
}

/** TipTap `getJSON()` output is already valid JSON; only empty variants need coalescing. */
export function coalesceEditorRichTextUpdate(json: string): string {
  return isActivityRichTextEffectivelyEmpty(json) ? EMPTY_RICH_TEXT_DOC : json;
}

export function RichTextField({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder = '',
  maxLength,
  readOnly = false,
  disabled = false,
  className,
  'data-field': dataField,
}: RichTextFieldProps) {
  const editable = !readOnly && !disabled;
  const initialArgs = useRef(getSetContentArgs(value));
  const valueRef = useRef(value);
  valueRef.current = value;
  const isSyncingFromPropRef = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const extensions = useMemo(
    () => getActivityRichTextEditorExtensions({ placeholder }),
    [placeholder]
  );
  const coalescedValue = useMemo(
    () => coalesceRichTextFormStorageValue(value),
    [value]
  );
  const coalescedValueRef = useRef(coalescedValue);
  coalescedValueRef.current = coalescedValue;

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
      if (isSyncingFromPropRef.current) return;

      const json = JSON.stringify(ed.getJSON());
      const propValue = valueRef.current;
      if (json === propValue) return;

      if (typeof maxLength === 'number') {
        const nextLength = plainTextFromActivityRichField(json).length;
        const currentLength = plainTextFromActivityRichField(propValue).length;
        if (nextLength > maxLength && nextLength > currentLength) {
          const args = getSetContentArgs(propValue);
          isSyncingFromPropRef.current = true;
          if (args.contentType === 'json') {
            ed.commands.setContent(args.content, { emitUpdate: false });
          } else {
            ed.commands.setContent(args.content, {
              contentType: 'markdown',
              emitUpdate: false,
            });
          }
          queueMicrotask(() => {
            isSyncingFromPropRef.current = false;
          });
          return;
        }
      }

      const nextValue = coalesceEditorRichTextUpdate(json);
      const currentValue = coalescedValueRef.current;
      if (
        nextValue === currentValue ||
        coalesceRichTextFormStorageValue(json) === currentValue ||
        shouldIgnoreStaleEmptyRichTextUpdate({
          editorIsFocused: ed.isFocused,
          nextValue: json,
          currentValue: propValue,
        })
      ) {
        return;
      }

      onChangeRef.current(nextValue);
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

  // Keep TipTap in sync with the RHF `value` prop without calling setContent during React render/commit
  // (e.g. form.reset after lock release). Deferred work runs as a microtask; see ActivityPage onLockReleased.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const args = getSetContentArgs(value);
    const applyFromProp = () => {
      isSyncingFromPropRef.current = true;
      if (args.contentType === 'json') {
        editor.commands.setContent(args.content, { emitUpdate: false });
      } else {
        editor.commands.setContent(args.content, {
          contentType: 'markdown',
          emitUpdate: false,
        });
      }
      queueMicrotask(() => {
        isSyncingFromPropRef.current = false;
      });
    };
    if (args.contentType === 'json') {
      if (JSON.stringify(args.content) === JSON.stringify(editor.getJSON())) {
        return;
      }
      queueMicrotask(() => {
        if (!editor || editor.isDestroyed) return;
        applyFromProp();
      });
      return;
    }
    const md = editor.getMarkdown?.() ?? '';
    if (md === value) {
      return;
    }
    queueMicrotask(() => {
      if (!editor || editor.isDestroyed) return;
      applyFromProp();
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
