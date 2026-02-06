import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SOFHIA Enterprise | Automação Inteligente para Provedores",
  description: "Plataforma SaaS de automação de vendas e suporte via WhatsApp com IA para provedores de internet",
  keywords: ["ISP", "Provedor", "WhatsApp", "IA", "Automação", "Vendas", "Suporte"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full overflow-hidden">
      <body className={`${montserrat.variable} antialiased h-full overflow-hidden`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
