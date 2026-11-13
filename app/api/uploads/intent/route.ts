import { z } from "zod";
import { query } from "@/lib/db";
import { json, sameOrigin, serverFailure, validSignature } from "@/lib/security";
import { reportSchema } from "@/lib/validation";
import { LIMITS, browserLimit, globalLimit, throttled } from "@/lib/abuse";
import { limitedJson } from "@/lib/uploads";
import { productionReady } from "@/lib/production-config.mjs";
import { UploadError, createIntent } from "@/lib/evidence";
import { fingerprintExists, reportFingerprint } from "@/lib/reports";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const filesSchema = z.array(z.object({ mime: z.string().max(100), size: z.number() })).max(50);
// Step one of a submission: checks the signed form challenge and rejects a bad report before any
// upload starts. There is deliberately no CAPTCHA; abuse is limited by the honeypot, the
// single-use challenge, per-browser and global rate limits, duplicate detection and review.
export async function POST(req: Request) {
  if (!productionReady())
    return json({ error: "সার্ভারের নিরাপত্তা সেটআপ অসম্পূর্ণ।" }, 503);
  if (!sameOrigin(req))
    return json({ error: "অনুমোদিত উৎস থেকে জমা দিন।" }, 403);
  try {
    if (!(await browserLimit("intent", LIMITS.intent))) return throttled(LIMITS.intent.seconds);
    let body: Record<string, unknown>;
    try {
      body = await limitedJson(req, 256 * 1024);
    } catch {
      return json({ error: "রিপোর্ট জমা দেওয়া যায়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।" }, 400);
    }
    if (body.website) return json({ error: "জমা দেওয়া যায়নি।" }, 400);
    const [value, sig] = String(body.challenge || "").split(".");
    const age = Date.now() - Number(value?.split(":")[0]);
    const validChallenge =
      /^\d{13}:[a-f0-9]{48}$/.test(value || "") &&
      /^[a-f0-9]{64}$/.test(sig || "") &&
      validSignature(`report:${value}`, sig);
    if (!validChallenge || age > 3600_000)
      return json({ error: "ফর্মের মেয়াদ শেষ হয়েছে। ফর্মটি বন্ধ করে আবার খুলুন।" }, 400);
    if (age < 1500) return json({ error: "একটু অপেক্ষা করে আবার জমা দিন।" }, 400);
    const parsed = reportSchema.safeParse(body.report);
    if (!parsed.success)
      return json({ error: parsed.error.issues[0].message }, 400);
    const files = filesSchema.safeParse(body.files ?? []);
    if (!files.success) return json({ error: "ফাইলের তালিকা সঠিক নয়।" }, 400);
    if (!(await globalLimit("intent", LIMITS.intent))) return throttled(LIMITS.intent.seconds);
    const { rowCount } = await query(
      "INSERT INTO bnpnama.challenges(nonce,used_at) VALUES($1,$2) ON CONFLICT DO NOTHING",
      [value, Date.now()],
    );
    if (rowCount !== 1)
      return json(
        { error: "এই ফর্মের যাচাইকরণ ব্যবহার হয়েছে। ফর্ম আবার খুলুন।" },
        400,
      );
    if (await fingerprintExists(reportFingerprint(parsed.data)))
      return json({ error: "এই রিপোর্টটি আগেই জমা দেওয়া হয়েছে।" }, 409);
    return json(await createIntent(files.data), 201);
  } catch (error) {
    if (error instanceof UploadError)
      return json({ error: error.message, code: error.code }, error.status, error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {});
    return serverFailure("uploads.intent", error);
  }
}
