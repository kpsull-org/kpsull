import type { Metadata } from "next";
import { Montserrat, Archivo, Jacquard_12 } from "next/font/google";
import "./globals.css";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const jacquard12 = Jacquard_12({
  variable: "--font-jacquard-12",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "KPSULL - L'antidote a l'uniforme",
  description:
    "Une plateforme reliant createurs de mode locaux et passionnes, offrant des pieces uniques et artisanales, accessibles a vous, chaque jour.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${montserrat.variable} ${archivo.variable} ${jacquard12.variable} antialiased`}
      >
        <ImpersonationBanner />
        {children}
      </body>
    </html>
  );
}
