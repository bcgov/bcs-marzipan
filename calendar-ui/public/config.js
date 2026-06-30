// Default runtime config for calendar-ui. This file can be replaced per-environment
// by an OpenShift ConfigMap mount to toggle runtime features without rebuilding.
window.__APP_CONFIG__ = {
  ENABLE_SNOWPLOW: 'false', // set to 'true' via ConfigMap when enabling analytics
};
