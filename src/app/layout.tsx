import type { Metadata } from "next";
import { Montserrat, Archivo, Jacquard_12 } from "next/font/google";
import "./globals.css";
import { ScrollRevealProvider } from "@/components/layout/scroll-reveal-provider";

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
  openGraph: {
    title: "KPSULL - L'antidote a l'uniforme",
    description:
      "Une plateforme reliant createurs de mode locaux et passionnes, offrant des pieces uniques et artisanales, accessibles a vous, chaque jour.",
    siteName: 'Kpsull',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: "KPSULL - L'antidote a l'uniforme",
    description:
      "Une plateforme reliant createurs de mode locaux et passionnes, offrant des pieces uniques et artisanales, accessibles a vous, chaque jour.",
  },
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
        <ScrollRevealProvider />
        {children}
      </body>
    </html>
  );
}
