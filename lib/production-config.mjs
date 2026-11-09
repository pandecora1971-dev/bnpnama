/** @param {Record<string, string | undefined>} env */
export function productionErrors(env = process.env) {
  const errors = [];
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32)
    errors.push("SESSION_SECRET");
  if (!/^[^:]+:[a-f0-9]{128}$/.test(env.ADMIN_PASSWORD_HASH || ""))
    errors.push("ADMIN_PASSWORD_HASH");
  if (!env.DATABASE_URL) errors.push("DATABASE_URL");
  if (!/^[a-f0-9]{64}$/i.test(env.MFA_ENCRYPTION_KEY || ""))
    errors.push("MFA_ENCRYPTION_KEY");
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
