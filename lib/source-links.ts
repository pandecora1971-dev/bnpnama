// People often paste "www.site.com/…" or "site.com/…" without a scheme, wrap a link in
// quotes or brackets, or end it with sentence punctuation. Tidy that up before validating.
export function normalizeSourceLink(raw: string) {
  let value = raw
    .trim()
    .replace(/^[<(\["'“‘]+/, "")
    .replace(/[>\]"'”’.,;:!?।]+$/, "");
  if (value && !/^[a-z][a-z0-9+.-]*:/i.test(value) && /^[^\s/]+\.[^\s/]+/.test(value))
    value = `https://${value}`;
  return value;
}

export const MAX_SOURCE_LINKS = 5;

// A public web page: http(s), a dotted hostname and no embedded login.
export function isAcceptableSourceLink(value: string) {
  if (value.length > 2000) return false;
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname.includes(".") &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

// Same rule as the server, run in the browser so mistakes are shown before submitting.
export function sourceLinksProblem(links: string[]) {
  if (links.length > MAX_SOURCE_LINKS) return "সর্বোচ্চ ৫টি সংবাদলিংক দিন।";
  const bad = links.find((link) => !isAcceptableSourceLink(link));
  return bad ? `এই লিংকটি সঠিক নয়: ${bad.slice(0, 80)}` : "";
}

// Splits the free-text field into links: one per line, or separated by spaces.
// Words that cannot be a web address (no dot, no scheme) are ignored.
export function splitSourceLinks(text: string) {
  return text
    .split(/\s+/)
    .map(normalizeSourceLink)
    .filter((link) => link.includes(".") || link.includes("://"));
}
