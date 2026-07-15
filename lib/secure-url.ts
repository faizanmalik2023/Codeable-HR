/**
 * Upgrade an insecure `http://` asset URL to `https://` so it isn't blocked as
 * mixed content on the https dashboard. The backend's `/files/<token>` proxy URLs
 * are sometimes emitted with an http scheme; images loaded over http on an https
 * page are blocked by the browser (falling back to initials). Only upgrades
 * http→https — leaves https, protocol-relative, relative, and data: URLs untouched.
 */
export function secureUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://")) return "https://" + url.slice("http://".length);
  return url;
}
