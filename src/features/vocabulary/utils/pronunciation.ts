/** Show authored respelling. Strip fake IPA slashes from older seed rows. */
export function displayPronunciation(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const unwrapped = trimmed.replace(/^\/(.+)\/$/s, '$1').trim();
  return unwrapped || null;
}
