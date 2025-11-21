import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from '@/components/providers/SessionProvider'
import { NotificationProvider } from '@/components/ui/NotificationProvider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PosAI - Sistema Inteligente de Punto de Venta",
  description: "Sistema de punto de venta inteligente para todo tipo de empresas",
  keywords: ["POS", "punto de venta", "inventario", "facturación", "sistema"],
  authors: [{ name: "PosAI Team" }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#4F46E5" />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </SessionProvider>
      </body>
    </html>
  );
}