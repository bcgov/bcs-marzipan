import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, NetworkError } from '../api/errors';
import {
  getFriendlyErrorMessage,
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from './error-toast';

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
      duration: 5000,
    });
    expect(mockToast.warning).not.toHaveBeenCalled();
  });

  it('calls toast.warning for ApiError 409 (Conflict)', () => {
    showErrorToast(createApiError({ status: 409, detail: 'Conflict' }));

    expect(mockToast.warning).toHaveBeenCalledTimes(1);
    expect(mockToast.warning).toHaveBeenCalledWith('Conflict', {
      description: 'Conflict',
      duration: 7000,
    });
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it('calls toast.error with server message for ApiError 500', () => {
    showErrorToast(createApiError({ status: 500, detail: 'Internal error' }));

    expect(mockToast.error).toHaveBeenCalledTimes(1);
    expect(mockToast.error).toHaveBeenCalledWith('Server Error', {
      description: 'Server error. Please try again later.',
      duration: 8000,
    });
  });

  it('calls toast.warning for NetworkError with correct title and message', () => {
    showErrorToast(new NetworkError('Connection failed'));

    expect(mockToast.warning).toHaveBeenCalledTimes(1);
    expect(mockToast.warning).toHaveBeenCalledWith('Connection Error', {
      description:
        'Unable to connect to server. Please check your connection and try again.',
      duration: 6000,
    });
  });

  it('calls toast.error for generic Error with message', () => {
    showErrorToast(new Error('Something broke'));

    expect(mockToast.error).toHaveBeenCalledTimes(1);
    expect(mockToast.error).toHaveBeenCalledWith('Error', {
      description: 'Something broke',
      duration: 5000,
    });
  });

  it('uses customMessage when provided', () => {
    showErrorToast(
      createApiError({ status: 404, detail: 'Not found' }),
      'Custom'
    );

    expect(mockToast.error).toHaveBeenCalledWith('Not Found', {
      description: 'Custom',
      duration: 5000,
    });
  });

  it('calls toast.warning for ApiError 429 (Too Many Requests)', () => {
    showErrorToast(createApiError({ status: 429, detail: 'Rate limited' }));

    expect(mockToast.warning).toHaveBeenCalledTimes(1);
    expect(mockToast.warning).toHaveBeenCalledWith('Too Many Requests', {
      description: 'Too many requests. Please wait a moment and try again.',
      duration: 6000,
    });
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it('calls toast.error for string error input', () => {
    showErrorToast('raw string');

    expect(mockToast.error).toHaveBeenCalledTimes(1);
    expect(mockToast.error).toHaveBeenCalledWith('Error', {
      description: 'raw string',
      duration: 5000,
    });
  });
});

describe('showSuccessToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls toast.success with title and description and duration 3000', () => {
    showSuccessToast('Saved successfully');

    expect(mockToast.success).toHaveBeenCalledTimes(1);
    expect(mockToast.success).toHaveBeenCalledWith('Success', {
      description: 'Saved successfully',
      duration: 3000,
    });
  });

  it('accepts custom title', () => {
    showSuccessToast('Done', 'All good');

    expect(mockToast.success).toHaveBeenCalledWith('All good', {
      description: 'Done',
      duration: 3000,
    });
  });
});

describe('showInfoToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls toast.info with title and description and duration 4000', () => {
    showInfoToast('Processing...');

    expect(mockToast.info).toHaveBeenCalledTimes(1);
    expect(mockToast.info).toHaveBeenCalledWith('Info', {
      description: 'Processing...',
      duration: 4000,
    });
  });

  it('accepts custom title', () => {
    showInfoToast('Details here', 'Notice');

    expect(mockToast.info).toHaveBeenCalledWith('Notice', {
      description: 'Details here',
      duration: 4000,
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
