import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import type { NotificationItem } from '@corpcal/shared/api/types';
import { PageHeader } from '@/components/layout';
import { TablePagination } from '@/components/table/TablePagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications } from '@/hooks/useNotifications';
import { getNotificationTargetPath } from '@/lib/notification-links';

type NotificationTab = 'unread' | 'all';

function formatNotificationTime(value: string): string {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(dt);
}

function NotificationRow({
  item,
  onOpen,
  onMarkRead,
  onDismiss,
  isMutating,
}: {
  item: NotificationItem;
  onOpen: (item: NotificationItem) => void;
  onMarkRead: (recipientId: number) => Promise<unknown>;
  onDismiss: (recipientId: number) => Promise<unknown>;
  isMutating: boolean;
}) {
  const canOpen = getNotificationTargetPath(item) !== null;

  return (
    <div className="bg-card border-border rounded-md border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            {item.status === 'unread' ? (
              <Badge
                variant="destructive"
                className="rounded-sm px-2 py-0.5 text-[10px]"
              >
                Unread
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="rounded-sm px-2 py-0.5 text-[10px]"
              >
                Read
              </Badge>
            )}
            <span className="text-muted-foreground text-xs">
              {formatNotificationTime(item.createdAt)}
            </span>
          </div>

          {canOpen ? (
            <button
              type="button"
              onClick={() => onOpen(item)}
              className="group text-left"
            >
              <p className="group-hover:text-primary text-sm leading-6 text-slate-900">
                {item.summary}
              </p>
            </button>
          ) : (
            <p className="text-sm leading-6 text-slate-900">{item.summary}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {item.status === 'unread' && (
            <Button
              variant="outline"
              size="sm"
              disabled={isMutating}
              onClick={() => {
                void onMarkRead(item.recipientId);
              }}
            >
              Mark read
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            disabled={isMutating}
            onClick={() => {
              void onDismiss(item.recipientId);
            }}
          >
            Dismiss
          </Button>
          {canOpen && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open notification target"
              onClick={() => onOpen(item)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<NotificationTab>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const includeRead = tab === 'all';

  const {
    notificationPage,
    notifications,
    unreadCount,
    markRead,
    dismiss,
    markAllRead,
    dismissAll,
    isMutating,
  } = useNotifications({
    includeRead,
    page,
    pageSize,
  });

  const title = useMemo(
    () => `Notification center (${unreadCount} unread)`,
    [unreadCount]
  );

  const visibleNotifications = useMemo(() => {
    if (tab === 'unread') {
      return notifications.filter((item) => item.status === 'unread');
    }

    return notifications;
  }, [notifications, tab]);

  const handleOpen = (item: NotificationItem) => {
    const path = getNotificationTargetPath(item);
    if (!path) return;

    if (item.status === 'unread') {
      void markRead(item.recipientId).finally(() => {
        void navigate(path);
      });
      return;
    }

    void navigate(path);
  };

  return (
    <>
      <PageHeader
        title={title}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={isMutating || visibleNotifications.length === 0}
              onClick={() => {
                void markAllRead().then((result) => {
                  const count = result.updatedCount;
                  toast.success(
                    count === 1
                      ? 'Marked 1 notification as read'
                      : `Marked ${count} notifications as read`
                  );
                });
              }}
            >
              Mark all read
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isMutating || visibleNotifications.length === 0}
              onClick={() => {
                void dismissAll().then((result) => {
                  const count = result.updatedCount;
                  toast.success(
                    count === 1
                      ? 'Dismissed 1 notification'
                      : `Dismissed ${count} notifications`
                  );
                });
              }}
            >
              Dismiss all
            </Button>
          </div>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as NotificationTab);
          setPage(1);
        }}
      >
        <div className="mb-4">
          <TabsList variant="line" size="med">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      <div className="space-y-3">
        {visibleNotifications.length === 0 ? (
          <div className="text-muted-foreground bg-card border-border rounded-md border p-10 text-center">
            No notifications found for this view.
          </div>
        ) : (
          visibleNotifications.map((item) => (
            <NotificationRow
              key={item.recipientId}
              item={item}
              onOpen={handleOpen}
              onMarkRead={markRead}
              onDismiss={dismiss}
              isMutating={isMutating}
            />
          ))
        )}
      </div>

      <TablePagination
        className="mt-4"
        totalItems={notificationPage.totalItems}
        page={notificationPage.page}
        pageSize={notificationPage.pageSize}
        onPageChange={setPage}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        }}
      />
    </>
  );
}
