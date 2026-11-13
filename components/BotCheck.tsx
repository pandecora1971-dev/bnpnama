"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
// Turnstile sometimes fails a check (e.g. error 300010 on a flaky network or an unusual
// browser). Retry quietly a couple of times, then let the person retry by hand instead of
// leaving the submit button disabled for good.
const AUTO_RETRIES = 2;
export default function BotCheck({
  siteKey,
  action,
  resetKey,
  onToken,
}: {
  siteKey: string;
  action: "report" | "admin-login";
  resetKey: number;
  onToken: (token: string) => void;
}) {
  const target = useRef<HTMLDivElement>(null);
  const failures = useRef(0);
  const [ready, setReady] = useState(false),
    [scriptFailed, setScriptFailed] = useState(false),
    [error, setError] = useState<string | null>(null),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    failures.current = 0;
  }, [resetKey]);
  useEffect(() => {
    const api = (window as Window & { turnstile?: Turnstile }).turnstile;
    if (!ready || !siteKey || !target.current || !api) return;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    setError(null);
    onToken("");
    const id = api.render(target.current, {
      sitekey: siteKey,
      action,
      theme: "light",
      size: "flexible",
      retry: "never",
      "refresh-expired": "auto",
      callback: (token: string) => {
        failures.current = 0;
        setError(null);
        onToken(token);
      },
      "expired-callback": () => onToken(""),
      "error-callback": (code: string) => {
        onToken("");
        failures.current += 1;
        if (failures.current <= AUTO_RETRIES)
          retryTimer = setTimeout(() => setAttempt((n) => n + 1), 1500);
        else setError(String(code || ""));
        return true;
      },
    });
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      api.remove(id);
    };
  }, [siteKey, action, resetKey, ready, onToken, attempt]);
  if (!siteKey) return null;
  return (
    <div className="bot-check">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
        onError={() => setScriptFailed(true)}
      />
      <div ref={target} />
      {scriptFailed && (
        <p className="error" role="alert">
          নিরাপত্তা যাচাই লোড হয়নি। ইন্টারনেট সংযোগ পরীক্ষা করে পেজটি আবার খুলুন।
        </p>
      )}
      {!scriptFailed && error !== null && (
        <p className="error" role="alert">
          নিরাপত্তা যাচাই সম্পন্ন হয়নি{error ? ` (কোড ${error})` : ""}। আবার চেষ্টা করুন; না হলে অন্য ব্রাউজার বা সংযোগ ব্যবহার করুন।{" "}
          <button
            type="button"
            className="bot-check-retry"
            onClick={() => {
              failures.current = 0;
              setAttempt((n) => n + 1);
            }}
          >
            আবার যাচাই করুন
          </button>
        </p>
      )}
    </div>
  );
}
