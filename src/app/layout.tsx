import type { Metadata } from "next";
import { Rubik, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

const TITLE = "קיצור קישורים";
const DESC =
  "קישור אחד יציב, יעד שמתחלף מתי שרוצים, וכל לחיצה נספרת. עם קוד QR, בונה UTM ופיקסל.";

export const metadata: Metadata = {
  metadataBase: new URL(`https://${process.env.NEXT_PUBLIC_SHORT_HOST || "localhost:3000"}`),
  title: TITLE,
  description: DESC,
  robots: { index: false, follow: false },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: `https://${process.env.NEXT_PUBLIC_SHORT_HOST || "localhost:3000"}`,
    siteName: "קיצור קישורים",
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
