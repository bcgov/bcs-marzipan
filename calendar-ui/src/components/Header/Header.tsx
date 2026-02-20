import { Bell, ChevronDown, LogOut, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import logo from '../../assets/Logo.svg';
import { useAuth } from '../../hooks/useAuth';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { SidebarTrigger } from '../ui/sidebar';
import { UserSwitcher } from '../UserSwitcher';

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

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    void logout().then(() => {
      void navigate('/login', { replace: true });
    });
  };

  return (
    <header className="box-border flex h-14 w-full items-center border-b-2 border-[#f4f4f4] px-4 py-2 md:px-20">
      <Link to="/" className="shrink-0">
        <img
          src={logo}
          alt="Logo"
          className="mr-4 h-8 w-auto object-contain sm:h-9 md:h-10"
        />
      </Link>

      <div className="ml-auto flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        {isAuthenticated && user && (
          <>
            {/* Dev mode user switcher */}
            <UserSwitcher />

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
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
