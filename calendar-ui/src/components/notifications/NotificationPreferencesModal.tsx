import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { NOTIFICATION_PREFERENCE_CATEGORY_OPTIONS } from '@corpcal/shared';
import type {
  NotificationCategoryPreference,
  NotificationPreferences,
} from '@corpcal/shared/schemas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { showErrorToast, showSuccessToast } from '@/lib/error-toast';

interface NotificationPreferencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Channel = 'inApp' | 'email';

export function NotificationPreferencesModal({
  open,
  onOpenChange,
}: NotificationPreferencesModalProps) {
  const { preferences, isLoading, isError, refetch, save, isSaving } =
    useNotificationPreferences({ enabled: open });
  const [draft, setDraft] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    // Seed once per open so background refetches don't clobber unsaved edits.
    setDraft((prev) => (open ? (prev ?? preferences ?? null) : null));
  }, [open, preferences]);

  const setCategoryChannel = (
    category: NotificationCategoryPreference['category'],
    channel: Channel,
    value: boolean
  ) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            categories: prev.categories.map((c) =>
              c.category === category ? { ...c, [channel]: value } : c
            ),
          }
        : prev
    );
  };

  const handleSave = async () => {
    if (!draft) return;
    try {
      await save({
        emailEnabled: draft.emailEnabled,
        categories: draft.categories,
      });
      showSuccessToast('Notification options saved');
      onOpenChange(false);
    } catch (error) {
      showErrorToast(error, 'Failed to save notification options');
    }
  };

  const renderBody = () => {
    if (isError) {
      return (
        <div className="space-y-3 py-4 text-center">
          <p className="text-muted-foreground text-sm">
            Could not load notification options.
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      );
    }

    if (isLoading || !draft) {
      return (
        <div className="flex justify-center py-8">
          <Loader2
            className="text-muted-foreground h-6 w-6 animate-spin"
            aria-label="Loading notification options"
          />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="border-border flex items-center justify-between gap-4 rounded-md border px-3 py-3">
          <div>
            <Label htmlFor="notification-pref-email-enabled">
              Email notifications
            </Label>
            <p className="text-muted-foreground text-xs">
              Turn off to stop all notification emails.
            </p>
          </div>
          <Switch
            id="notification-pref-email-enabled"
            checked={draft.emailEnabled}
            onCheckedChange={(checked) =>
              setDraft((prev) =>
                prev ? { ...prev, emailEnabled: checked } : prev
              )
            }
          />
        </div>

        <table className="w-full text-sm">
          <caption className="sr-only">
            Notification categories by delivery channel
          </caption>
          <thead>
            <tr className="text-muted-foreground border-border border-b text-xs">
              <th scope="col" className="py-2 text-left font-medium">
                Category
              </th>
              <th scope="col" className="w-20 py-2 text-center font-medium">
                In-app
              </th>
              <th scope="col" className="w-20 py-2 text-center font-medium">
                Email
              </th>
            </tr>
          </thead>
          <tbody>
            {draft.categories.map((pref) => {
              const option = NOTIFICATION_PREFERENCE_CATEGORY_OPTIONS.find(
                (o) => o.category === pref.category
              );
              const label = option?.label ?? pref.category;
              return (
                <tr
                  key={pref.category}
                  className="border-border border-b last:border-b-0"
                >
                  <th scope="row" className="py-3 pr-2 text-left">
                    <p className="font-medium">{label}</p>
                    {option?.description && (
                      <p className="text-muted-foreground text-xs font-normal">
                        {option.description}
                      </p>
                    )}
                  </th>
                  <td className="py-3 text-center">
                    <Switch
                      checked={pref.inApp}
                      aria-label={`${label}: in-app`}
                      onCheckedChange={(checked) =>
                        setCategoryChannel(pref.category, 'inApp', checked)
                      }
                    />
                  </td>
                  <td className="py-3 text-center">
                    <Switch
                      checked={draft.emailEnabled && pref.email}
                      disabled={!draft.emailEnabled}
                      aria-label={`${label}: email`}
                      onCheckedChange={(checked) =>
                        setCategoryChannel(pref.category, 'email', checked)
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Notification options</DialogTitle>
          <DialogDescription>
            Choose which notifications you receive in the app and by email.
          </DialogDescription>
        </DialogHeader>

        {renderBody()}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!draft || isSaving}
            onClick={() => void handleSave()}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
