"use strict";
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sql = exports.isNotNull = exports.isNull = exports.gt = exports.lt = exports.lte = exports.gte = exports.inArray = exports.and = exports.eq = exports.schema = void 0;
__exportStar(require("./schema"), exports);
__exportStar(require("./client"), exports);
__exportStar(require("./types"), exports);
__exportStar(require("./seed-runner"), exports);
// Export schema object for Drizzle
const schema = __importStar(require("./schema"));
exports.schema = schema;
// Re-export Drizzle helpers from the same instance used by the database package
var drizzle_orm_1 = require("drizzle-orm");
Object.defineProperty(exports, "eq", { enumerable: true, get: function () { return drizzle_orm_1.eq; } });
Object.defineProperty(exports, "and", { enumerable: true, get: function () { return drizzle_orm_1.and; } });
Object.defineProperty(exports, "inArray", { enumerable: true, get: function () { return drizzle_orm_1.inArray; } });
Object.defineProperty(exports, "gte", { enumerable: true, get: function () { return drizzle_orm_1.gte; } });
Object.defineProperty(exports, "lte", { enumerable: true, get: function () { return drizzle_orm_1.lte; } });
Object.defineProperty(exports, "lt", { enumerable: true, get: function () { return drizzle_orm_1.lt; } });
Object.defineProperty(exports, "gt", { enumerable: true, get: function () { return drizzle_orm_1.gt; } });
Object.defineProperty(exports, "isNull", { enumerable: true, get: function () { return drizzle_orm_1.isNull; } });
Object.defineProperty(exports, "isNotNull", { enumerable: true, get: function () { return drizzle_orm_1.isNotNull; } });
Object.defineProperty(exports, "sql", { enumerable: true, get: function () { return drizzle_orm_1.sql; } });
