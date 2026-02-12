/**
 * Centralized user-facing error strings.
 *
 * Single source of truth for error copy to ensure consistency, avoid drift,
 * and allow future i18n. Use with getFriendlyErrorMessage() for caught errors.
 */

/** Generic fallbacks */
export const DEFAULT_ERROR_TITLE = 'Something went wrong';
export const DEFAULT_ERROR_MESSAGE =
  'An unexpected error occurred. Please try again.';
export const TRY_AGAIN_LABEL = 'Try again';
export const ERROR_DETAILS_LABEL = 'Error details';

/** Load activities (EventTable) */
export const LOAD_ACTIVITIES_TITLE = 'Unable to load activities';
export const LOAD_ACTIVITIES_INVALID_RESPONSE =
  "We couldn't load the activity list. Please try again.";

/** Load single activity (EditActivityForm) */
export const LOAD_ACTIVITY_TITLE = 'Unable to load activity';
export const LOAD_ACTIVITY_NO_ID = 'No activity id provided';

/** Activity history */
export const LOAD_HISTORY_TITLE = 'Unable to load history';
export const LOAD_HISTORY_MESSAGE = 'Could not load history.';

/** Address autocomplete */
export const ADDRESS_SEARCH_FAILED = 'Failed to search addresses';
export const ADDRESS_RETRIEVE_FAILED = 'Failed to retrieve address details';

/** Error boundary / render errors */
export const RENDER_FORM_ERROR_TITLE = 'Something went wrong';
export const RENDER_FORM_ERROR_MESSAGE_EDIT =
  'An error occurred while rendering the edit form. Please try again.';
export const RENDER_FORM_ERROR_MESSAGE_CREATE =
  'An error occurred while rendering the form. Please try again.';
export const UNKNOWN_ERROR_FALLBACK = 'An unknown error occurred';

/** Access denied */
export const ACCESS_DENIED_TITLE = 'Access Denied';
export const ACCESS_DENIED_MESSAGE =
  'You do not have permission to access this resource.';
export const ACCESS_DENIED_CREATE_ACTIVITY_MESSAGE =
  'You do not have permission to create activities. Please contact your administrator if you believe this is an error.';

/** Global error boundary - status-specific */
export const NOT_FOUND_TITLE = 'Not Found';
export const NOT_FOUND_MESSAGE = 'The requested resource could not be found.';
export const SERVER_ERROR_TITLE = 'Server Error';
export const SERVER_ERROR_MESSAGE =
  'A server error occurred. Please try again later or contact support if the problem persists.';

/** Router (404 page) */
export const PAGE_NOT_FOUND_TITLE = 'Page Not Found';
export const PAGE_NOT_FOUND_MESSAGE =
  "The page you're looking for doesn't exist or has been moved. Please check the URL or return to the application.";

/** Login */
export const LOGIN_FAILED_FALLBACK = 'Login failed. Please try again.';
