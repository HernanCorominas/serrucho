import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ToastProvider } from "@/components/ui/toast";
import { FeedbackWidget } from "@/components/feedback-modal";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Serrucho — Divide gastos grupales sin enredos 🇩🇴",
  description:
    "Crea tu serrucho, anota quién pagó qué, calcula balances en segundos y envía estados de cuenta transparentes por email o WhatsApp.",
  keywords: ["serrucho", "gastos compartidos", "dominicana", "dividir cuenta", "viajes", "RD$"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Serrucho",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#ea580c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <meta name="apple-mobile-web-app-title" content="Serrucho" />
      </head>
      <body className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased selection:bg-orange-100 selection:text-orange-900">
        <ToastProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <FeedbackWidget />
        </ToastProvider>
      </body>
    </html>
  );
}
