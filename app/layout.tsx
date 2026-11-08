import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "বিএনপিনামা | অন্যায়ের বিরুদ্ধে আপনার কণ্ঠ",
  description:
    "বিএনপি-সংশ্লিষ্ট ব্যক্তির বিরুদ্ধে হয়রানি, দুর্নীতি ও অপরাধের অভিযোগ পরিচয় না দিয়ে জমা দিন। বিভাগ, জেলা ও ক্যাটাগরি অনুযায়ী প্রকাশিত অভিযোগ দেখুন।",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
