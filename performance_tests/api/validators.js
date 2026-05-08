/**
 * Shared assertion helpers for K6 API smoke tests.
 * Keep checks coarse: shape + presence of meaningful fields, no full snapshots.
 */
import { check } from 'k6';

export function isHttp2xx(status) {
  return status >= 200 && status < 300;
}

/** Parse JSON body; returns null on failure. */
export function tryParseJson(body) {
  if (typeof body !== 'string' || body.length === 0) {
    return null;
  }
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

/**
 * @param {import('k6/http').RefinedResponse<import('k6/http').Response>} res
 * @param {number} maxMs
 */
export function timingUnder(res, maxMs) {
  return res.timings.duration < maxMs;
}

/** Current user from GET /auth/me */
export function authMeLooksValid(u) {
  return (
    u &&
    typeof u.id === 'number' &&
    typeof u.username === 'string' &&
    u.username.length > 0
  );
}

/** { success: true, data: ActivityResponse[] } */
export function activityListEnvelope(parsed) {
  return (
    parsed &&
    parsed.success === true &&
    Array.isArray(parsed.data) &&
    parsed.data.length >= 0
  );
}

export function firstActivityId(parsed) {
  const row = parsed?.data?.[0];
  const id = row?.id;
  return typeof id === 'number' ? id : null;
}

/** Paged global history */
export function globalHistoryPagedEnvelope(parsed) {
  const d = parsed?.data;
  return (
    parsed &&
    parsed.success === true &&
    d &&
    typeof d === 'object' &&
    Array.isArray(d.items) &&
    typeof d.page === 'number' &&
    typeof d.pageSize === 'number' &&
    typeof d.hasNext === 'boolean'
  );
}

/** Single activity */
export function activityDetailEnvelope(parsed) {
  const d = parsed?.data;
  return (
    parsed &&
    parsed.success === true &&
    d &&
    typeof d === 'object' &&
    typeof d.id === 'number'
  );
}

/** Activity history: data is array (may be empty) */
export function activityHistoryEnvelope(parsed) {
  return (
    parsed &&
    parsed.success === true &&
    Array.isArray(parsed.data)
  );
}

/** Look-ahead GET */
export function lookAheadEnvelope(parsed) {
  return (
    parsed &&
    typeof parsed === 'object' &&
    Array.isArray(parsed.sections) &&
    Object.prototype.hasOwnProperty.call(parsed, 'report')
  );
}

/** Login-modal settings GET */
export function loginModalSettingsEnvelope(parsed) {
  return (
    parsed &&
    parsed.success === true &&
    Object.prototype.hasOwnProperty.call(parsed, 'data')
  );
}

/** Settings look-ahead-reset GET */
export function lookAheadResetSettingsEnvelope(parsed) {
  const d = parsed?.data;
  return (
    parsed &&
    parsed.success === true &&
    d &&
    typeof d.windowDaysAfterToday === 'number'
  );
}

/** GET /reports — array of report metadata */
export function reportsListIsArray(parsed) {
  return Array.isArray(parsed);
}

/** GET /reports/:id — may be null when not found */
export function reportByIdEnvelope(parsed) {
  if (parsed === null) {
    return true;
  }
  return (
    typeof parsed === 'object' &&
    typeof parsed.id === 'number' &&
    typeof parsed.name === 'string'
  );
}

/** GET /lookups/date-statuses — typical lookup array */
export function lookupsArrayEnvelope(parsed) {
  return (
    parsed &&
    parsed.success === true &&
    Array.isArray(parsed.data)
  );
}

/**
 * Run standard checks for a JSON GET.
 * @param {object} opts
 * @param {import('k6/http').RefinedResponse<import('k6/http').Response>} opts.res
 * @param {string} opts.prefix - check name prefix (group)
 * @param {number} opts.maxMs
 * @param {(parsed: unknown) => boolean} opts.validateBody
 */
export function checkJson2xx({ res, prefix, maxMs, validateBody }) {
  const parsed = tryParseJson(res.body);
  return check(res, {
    [`${prefix} status 2xx`]: (r) => isHttp2xx(r.status),
    [`${prefix} timing < ${maxMs}ms`]: (r) => timingUnder(r, maxMs),
    [`${prefix} JSON + body shape`]: () =>
      parsed !== null && validateBody(parsed),
  });
}

/**
 * Permission-sensitive read: 200 (expect body) or 403.
 */
/** Read-only metadata that may be missing (404) or forbidden (403) in some envs / roles. */
export function checkJson200Or404Or403({ res, prefix, maxMs, validateWhen200 }) {
  const parsed = tryParseJson(res.body);
  return check(res, {
    [`${prefix} 200, 404, or 403`]: (r) =>
      r.status === 200 || r.status === 404 || r.status === 403,
    [`${prefix} timing < ${maxMs}ms`]: (r) => timingUnder(r, maxMs),
    [`${prefix} body when 200`]: () => {
      if (res.status !== 200) {
        return true;
      }
      return parsed !== null && validateWhen200(parsed);
    },
  });
}

export function checkOptionalPermissionJson({
  res,
  prefix,
  maxMs,
  validateWhenOk,
}) {
  const parsed = tryParseJson(res.body);
  return check(res, {
    [`${prefix} 200 or 403`]: (r) =>
      r.status === 200 || r.status === 403,
    [`${prefix} timing < ${maxMs}ms`]: (r) => timingUnder(r, maxMs),
    [`${prefix} body valid when 200`]: () => {
      if (res.status !== 200) {
        return true;
      }
      return parsed !== null && validateWhenOk(parsed);
    },
  });
}
