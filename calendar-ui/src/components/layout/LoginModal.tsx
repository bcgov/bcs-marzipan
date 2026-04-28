import * as Dialog from '@radix-ui/react-dialog';

import type { LoginModalSettings } from '@corpcal/shared/api/types';
import { Button } from '@/components/ui/button';
import { sanitizeBannerHtml } from '@/lib/banner-html';

interface LoginModalProps {
  modal: LoginModalSettings;
  open: boolean;
  onDismiss: () => void;
}

export function LoginModal({ modal, open, onDismiss }: LoginModalProps) {
  const sanitizedContent = sanitizeBannerHtml(modal.content);

  return (
    <Dialog.Root open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          className="fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-200 bg-white p-6 shadow-lg sm:rounded-lg"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          aria-describedby="login-modal-content"
        >
          <Dialog.Title className="text-lg font-semibold text-slate-900">
            {modal.title}
          </Dialog.Title>
          <div
            id="login-modal-content"
            className="text-sm text-slate-700 [&_a]:text-blue-600 [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
          <div className="flex justify-end">
            <Button onClick={onDismiss}>Dismiss</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
