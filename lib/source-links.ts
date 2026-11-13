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

// Splits the free-text field into links: one per line, or separated by spaces.
// Words that cannot be a web address (no dot, no scheme) are ignored.
export function splitSourceLinks(text: string) {
  return text
    .split(/\s+/)
    .map(normalizeSourceLink)
    .filter((link) => link.includes(".") || link.includes("://"));
}
