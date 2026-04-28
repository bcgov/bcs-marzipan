import * as DialogPrimitive from '@radix-ui/react-dialog';

import type { LoginModalSettings } from '@corpcal/shared/api/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
import { sanitizeBannerHtml } from '@/lib/banner-html';

interface LoginModalProps {
  modal: LoginModalSettings;
  open: boolean;
  onDismiss: () => void;
}

export function LoginModal({ modal, open, onDismiss }: LoginModalProps) {
  const sanitizedContent = sanitizeBannerHtml(modal.content);

  return (
    <Dialog open={open}>
      <DialogPortal>
        <DialogOverlay />
        {/* DialogContent from shadcn always renders a close button, so we use
            the Radix primitive directly here — the modal must be explicitly
            dismissed and cannot be closed via the X, Escape, or outside click. */}
        <DialogPrimitive.Content
          className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          aria-describedby="login-modal-content"
        >
          <DialogTitle>{modal.title}</DialogTitle>
          <div
            id="login-modal-content"
            className="text-sm text-slate-700 [&_a]:text-blue-600 [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
          <div className="flex justify-end">
            <Button onClick={onDismiss}>Dismiss</Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
