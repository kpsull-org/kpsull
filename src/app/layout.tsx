import type { Metadata } from "next";
import { Montserrat, Archivo, Jacquard_12 } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
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
        {children}
      </body>
    </html>
  );
}
