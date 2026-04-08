import { useEffect, useId } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type RichTextLinkDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  onUrlChange: (url: string) => void;
  text: string;
  onTextChange: (text: string) => void;
  /** Show explicit remove control when the selection had a link when the dialog opened. */
  canRemoveLink: boolean;
  onSave: () => void;
  onRemoveLink: () => void;
};

export function RichTextLinkDialog({
  open,
  onOpenChange,
  url,
  onUrlChange,
  text,
  onTextChange,
  canRemoveLink,
  onSave,
  onRemoveLink,
}: RichTextLinkDialogProps) {
  const urlId = useId();
  const textId = useId();

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById(urlId) as HTMLInputElement | null;
      el?.focus();
      el?.select();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, urlId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Link</DialogTitle>
          <DialogDescription>
            Set a link URL and optional display text.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor={urlId}>URL</Label>
            <Input
              id={urlId}
              type="text"
              placeholder="https:// or /path"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSave();
                }
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={textId}>Text</Label>
            <Input
              id={textId}
              type="text"
              placeholder="Link label"
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSave();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {canRemoveLink ? (
              <Button
                type="button"
                variant="destructive"
                onClick={onRemoveLink}
              >
                Remove link
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={onSave}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
