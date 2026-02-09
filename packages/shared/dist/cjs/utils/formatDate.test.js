"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_1 = require("./index");
(0, vitest_1.describe)('formatDate', () => {
    (0, vitest_1.it)('formats Date to YYYY-MM-DD', () => {
        const d = new Date('2025-06-15T14:30:00.000Z');
        (0, vitest_1.expect)((0, index_1.formatDate)(d)).toBe('2025-06-15');
    });
    (0, vitest_1.it)('formats ISO string to YYYY-MM-DD', () => {
        (0, vitest_1.expect)((0, index_1.formatDate)('2025-06-15T14:30:00.000Z')).toBe('2025-06-15');
    });
    (0, vitest_1.it)('returns empty string for null', () => {
        (0, vitest_1.expect)((0, index_1.formatDate)(null)).toBe('');
    });
    (0, vitest_1.it)('returns empty string for undefined', () => {
        (0, vitest_1.expect)((0, index_1.formatDate)(undefined)).toBe('');
    });
});
(0, vitest_1.describe)('formatDateTime', () => {
    (0, vitest_1.it)('formats Date to ISO string', () => {
        const d = new Date('2025-06-15T14:30:00.000Z');
        (0, vitest_1.expect)((0, index_1.formatDateTime)(d)).toBe('2025-06-15T14:30:00.000Z');
    });
    (0, vitest_1.it)('formats ISO string (round-trip)', () => {
        const iso = '2025-06-15T14:30:00.000Z';
        (0, vitest_1.expect)((0, index_1.formatDateTime)(iso)).toBe(iso);
    });
    (0, vitest_1.it)('returns empty string for null', () => {
        (0, vitest_1.expect)((0, index_1.formatDateTime)(null)).toBe('');
    });
    (0, vitest_1.it)('returns empty string for undefined', () => {
        (0, vitest_1.expect)((0, index_1.formatDateTime)(undefined)).toBe('');
    });
});
