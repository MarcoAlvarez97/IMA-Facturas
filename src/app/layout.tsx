import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IMA Facturas — Emitir facturas a clientes",
  description: "Sistema de facturación IMA Soluciones con cotización BNA automática en USD/ARS.",
  keywords: ["facturación", "IMA", "BNA", "USD", "ARS", "factura"],
  authors: [{ name: "IMA Soluciones" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "IMA Facturas",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  openGraph: {
    title: "IMA Facturas",
    description: "Sistema de facturación con cotización BNA automática",
    siteName: "IMA Facturas",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e40af",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        {/* Sonner — usado por toast.success / toast.error */}
        <SonnerToaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{ duration: 5000 }}
        />
        {/* shadcn/ui Toaster (legacy, por si se usa useToast) */}
        <Toaster />
      </body>
    </html>
  );
}
