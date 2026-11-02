import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Obra em Ordem | Gestão de obras",
  description: "Gestão financeira e administrativa da construção civil."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}