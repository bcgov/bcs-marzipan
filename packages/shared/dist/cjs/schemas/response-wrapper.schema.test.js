"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const zod_1 = require("zod");
const response_wrapper_schema_1 = require("./response-wrapper.schema");
(0, vitest_1.describe)('createResponseWrapperSchema', () => {
    const dataSchema = zod_1.z.object({ id: zod_1.z.number(), name: zod_1.z.string() });
    const wrapperSchema = (0, response_wrapper_schema_1.createResponseWrapperSchema)(dataSchema);
    (0, vitest_1.it)('accepts valid { success: true, data }', () => {
        const input = { success: true, data: { id: 1, name: 'Test' } };
        const result = wrapperSchema.parse(input);
        (0, vitest_1.expect)(result).toEqual(input);
    });
    (0, vitest_1.it)('rejects success: false', () => {
        (0, vitest_1.expect)(() => wrapperSchema.parse({ success: false, data: { id: 1, name: 'Test' } })).toThrow();
    });
    (0, vitest_1.it)('rejects missing data', () => {
        (0, vitest_1.expect)(() => wrapperSchema.parse({ success: true })).toThrow();
    });
    (0, vitest_1.it)('rejects wrong data shape', () => {
        (0, vitest_1.expect)(() => wrapperSchema.parse({ success: true, data: { id: 'x', name: 123 } })).toThrow();
    });
    (0, vitest_1.it)('rejects wrong data shape (missing required field)', () => {
        (0, vitest_1.expect)(() => wrapperSchema.parse({ success: true, data: { id: 1 } })).toThrow(); // name is required
    });
});
(0, vitest_1.describe)('createArrayResponseWrapperSchema', () => {
    const itemSchema = zod_1.z.object({ id: zod_1.z.number() });
    const arrayWrapperSchema = (0, response_wrapper_schema_1.createArrayResponseWrapperSchema)(itemSchema);
    (0, vitest_1.it)('accepts valid { success: true, data: [] }', () => {
        const input = { success: true, data: [] };
        const result = arrayWrapperSchema.parse(input);
        (0, vitest_1.expect)(result).toEqual(input);
    });
    (0, vitest_1.it)('accepts valid { success: true, data: [items] }', () => {
        const input = { success: true, data: [{ id: 1 }, { id: 2 }] };
        const result = arrayWrapperSchema.parse(input);
        (0, vitest_1.expect)(result).toEqual(input);
    });
    (0, vitest_1.it)('rejects success: false', () => {
        (0, vitest_1.expect)(() => arrayWrapperSchema.parse({ success: false, data: [] })).toThrow();
    });
    (0, vitest_1.it)('rejects missing data', () => {
        (0, vitest_1.expect)(() => arrayWrapperSchema.parse({ success: true })).toThrow();
    });
    (0, vitest_1.it)('rejects wrong item shape in array', () => {
        (0, vitest_1.expect)(() => arrayWrapperSchema.parse({ success: true, data: [{ id: 'x' }] })).toThrow();
    });
});
