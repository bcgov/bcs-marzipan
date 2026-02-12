/**
 * Active Directory auth strategy - PLACEHOLDER
 * To be implemented when AD integration is available.
 *
 * Will validate credentials against AD, create/update local user record,
 * and return user info for JWT building. JWT structure remains the same.
 */

// TODO: Implement AD strategy.
export function validateWithAd(
  _username: string,
  _password: string
): Promise<{ success: boolean; user?: unknown }> {
  return Promise.reject(
    new Error(
      'AD strategy not implemented. Set AUTH_STRATEGY=mock for development.'
    )
  );
}
