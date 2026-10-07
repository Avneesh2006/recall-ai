import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { AmbientBackground } from "@/components/AmbientBackground";
import "@/styles/globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["opsz", "SOFT", "WONK"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// viewport-fit=cover lets the page draw edge-to-edge under notches/home
// indicators, which is what makes env(safe-area-inset-*) (used by
// BottomTabBar) resolve to a real value instead of 0.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Recall — don't just save what you found",
  description:
    "Recall is a personal memory and context-preservation platform. Save links, notes, images, and files — and keep the reason you saved them.",
};

// Inline, blocking script: reads the stored theme before paint so there's
// no flash of the wrong theme. Kept tiny and dependency-free on purpose.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("recall-theme");
    var theme = stored === "light" || stored === "dark" ? stored : "dark";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${fraunces.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="relative font-body">
        <AmbientBackground />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
