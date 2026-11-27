export type UserDisplayNameFields = {
  displayName?: string | null;
  adDisplayName?: string | null;
  adUsername?: string | null;
  adEmail?: string | null;
  id?: number;
};

/**
 * Effective user label shown across CorpCal.
 * CorpCal override wins; then AD mirror fields; then email; then id fallback.
 */
export function resolveUserDisplayName(user: UserDisplayNameFields): string {
  return (
    user.displayName?.trim() ||
    user.adDisplayName?.trim() ||
    user.adUsername?.trim() ||
    user.adEmail?.trim() ||
    (user.id != null ? `User ${user.id}` : 'User')
  );
}
