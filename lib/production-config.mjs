/** @param {Record<string, string | undefined>} env */
export function productionErrors(env = process.env) {
  const errors = [];
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32)
    errors.push("SESSION_SECRET");
  if (!/^[^:]+:[a-f0-9]{128}$/.test(env.ADMIN_PASSWORD_HASH || ""))
    errors.push("ADMIN_PASSWORD_HASH");
  if (
    !/^[A-Z2-7]{32,128}$/.test(
      (env.ADMIN_TOTP_SECRET || "").replace(/[\s=]/g, "").toUpperCase(),
    )
  )
    errors.push("ADMIN_TOTP_SECRET");
  try {
    const origin = new URL(env.PUBLIC_ORIGIN || "");
    if (
      origin.protocol !== "https:" ||
      origin.origin !== env.PUBLIC_ORIGIN ||
      origin.username ||
      origin.password
    )
      errors.push("PUBLIC_ORIGIN");
  } catch {
    errors.push("PUBLIC_ORIGIN");
  }
  if (env.COOKIE_SECURE !== "true") errors.push("COOKIE_SECURE=true");
  if (!env.TURNSTILE_SITE_KEY || !env.TURNSTILE_SECRET_KEY)
    errors.push("TURNSTILE_SITE_KEY / TURNSTILE_SECRET_KEY");
  if (!env.DATABASE_URL) errors.push("DATABASE_URL");
  if (!/^[a-f0-9]{64}$/i.test(env.MFA_ENCRYPTION_KEY || ""))
    errors.push("MFA_ENCRYPTION_KEY");
  if (!env.CRON_SECRET || env.CRON_SECRET.length < 32) errors.push("CRON_SECRET");
  if (!env.R2_BUCKET) errors.push("R2_BUCKET");
  if (!env.R2_ACCOUNT_ID && !env.R2_ENDPOINT) errors.push("R2_ACCOUNT_ID");
  if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY)
    errors.push("R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY");
  return errors;
}
export function productionReady() {
  return (
    process.env.NODE_ENV !== "production" || productionErrors().length === 0
  );
}
