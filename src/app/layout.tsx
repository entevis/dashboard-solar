import type { Metadata } from "next";
import { Archivo_Narrow } from "next/font/google";
import "./globals.css";
import { ThemeRegistry } from "@/lib/mui/theme-registry";

const archivoNarrow = Archivo_Narrow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-archivo-narrow",
  display: "swap",
});

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
    <html lang="es" className={archivoNarrow.variable}>
      <body className={archivoNarrow.className}>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
