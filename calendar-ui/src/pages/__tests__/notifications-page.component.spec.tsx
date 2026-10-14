import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { NotificationsPage } from '../NotificationsPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const useNotificationsMock = vi.fn();

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: (options?: unknown) => useNotificationsMock(options),
}));

vi.mock('@/lib/notification-links', () => ({
  getNotificationTargetPath: () => null,
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <NotificationsPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('NotificationsPage', () => {
  it('renders notifications and calls useNotifications with default params', () => {
    const unreadItem = {
      recipientId: 1,
      eventId: 1,
      eventType: 'calendar.activity.create',
      entityType: 'activity',
      entityId: 10,
      changeType: 'create',
      summary: 'Unread item',
      details: null,
      actorUserId: 1,
      actorUsername: 'actor',
      createdAt: new Date().toISOString(),
      status: 'unread',
      readAt: null,
      dismissedAt: null,
    } as const;
    const readItem = {
      recipientId: 2,
      eventId: 2,
      eventType: 'calendar.activity.create',
      entityType: 'activity',
      entityId: 11,
      changeType: 'create',
      summary: 'Read item',
      details: null,
      actorUserId: 1,
      actorUsername: 'actor',
      createdAt: new Date().toISOString(),
      status: 'read',
      readAt: new Date().toISOString(),
      dismissedAt: null,
    } as const;

    const items = [unreadItem, readItem];
    useNotificationsMock.mockReturnValue({
      notificationPage: {
        items,
        page: 1,
        pageSize: 20,
        totalItems: items.length,
        hasNext: false,
      },
      notifications: items,
      unreadCount: 1,
      markRead: vi.fn().mockResolvedValue(undefined),
      dismiss: vi.fn().mockResolvedValue(undefined),
      markAllRead: vi.fn().mockResolvedValue(undefined),
      dismissAll: vi.fn().mockResolvedValue(undefined),
      isMutating: false,
    });

    renderPage();

    expect(useNotificationsMock).toHaveBeenCalledWith({
      includeRead: true,
      page: 1,
      pageSize: 20,
    });
    expect(screen.getByText('Unread item')).toBeInTheDocument();
    expect(screen.getByText('Read item')).toBeInTheDocument();
  });

  it('shows empty state when there are no notifications', () => {
    useNotificationsMock.mockReturnValue({
      notificationPage: {
        items: [],
        page: 1,
        pageSize: 20,
        totalItems: 0,
        hasNext: false,
      },
      notifications: [],
      unreadCount: 0,
      markRead: vi.fn().mockResolvedValue(undefined),
      dismiss: vi.fn().mockResolvedValue(undefined),
      markAllRead: vi.fn().mockResolvedValue(undefined),
      dismissAll: vi.fn().mockResolvedValue(undefined),
      isMutating: false,
    });

    renderPage();

    expect(
      screen.getByText('No notifications found for this view.')
    ).toBeInTheDocument();
  });
});
