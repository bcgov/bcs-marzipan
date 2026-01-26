/**
 * UserSwitcher - Development-only component for switching between mock users
 *
 * This component provides a quick way to test different user roles and permissions
 * during development. It is only rendered in development mode (import.meta.env.DEV).
 *
 * Users are hardcoded from the seed data to avoid an extra API call and to ensure
 * we have representative users for each role level.
 */
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { Users, Loader2 } from 'lucide-react';

/**
 * Mock users from seed data, one representative per role
 */
const MOCK_USERS = [
  // View (role_id: 1)
  { username: 'jane.smith', displayName: 'Jane Smith', role: 'View Only' },
  // Editor (role_id: 2)
  { username: 'priya.patel', displayName: 'Priya Patel', role: 'Editor' },
  // Advanced (role_id: 3)
  { username: 'john.doe', displayName: 'John Doe', role: 'Advanced' },
  // Admin (role_id: 4)
  { username: 'thomas.garcia', displayName: 'Thomas Garcia', role: 'Admin' },
  // System Admin (role_id: 5)
  {
    username: 'daniel.robinson',
    displayName: 'Daniel Robinson',
    role: 'System Admin',
  },
] as const;

/**
 * Get badge variant based on role
 */
function getRoleBadgeVariant(
  role: string
): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (role) {
    case 'System Admin':
      return 'destructive';
    case 'Admin':
      return 'default';
    case 'Advanced':
      return 'secondary';
    default:
      return 'outline';
  }
}

/**
 * UserSwitcher Component
 *
 * Only renders in development mode. Provides a dropdown to quickly switch
 * between different mock users for testing permissions and role-based UI.
 */
export function UserSwitcher() {
  const { user, login, isLoading } = useAuth();
  const [isSwitching, setIsSwitching] = useState(false);

  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  const handleUserSwitch = async (username: string) => {
    if (isSwitching) return;

    setIsSwitching(true);
    try {
      await login(username, 'dev'); // Password doesn't matter in mock mode
    } catch (error) {
      console.error('Failed to switch user:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  const isDisabled = isLoading || isSwitching;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-orange-300 bg-orange-50 px-3 py-1.5">
      <Users className="h-4 w-4 text-orange-600" />
      <span className="text-xs font-medium text-orange-700">DEV:</span>
      <Select
        value={user?.username || ''}
        onValueChange={(value) => void handleUserSwitch(value)}
        disabled={isDisabled}
      >
        <SelectTrigger className="h-8 w-[200px] border-orange-200 bg-white text-sm">
          {isSwitching ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Switching...</span>
            </div>
          ) : (
            <SelectValue placeholder="Select user..." />
          )}
        </SelectTrigger>
        <SelectContent>
          {MOCK_USERS.map((mockUser) => (
            <SelectItem key={mockUser.username} value={mockUser.username}>
              <div className="flex items-center gap-2">
                <span>{mockUser.displayName}</span>
                <Badge
                  variant={getRoleBadgeVariant(mockUser.role)}
                  className="px-1.5 py-0 text-[10px]"
                >
                  {mockUser.role}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
