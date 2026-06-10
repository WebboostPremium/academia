import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://catequesisreinadelapaz.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Catequesis Online | Formación en la fe",
    template: "%s | Catequesis Online",
  },
  description:
    "Plataforma de catequesis para Bautismo, Primera Comunión y Confirmación. Ministerio de Catequesis, Catedral San Miguel.",
  keywords: [
    "catequesis",
    "bautismo",
    "primera comunión",
    "confirmación",
    "catequesis online",
    "catedral san miguel",
  ],
  applicationName: "Catequesis Online",
  icons: {
    icon: [{ url: "/brand/logo-catequesis-online.jpg", type: "image/jpeg" }],
    apple: [{ url: "/brand/logo-catequesis-online.jpg", type: "image/jpeg" }],
    shortcut: "/brand/logo-catequesis-online.jpg",
  },
  openGraph: {
    type: "website",
    locale: "es_SV",
    url: APP_URL,
    siteName: "Catequesis Online",
    title: "Catequesis Online | Formación en la fe",
    description:
      "Prepara los sacramentos de Bautismo, Primera Comunión y Confirmación con la guía de tu parroquia.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1024,
        height: 1024,
        alt: "Catequesis Online — Ministerio de Catequesis, Catedral San Miguel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Catequesis Online | Formación en la fe",
    description:
      "Prepara los sacramentos de Bautismo, Primera Comunión y Confirmación con la guía de tu parroquia.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} bg-background`}
    >
      <body className="min-h-full font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
