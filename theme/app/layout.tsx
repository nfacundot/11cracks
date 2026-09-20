import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "GOAL50 · Live Sports",
  description:
    "Live scores, schedules and match streaming — mobile UI concept replicated with Next.js",
};

export const viewport: Viewport = { themeColor: "#0c0e05" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${oswald.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
