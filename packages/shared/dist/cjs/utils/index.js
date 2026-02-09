"use strict";
// Shared utility functions
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDateTime = exports.formatDate = void 0;
const formatDate = (date) => {
    if (!date)
        return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
};
exports.formatDate = formatDate;
const formatDateTime = (date) => {
    if (!date)
        return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString();
};
exports.formatDateTime = formatDateTime;
// Export schema helpers
__exportStar(require("./schema-helpers"), exports);
