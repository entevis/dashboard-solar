import type { Metadata } from "next";
import "./globals.css";
import { ThemeRegistry } from "@/lib/mui/theme-registry";

export const metadata: Metadata = {
  title: "Dashboard Solar",
  description: "Sistema de Gestión de Portafolios de Inversión Solar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
