import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render, screen } from '@/test/test-utils';

// Mock every child admin section so the test only exercises Settings itself.
vi.mock('@/components/admin', () => ({
  BannerSettingsAdmin: () => <div data-testid="banner-section">Banner</div>,
}));
vi.mock('@/components/admin/ActivityCompletionSettingsAdmin', () => ({
  ActivityCompletionSettingsAdmin: () => (
    <div data-testid="activity-completion-section">ActivityCompletion</div>
  ),
}));
vi.mock('@/components/admin/EditLockIdleSettingsAdmin', () => ({
  EditLockIdleSettingsAdmin: () => (
    <div data-testid="edit-lock-section">EditLockIdle</div>
  ),
}));
vi.mock('@/components/admin/LoginModalSettingsAdmin', () => ({
  LoginModalSettingsAdmin: () => (
    <div data-testid="login-modal-section">LoginModal</div>
  ),
}));
vi.mock('@/components/admin/LookAheadResetSettingsAdmin', () => ({
  LookAheadResetSettingsAdmin: () => (
    <div data-testid="look-ahead-section">LookAheadReset</div>
  ),
}));
vi.mock('@/components/admin/ReviewExemptFieldsSettingsAdmin', () => ({
  ReviewExemptFieldsSettingsAdmin: () => (
    <div data-testid="review-exempt-section">ReviewExemptFields</div>
  ),
}));
vi.mock('@/components/admin/LookupAdmins', () => ({
  ActivityStatusesAdmin: () => <div>ActivityStatuses</div>,
  CategoriesAdmin: () => <div>Categories</div>,
  CitiesAdmin: () => <div>Cities</div>,
  CommsMaterialsAdmin: () => <div>CommsMaterials</div>,
  GovernmentRepresentativesAdmin: () => <div>GovernmentRepresentatives</div>,
  MinistriesAdmin: () => <div>Ministries</div>,
  MinistryGroupsAdmin: () => <div>MinistryGroups</div>,
  TagsAdmin: () => <div>Tags</div>,
  ThemesAdmin: () => <div>Themes</div>,
  PermissionsVisibilityAdminSection: () => <div>PermissionsVisibility</div>,
  VenuePresetsAdmin: () => <div>VenuePresets</div>,
}));
vi.mock('@/components/admin/ReportCoverContactSettingsAdmin', () => ({
  ReportCoverContactSettingsAdmin: () => (
    <div data-testid="report-cover-contact-section">ReportCoverContact</div>
  ),
}));

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const SYSTEM_ADMIN_ROLE_ID = 6;
const ADMIN_ROLE_ID = 5;

const SYSTEM_ADMIN_ONLY_LINKS = [
  'System banner',
  'Login modal',
  'Edit lock idle',
  'Activity completion',
  'Look Ahead reset',
  'Review-exempt fields',
  'Permission visibility',
];

const LOOKUP_LINKS = [
  'Report PDF cover contact',
  'Ministry groups',
  'Ministries',
  'Government representatives',
  'Categories',
  'Cities',
  'Communications materials',
  'Tags',
  'Activity statuses',
  'Themes',
  'Venue presets',
];

describe('Settings quick navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('as System Admin', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, roleId: SYSTEM_ADMIN_ROLE_ID },
        hasPermission: () => true,
      });
    });

    it('shows all system-admin-only quick nav links', async () => {
      const { Settings } = await import('./Settings');
      render(<Settings />);

      for (const label of SYSTEM_ADMIN_ONLY_LINKS) {
        expect(
          screen.getByRole('link', { name: new RegExp(label, 'i') })
        ).toBeInTheDocument();
      }
    });

    it('shows all lookup quick nav links', async () => {
      const { Settings } = await import('./Settings');
      render(<Settings />);

      for (const label of LOOKUP_LINKS) {
        expect(
          screen.getByRole('link', { name: new RegExp(label, 'i') })
        ).toBeInTheDocument();
      }
    });
  });

  describe('as Admin (not System Admin)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 2, roleId: ADMIN_ROLE_ID },
        hasPermission: () => true,
      });
    });

    it('hides system-admin-only quick nav links', async () => {
      const { Settings } = await import('./Settings');
      render(<Settings />);

      for (const label of SYSTEM_ADMIN_ONLY_LINKS) {
        expect(
          screen.queryByRole('link', { name: new RegExp(label, 'i') })
        ).not.toBeInTheDocument();
      }
    });

    it('still shows all lookup quick nav links', async () => {
      const { Settings } = await import('./Settings');
      render(<Settings />);

      for (const label of LOOKUP_LINKS) {
        expect(
          screen.getByRole('link', { name: new RegExp(label, 'i') })
        ).toBeInTheDocument();
      }
    });
  });
});
