import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, NetworkError } from '../api/errors';
import {
  getFriendlyErrorMessage,
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from './error-toast';
import { TOAST_DURATION_MS } from './toast-durations';

const mockToast = vi.hoisted(() => ({
  error: vi.fn(),
  warning: vi.fn(),
  success: vi.fn(),
  info: vi.fn(),
}));

vi.mock('sonner', () => ({ toast: mockToast }));

function createApiError(
  overrides: Partial<{
    status: number;
    detail: string;
    type: string;
    title: string;
    instance: string;
    correlationId: string;
  }> = {}
) {
  return new ApiError({
    type: 'https://example.com/error',
    title: 'Error',
    status: 500,
    detail: 'Server error',
    instance: '/api/foo',
    correlationId: '',
    ...overrides,
  });
}

describe('showErrorToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls toast.error with title and detail for ApiError (e.g. 404)', () => {
    showErrorToast(createApiError({ status: 404, detail: 'Not found' }));

    expect(mockToast.error).toHaveBeenCalledTimes(1);
    expect(mockToast.error).toHaveBeenCalledWith('Not Found', {
      description: 'Not found',
      duration: TOAST_DURATION_MS.error,
    });
    expect(mockToast.warning).not.toHaveBeenCalled();
  });

  it('calls toast.warning for ApiError 409 (Conflict)', () => {
    showErrorToast(createApiError({ status: 409, detail: 'Conflict' }));

    expect(mockToast.warning).toHaveBeenCalledTimes(1);
    expect(mockToast.warning).toHaveBeenCalledWith('Conflict', {
      description: 'Conflict',
      duration: TOAST_DURATION_MS.error,
    });
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it('calls toast.error with server message for ApiError 500', () => {
    showErrorToast(createApiError({ status: 500, detail: 'Internal error' }));

    expect(mockToast.error).toHaveBeenCalledTimes(1);
    expect(mockToast.error).toHaveBeenCalledWith('Server Error', {
      description: 'Server error. Please try again later.',
      duration: TOAST_DURATION_MS.error,
    });
  });

  it('calls toast.warning for NetworkError with correct title and message', () => {
    showErrorToast(new NetworkError('Connection failed'));

    expect(mockToast.warning).toHaveBeenCalledTimes(1);
    expect(mockToast.warning).toHaveBeenCalledWith('Connection Error', {
      description:
        'Unable to connect to server. Please check your connection and try again.',
      duration: TOAST_DURATION_MS.error,
    });
  });

  it('calls toast.error for generic Error with message', () => {
    showErrorToast(new Error('Something broke'));

    expect(mockToast.error).toHaveBeenCalledTimes(1);
    expect(mockToast.error).toHaveBeenCalledWith('Error', {
      description: 'Something broke',
      duration: TOAST_DURATION_MS.error,
    });
  });

  it('uses customMessage when provided', () => {
    showErrorToast(
      createApiError({ status: 404, detail: 'Not found' }),
      'Custom'
    );

    expect(mockToast.error).toHaveBeenCalledWith('Not Found', {
      description: 'Custom',
      duration: TOAST_DURATION_MS.error,
    });
  });

  it('calls toast.warning for ApiError 429 (Too Many Requests)', () => {
    showErrorToast(createApiError({ status: 429, detail: 'Rate limited' }));

    expect(mockToast.warning).toHaveBeenCalledTimes(1);
    expect(mockToast.warning).toHaveBeenCalledWith('Too Many Requests', {
      description: 'Too many requests. Please wait a moment and try again.',
      duration: TOAST_DURATION_MS.error,
    });
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it('calls toast.error for string error input', () => {
    showErrorToast('raw string');

    expect(mockToast.error).toHaveBeenCalledTimes(1);
    expect(mockToast.error).toHaveBeenCalledWith('Error', {
      description: 'raw string',
      duration: TOAST_DURATION_MS.error,
    });
  });
});

describe('showSuccessToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls toast.success with title and description and duration 5000', () => {
    showSuccessToast('Saved successfully');

    expect(mockToast.success).toHaveBeenCalledTimes(1);
    expect(mockToast.success).toHaveBeenCalledWith('Success', {
      description: 'Saved successfully',
      duration: TOAST_DURATION_MS.success,
    });
  });

  it('accepts custom title', () => {
    showSuccessToast('Done', 'All good');

    expect(mockToast.success).toHaveBeenCalledWith('All good', {
      description: 'Done',
      duration: TOAST_DURATION_MS.success,
    });
  });
});

describe('showInfoToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls toast.info with title and description and default duration', () => {
    showInfoToast('Processing...');

    expect(mockToast.info).toHaveBeenCalledTimes(1);
    expect(mockToast.info).toHaveBeenCalledWith('Info', {
      description: 'Processing...',
      duration: TOAST_DURATION_MS.info,
    });
  });

  it('accepts custom title', () => {
    showInfoToast('Details here', 'Notice');

    expect(mockToast.info).toHaveBeenCalledWith('Notice', {
      description: 'Details here',
      duration: TOAST_DURATION_MS.info,
    });
  });
});

describe('getFriendlyErrorMessage', () => {
  it('returns error.detail for ApiError', () => {
    expect(
      getFriendlyErrorMessage(
        createApiError({ status: 404, detail: 'Not found' })
      )
    ).toBe('Not found');
  });

  it('returns rate limit message for ApiError 429', () => {
    expect(
      getFriendlyErrorMessage(
        createApiError({ status: 429, detail: 'Rate limited' })
      )
    ).toBe('Too many requests. Please wait a moment and try again.');
  });

  it('returns server error message for ApiError 500+', () => {
    expect(
      getFriendlyErrorMessage(
        createApiError({ status: 500, detail: 'Internal error' })
      )
    ).toBe('Server error. Please try again later.');
  });

  it('returns customMessage when provided for ApiError', () => {
    expect(
      getFriendlyErrorMessage(
        createApiError({ status: 404, detail: 'Not found' }),
        'Custom'
      )
    ).toBe('Custom');
  });

  it('returns connection message for NetworkError', () => {
    expect(getFriendlyErrorMessage(new NetworkError('Connection failed'))).toBe(
      'Unable to connect. Please check your connection and try again.'
    );
  });

  it('returns error.message for generic Error', () => {
    expect(getFriendlyErrorMessage(new Error('Something broke'))).toBe(
      'Something broke'
    );
  });

  it('returns the string for string input', () => {
    expect(getFriendlyErrorMessage('raw string')).toBe('raw string');
  });

  it('returns fallback for unknown input', () => {
    expect(getFriendlyErrorMessage(null)).toBe(
      'Something went wrong. Please try again.'
    );
  });
});
