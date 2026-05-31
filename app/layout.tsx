import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://scottmckendry.tech"),
  title: "scottmckendry.tech",
  description:
    "building things incorrectly, in public. the way it's meant to be.",
  openGraph: {
    title: "scottmckendry.tech",
    description:
      "building things incorrectly, in public. the way it's meant to be.",
    siteName: "scottmckendry.tech",
    locale: "en_NZ",
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "scottmckendry.tech",
    description:
      "building things incorrectly, in public. the way it's meant to be.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <body className={`${jetbrainsMono.variable} font-mono antialiased`}>
        {children}
      </body>
    </html>
  );
}
