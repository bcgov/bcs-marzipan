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
  reports: '/reports',
};
