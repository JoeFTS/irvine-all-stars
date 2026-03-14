import type { Metadata } from "next";
import { Oswald, Barlow } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://irvineallstars.com"),
  title: {
    default: "Irvine All-Stars | Irvine Pony Baseball",
    template: "%s | Irvine All-Stars",
  },
  description:
    "Official home of Irvine Pony Baseball All-Stars. Fair selection, transparent process, unforgettable summer. Six divisions from 7U to 12U.",
  openGraph: {
    title: "Irvine All-Stars | Irvine Pony Baseball",
    description:
      "Official home of Irvine Pony Baseball All-Stars. Coach applications, tryout registration, and parent portal.",
    siteName: "Irvine All-Stars",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${oswald.variable} ${barlow.variable} antialiased`}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
