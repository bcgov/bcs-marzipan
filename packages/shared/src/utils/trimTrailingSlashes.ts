/**
 * Strips trailing slash characters from the end of `s`.
 *
 * Implemented without regex to avoid CodeQL ReDoS warnings when trimming
 * user-controlled or configuration strings.
 */
export function trimTrailingSlashes(s: string): string {
  let end = s.length;
  while (end > 0 && s[end - 1] === '/') end -= 1;
  return s.slice(0, end);
}
