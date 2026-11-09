import { describe, expect, it, vi } from 'vitest';

import { useActivityFilterVisibility } from './useActivityFilterVisibility';
import { useAuth } from './useAuth';

vi.mock('./useAuth');

describe('useActivityFilterVisibility', () => {
  it('should return all filters visible when user has all permissions', () => {
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      pendingLoginModal: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      dismissLoginModal: vi.fn(),
      hasPermission: () => true, // All permissions granted
      hasAnyPermission: () => true,
      hasAllPermissions: () => true,
    });

    const result = useActivityFilterVisibility();

    expect(result.lookAhead).toBe(true);
    expect(result.eventPlanner).toBe(true);
    expect(result.translations).toBe(true);
  });

  it('should hide all filters when user has no permissions', () => {
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      pendingLoginModal: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      dismissLoginModal: vi.fn(),
      hasPermission: () => false, // No permissions granted
      hasAnyPermission: () => false,
      hasAllPermissions: () => false,
    });

    const result = useActivityFilterVisibility();

    expect(result.lookAhead).toBe(false);
    expect(result.eventPlanner).toBe(false);
    expect(result.translations).toBe(false);
  });

  it('should show only eventPlanner and translations for Advanced Viewer', () => {
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      pendingLoginModal: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      dismissLoginModal: vi.fn(),
      hasPermission: (key: string) => {
        // Advanced Viewer has eventPlanner and translations, not look ahead
        return (
          key === 'activities.filter.view_event_planner' ||
          key === 'activities.filter.view_translations'
        );
      },
      hasAnyPermission: () => true,
      hasAllPermissions: () => false,
    });

    const result = useActivityFilterVisibility();

    expect(result.lookAhead).toBe(false);
    expect(result.eventPlanner).toBe(true);
    expect(result.translations).toBe(true);
  });

  it('should show only look ahead for Editor (none of the scoped filters)', () => {
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      pendingLoginModal: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      dismissLoginModal: vi.fn(),
      hasPermission: () => false, // Editors don't have any of the scoped filter permissions
      hasAnyPermission: () => false,
      hasAllPermissions: () => false,
    });

    const result = useActivityFilterVisibility();

    expect(result.lookAhead).toBe(false);
    expect(result.eventPlanner).toBe(false);
    expect(result.translations).toBe(false);
  });
});
