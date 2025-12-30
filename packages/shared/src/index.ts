export * from './schemas';
export * from './utils';

// Constants - Centralized enum values and types
export * from './constants/activity-enums';

// API Types - Use these for frontend and API contract
// These types represent the API contract, decoupled from the database schema
export * from './api';

// DTOs - Data Transfer Objects for API responses
export * from './dto';

// Database Types - Internal use only (backend database operations)
// These types match the database schema exactly and should only be used internally
// Frontend should use API types from './api' instead
// Automatically re-export all types from database package - no manual sync needed
export type * from '@corpcal/database';
