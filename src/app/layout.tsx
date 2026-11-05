import type { Metadata } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";

const letra = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Escuela de regularización",
  description: "Explicaciones claras de los temas de la SEP, con Maestro en vivo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body className={letra.className}>{children}</body>
    </html>
  );
}
