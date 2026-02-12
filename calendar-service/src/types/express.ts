/**
 * Loads Express Request augmentation (user, dataScope) so that ts-node and any
 * entry point that does not type-check the full project still see the types.
 * Import this once from app bootstrap (e.g. app.module.ts).
 */
/* eslint-disable @typescript-eslint/triple-slash-reference -- augmentation must be loaded via reference; .d.ts is not require-able at runtime */
/// <reference path="./express.d.ts" />
export {};
