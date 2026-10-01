import type { Metadata } from "next";
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
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/logo.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/logo.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "IMA Facturas",
    description: "Sistema de facturación con cotización BNA automática",
    siteName: "IMA Facturas",
    type: "website",
  },
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
