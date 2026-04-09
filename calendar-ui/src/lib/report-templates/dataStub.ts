/**
 * Stable, JSON-based echo of template input for placeholder templates and tests.
 * Avoids throwing on common values; returns a sentinel for circular structures.
 */
export function formatTemplateDataStub(data: unknown): string {
  if (data === undefined) return '';
  try {
    return JSON.stringify(data);
  } catch {
    return '["unserializable"]';
  }
}
