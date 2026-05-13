import { useQuery } from '@tanstack/react-query';
import { Bell, ChevronDown, LogOut, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { BannerSettings } from '@corpcal/shared/api/types';
import logo from '@corpcal/shared/assets/logo/bc-logo.svg';
import { fetchActiveBanner } from '@/api/bannerApi';
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

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, login, isAuthenticated } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  const { data: banner } = useQuery({
    queryKey: ['banner', 'active'],
    queryFn: fetchActiveBanner,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const visibleBanner = useMemo(() => {
    if (!banner) {
      return null;
    }

    if (banner.isDismissible && isDismissed) {
      return null;
    }

    return banner;
  }, [banner, isDismissed]);

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
  }, [visibleBanner]);

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
              <Button variant="ghost" size="icon" className="text-slate-600">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>

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
