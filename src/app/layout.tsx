import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";
import { LessonLoaderGlobal } from "@/components/lesson-loader";
import { InlineScript } from "@/components/inline-script";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
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
      className={`${roboto.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <InlineScript
          html={`(function(){try{var t=localStorage.getItem("11cracks-theme");var l=t==="light";document.documentElement.classList.toggle("light",l);document.documentElement.classList.toggle("dark",!l)}catch(e){}})();`}
        />
        <PwaRegister />
        <LessonLoaderGlobal />
        {children}
      </body>
    </html>
  );
}
