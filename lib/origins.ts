// The site is reachable as both "example.com" and "www.example.com" (one redirects to the
// other), so every origin/hostname check must accept both forms of PUBLIC_ORIGIN.
const DEFAULT_HOSTS = ["bnpnama.digital"];

function hostVariants(host: string) {
  const bare = host.toLowerCase().replace(/^www\./, "");
  return [bare, `www.${bare}`];
}

/** Hosts (with port, if any) that this deployment is served from. */
export function trustedHosts(): Set<string> {
  const hosts = new Set<string>();
  const configured = process.env.PUBLIC_ORIGIN;
  if (configured) {
    try {
      for (const host of hostVariants(new URL(configured).host)) hosts.add(host);
    } catch {}
  }
  for (const host of DEFAULT_HOSTS.flatMap(hostVariants)) hosts.add(host);
  return hosts;
}

/** Hostnames (no port) that Turnstile may report a solved challenge for. */
export function trustedHostnames(): Set<string> {
  return new Set([...trustedHosts()].map((host) => host.replace(/:\d+$/, "")));
}

export function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}
