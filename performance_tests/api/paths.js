/**
 * calendar-service routes (no /api prefix on Nest; use BASE_URL=http://host:3000/api
 * when requests go through the Vite dev proxy).
 */
export const paths = {
  health: '/health',
  ready: '/ready',
  authLogin: '/auth/login',
  authMe: '/auth/me',
  authAzureConfig: '/auth/azure/config',
  users: '/users',
  /** Admin sample: requires settings.manage.look_ahead_reset (Admin + System Admin). */
  settingsLookAheadReset: '/settings/look-ahead-reset',
  activities: '/activities',
  activitiesGlobalHistory: '/activities/global-history',
  /** GET settings requires settings.view */
  loginModalSettings: '/login-modal/settings',
  /** Read-only lookup sample */
  lookupsDateStatuses: '/lookups/date-statuses',
  /** Report definitions (metadata); requires lookups.view */
  lookupsReports: '/lookups/reports',
  /** Look Ahead JSON data; requires reports.view */
  reportDataLookAhead: '/reports/data/look-ahead',
};
