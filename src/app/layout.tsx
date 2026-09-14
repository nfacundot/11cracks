import type { Metadata, Viewport } from "next";
import {
  Barlow_Condensed,
  Bebas_Neue,
  Geist,
} from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";
import { LessonLoaderGlobal } from "@/components/lesson-loader";
import { InlineScript } from "@/components/inline-script";
import { SplashScreen } from "@/components/splash-screen";

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: "400",
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "11Cracks - Aprende fútbol",
    template: "%s | 11Cracks",
  },
  description:
    "Plataforma de entrenamiento de fútbol estilo Duolingo: lecciones, juegos interactivos, rachas, equipos y más.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "11Cracks",
  },
  icons: {
    icon: "/img/icons/faviconlit.png",
    shortcut: "/img/icons/faviconlit.png",
    apple: "/img/icons/faviconlit.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${barlow.variable} ${bebasNeue.variable} ${geist.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-[var(--font-barlow)]">
        <InlineScript
          html={`(function(){try{var d=document.documentElement;function stored(){try{return localStorage.getItem("11cracks-theme")}catch(e){return null}}function apply(v){d.classList.toggle("light",!v);d.classList.toggle("dark",v)}function resolve(){var s=stored();if(s===null||s===""){var h=new Date().getHours();apply(h<6||h>=19)}else{apply(s==="dark")}}resolve();setInterval(function(){if(stored())return;resolve()},60000)}catch(e){}})();`}
        />
        <PwaRegister />
        <LessonLoaderGlobal />
        {children}
        <SplashScreen />
        <div id="overlay-root" />
      </body>
    </html>
  );
}
