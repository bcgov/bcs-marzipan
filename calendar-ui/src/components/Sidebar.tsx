import {
  CalendarDays,
  History,
  NotebookText,
  PanelLeft,
  PanelLeftDashed,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { PERMISSIONS } from '@corpcal/shared';

import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Sidebar as SidebarPrimitive,
  SidebarProvider,
  useSidebar,
} from './ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

const SIDEBAR_PINNED_KEY = 'sidebar_pinned';

function getInitialPinned(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(SIDEBAR_PINNED_KEY);
    return stored === 'true';
  } catch {
    return false;
  }
}

function AppSidebarContent() {
  const location = useLocation();
  const { hasPermission } = useAuth();
  const { setOpenMobile, isMobile } = useSidebar();

  const canViewReports = hasPermission(PERMISSIONS.REPORTS.VIEW);
  const canViewUsers = hasPermission(PERMISSIONS.USERS.VIEW);
  const canViewSettings = hasPermission(PERMISSIONS.SETTINGS.VIEW);

  const closeMobileSidebar = useCallback(() => {
    if (isMobile) setOpenMobile(false);
  }, [isMobile, setOpenMobile]);

  const navItems = [
    { to: '/', label: 'Activities', icon: CalendarDays },
    ...(canViewReports
      ? [{ to: '/reports/look-ahead', label: 'Reports', icon: NotebookText }]
      : []),
    { to: '/global-history', label: 'History', icon: History },
    ...(canViewUsers ? [{ to: '/users', label: 'Users', icon: Users }] : []),
    ...(canViewSettings
      ? [{ to: '/settings', label: 'Admin', icon: SlidersHorizontal }]
      : []),
  ];

  return (
    <>
      <SidebarHeader className="border-sidebar-border border-b" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ to, label, icon: Icon }) => {
                const isActive =
                  to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(to);
                return (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={label}
                      aria-label={label}
                    >
                      <Link to={to} onClick={closeMobileSidebar}>
                        <Icon className="size-6 shrink-0" />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-sidebar-border border-t">
        <SidebarPinButton />
      </SidebarFooter>
    </>
  );
}

function SidebarPinButton() {
  const { pinned, setPinned, setOpen, isMobile } = useSidebar();

  const handleClick = useCallback(() => {
    const next = !pinned;
    setPinned(next);
    setOpen(next);
  }, [pinned, setPinned, setOpen]);

  if (isMobile) return null;

  const label = pinned
    ? 'Unpin sidebar (collapse on leave)'
    : 'Pin sidebar open';
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={handleClick}
          aria-label={label}
        >
          {pinned ? (
            <PanelLeft className="size-4" />
          ) : (
            <PanelLeftDashed className="size-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

const HEADER_HEIGHT = '3.5rem'; // h-14

/**
 * Desktop: hover over sidebar to expand (icons + labels); collapses when mouse leaves unless pinned.
 * Sidebar sits below the top nav (out of flow, fixed), full width header above.
 * Mobile: sheet overlay triggered by SidebarTrigger in header.
 */
export function Sidebar({ children }: { children?: ReactNode }) {
  const [pinned, setPinned] = useState(getInitialPinned);
  const defaultOpen = pinned;

  const [controlledOpen, setControlledOpen] = useState(defaultOpen);

  const syncPinnedFromStorage = useCallback(() => {
    const next = getInitialPinned();
    setPinned(next);
    setControlledOpen(next);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_PINNED_KEY, String(pinned));
    } catch {
      // ignore
    }
  }, [pinned]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === SIDEBAR_PINNED_KEY && e.newValue !== null) {
        const next = e.newValue === 'true';
        setPinned(next);
        setControlledOpen(next);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setControlledOpen(open);
  }, []);

  const handlePinnedChange = useCallback((next: boolean) => {
    setPinned(next);
    setControlledOpen(next);
  }, []);

  const childArray = Array.isArray(children)
    ? children
    : children != null
      ? [children]
      : [];
  const header = childArray[0];
  const main = childArray.slice(1);

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      open={controlledOpen}
      onOpenChange={handleOpenChange}
      pinned={pinned}
      onPinnedChange={handlePinnedChange}
      style={
        {
          '--header-height': HEADER_HEIGHT,
        } as CSSProperties
      }
    >
      {header}
      <div className="flex min-h-0 flex-1">
        <SidebarHoverWrapper pinned={pinned} syncPinned={syncPinnedFromStorage}>
          <SidebarPrimitive collapsible="icon">
            <AppSidebarContent />
          </SidebarPrimitive>
        </SidebarHoverWrapper>
        {main}
      </div>
    </SidebarProvider>
  );
}

function SidebarHoverWrapper({
  children,
  pinned,
  syncPinned,
}: {
  children: React.ReactNode;
  pinned: boolean;
  syncPinned: () => void;
}) {
  const { setOpen, isMobile } = useSidebar();

  useEffect(() => {
    syncPinned();
  }, [syncPinned]);

  const handleMouseEnter = useCallback(() => {
    if (isMobile) return;
    setOpen(true);
  }, [isMobile, setOpen]);

  const handleMouseLeave = useCallback(() => {
    if (isMobile) return;
    if (!pinned) {
      setOpen(false);
    }
  }, [isMobile, pinned, setOpen]);

  return (
    <div
      className="flex h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}
