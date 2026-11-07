import type { Metadata } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import { ASISTENTE, ESCUELA } from "@/lib/marca";
import "./globals.css";

const letra = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: ESCUELA,
  description: `Explicaciones claras de los temas de la SEP, con ${ASISTENTE}.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body className={letra.className}>{children}</body>
    </html>
  );
}
