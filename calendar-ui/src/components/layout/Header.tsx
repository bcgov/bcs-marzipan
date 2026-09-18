import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  ChevronDown,
  LogOut,
  Pencil,
  PencilOff,
  User,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  appendRecurringLockoutBypassNotice,
  PERMISSIONS,
} from '@corpcal/shared';
import type { BannerSettings } from '@corpcal/shared/api/types';
import { fetchActiveBanner } from '@/api/bannerApi';
import logo from '@/assets/Logo.svg';
import { MOCK_USERS } from '@/components/shared/UserSwitcher';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useBannerSettingsWebSocket } from '@/hooks/useBannerSettingsWebSocket';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationsWebSocket } from '@/hooks/useNotificationsWebSocket';
import { usePermission } from '@/hooks/usePermissions';
import {
  RECURRING_LOCKOUT_BANNER_QUERY_KEY,
  useRecurringLockoutBanner,
} from '@/hooks/useRecurringLockoutBanner';
import { getNotificationTargetPath } from '@/lib/notification-links';

import { SystemBanner } from './SystemBanner';

/**
 * Get initials from display name
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getBannerDismissKey(banner: BannerSettings): string {
  return `system-banner-dismissed-${banner.id}-${banner.lastUpdatedDateTime}`;
}

function formatNotificationTime(value: string): string {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(dt);
}

const Header = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout, login, isAuthenticated } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  const { data: banner } = useQuery({
    queryKey: ['banner', 'active'],
    queryFn: fetchActiveBanner,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const recurringLockoutBanner = useRecurringLockoutBanner();
  const {
    notifications,
    unreadCount,
    markRead,
    dismiss,
    markAllRead,
    dismissAll,
    isMutating: isMutatingNotifications,
    invalidate: invalidateNotifications,
  } = useNotifications({
    includeRead: true,
    page: 1,
    pageSize: 12,
  });
  const canBypassRecurringLockout = usePermission(
    PERMISSIONS.ACTIVITIES.BYPASS_RECURRING_LOCKOUT
  );

  const visibleBanner = useMemo(() => {
    if (!banner) {
      return null;
    }

    if (banner.isDismissible && isDismissed) {
      return null;
    }

    return banner;
  }, [banner, isDismissed]);

  const visibleRecurringLockoutBanner = useMemo(() => {
    if (!recurringLockoutBanner) {
      return null;
    }

    const content = canBypassRecurringLockout
      ? appendRecurringLockoutBypassNotice(recurringLockoutBanner.content)
      : recurringLockoutBanner.content;

    return {
      id: recurringLockoutBanner.id,
      isActive: recurringLockoutBanner.isActive,
      content,
      backgroundColor: recurringLockoutBanner.backgroundColor,
      textColor: recurringLockoutBanner.textColor,
      variant: recurringLockoutBanner.variant,
      isDismissible: false,
      dismissScope: 'persistent',
      startDateTime: null,
      endDateTime: null,
      createdDateTime: recurringLockoutBanner.createdDateTime,
      lastUpdatedDateTime: recurringLockoutBanner.lastUpdatedDateTime,
    } satisfies BannerSettings;
  }, [canBypassRecurringLockout, recurringLockoutBanner]);

  useBannerSettingsWebSocket({
    onSystemBannerSettingsUpdated: () => {
      void queryClient.invalidateQueries({ queryKey: ['banner', 'active'] });
    },
    onRecurringLockoutBannerSettingsUpdated: () => {
      void queryClient.invalidateQueries({
        queryKey: RECURRING_LOCKOUT_BANNER_QUERY_KEY,
      });
    },
  });

  useNotificationsWebSocket({
    onNotificationsChanged: () => {
      invalidateNotifications();
    },
  });

  useEffect(() => {
    if (!banner || !banner.isDismissible) {
      setIsDismissed(false);
      return;
    }

    try {
      const storage =
        banner.dismissScope === 'session' ? sessionStorage : localStorage;
      setIsDismissed(storage.getItem(getBannerDismissKey(banner)) === 'true');
    } catch {
      setIsDismissed(false);
    }
  }, [banner]);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const height = headerRef.current?.offsetHeight ?? 56;
      document.documentElement.style.setProperty(
        '--header-height',
        `${height}px`
      );
    };

    updateHeaderHeight();

    const observer =
      typeof ResizeObserver !== 'undefined' && headerRef.current
        ? new ResizeObserver(() => {
            updateHeaderHeight();
          })
        : null;

    if (observer && headerRef.current) {
      observer.observe(headerRef.current);
    }

    window.addEventListener('resize', updateHeaderHeight);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, [visibleBanner, visibleRecurringLockoutBanner]);

  const handleLogout = () => {
    void logout().then(() => {
      void navigate('/login', { replace: true });
    });
  };

  const handleDismissBanner = () => {
    if (!banner || !banner.isDismissible) {
      return;
    }

    setIsDismissed(true);

    try {
      const storage =
        banner.dismissScope === 'session' ? sessionStorage : localStorage;
      storage.setItem(getBannerDismissKey(banner), 'true');
    } catch {
      // Ignore storage failures.
    }
  };

  const openNotification = (recipientId: number, path: string | null) => {
    if (!path) {
      return;
    }

    void markRead(recipientId)
      .catch(() => {
        // Ignore failures and still allow navigation.
      })
      .finally(() => {
        void navigate(path);
      });
  };

  return (
    <div
      ref={headerRef}
      className="bg-background sticky top-0 z-50 w-full shrink-0 border-b-2 border-[#f4f4f4]"
    >
      {visibleBanner && (
        <SystemBanner
          banner={visibleBanner}
          onDismiss={
            visibleBanner.isDismissible ? handleDismissBanner : undefined
          }
          className="border-b border-black/10"
        />
      )}

      {visibleRecurringLockoutBanner && (
        <SystemBanner
          banner={visibleRecurringLockoutBanner}
          icon={canBypassRecurringLockout ? Pencil : PencilOff}
          className="border-b border-black/10"
        />
      )}

      <header className="box-border flex h-14 w-full items-center px-4 py-2 md:px-20">
        <Link to="/" className="shrink-0">
          <img
            src={logo}
            alt="Logo"
            className="mr-4 h-8 w-auto object-contain sm:h-9 md:h-10"
          />
        </Link>

        <div className="ml-auto flex items-center gap-4">
          {isAuthenticated && user && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-slate-600"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                    <span className="sr-only">Notifications</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[26rem] p-0">
                  <div className="flex items-center justify-between px-3 py-2">
                    <p className="text-sm font-semibold">Notifications</p>
                    <p className="text-muted-foreground text-xs">
                      {unreadCount} unread
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="max-h-80 overflow-y-auto p-2">
                    {notifications.length === 0 && (
                      <p className="text-muted-foreground px-2 py-6 text-center text-sm">
                        No notifications
                      </p>
                    )}

                    {notifications.map((item) => (
                      <div
                        key={item.recipientId}
                        className="border-border mb-2 rounded-md border px-2 py-2"
                      >
                        {getNotificationTargetPath(item) ? (
                          <button
                            type="button"
                            className="text-left"
                            onClick={() =>
                              openNotification(
                                item.recipientId,
                                getNotificationTargetPath(item)
                              )
                            }
                          >
                            <p className="text-sm leading-5">{item.summary}</p>
                          </button>
                        ) : (
                          <p className="text-sm leading-5">{item.summary}</p>
                        )}
                        <p className="text-muted-foreground mt-1 text-xs">
                          {formatNotificationTime(item.createdAt)}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          {item.status === 'unread' && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isMutatingNotifications}
                              onClick={() => {
                                void markRead(item.recipientId);
                              }}
                            >
                              Mark read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isMutatingNotifications}
                            onClick={() => {
                              void dismiss(item.recipientId);
                            }}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <DropdownMenuSeparator />
                  <div className="flex items-center justify-between gap-2 px-2 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        void navigate('/notifications');
                      }}
                    >
                      View all
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={
                          isMutatingNotifications || notifications.length === 0
                        }
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
                        disabled={
                          isMutatingNotifications || notifications.length === 0
                        }
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
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {getInitials(user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-medium text-slate-700 sm:inline">
                      {user.displayName}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.displayName}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                      <p className="text-xs text-slate-400">{user.roleName}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {import.meta.env.DEV && (
                    <>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Switch user
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-56">
                          {MOCK_USERS.map((mockUser) => (
                            <DropdownMenuItem
                              key={mockUser.username}
                              className="cursor-pointer"
                              onClick={() =>
                                void login(mockUser.username, 'dev')
                              }
                            >
                              <div className="flex flex-col space-y-0.5">
                                <p className="text-sm font-medium">
                                  {mockUser.displayName}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {mockUser.role}
                                </p>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <SidebarTrigger className="md:hidden" />
        </div>
      </header>
    </div>
  );
};

export default Header;
