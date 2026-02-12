// Shared utility functions
export const formatDate = (date) => {
    if (!date)
        return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
};
export const formatDateTime = (date) => {
    if (!date)
        return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString();
};
// Export schema helpers
export * from './schema-helpers';
