import type { Metadata, Viewport } from "next";
import { Oswald, Rubik, Dela_Gothic_One } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AuthProvider } from "@/contexts/auth-context";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const delaGothicOne = Dela_Gothic_One({
  variable: "--font-dela",
  subsets: ["latin"],
  weight: "400",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://irvineallstars.com"),
  title: {
    default: "Irvine All-Stars | Irvine Pony Baseball",
    template: "%s | Irvine All-Stars",
  },
  description:
    "Official home of Irvine Pony Baseball All-Stars. Fair selection, transparent process, unforgettable summer. Twelve divisions from Shetland to Pony.",
  openGraph: {
    title: "Irvine All-Stars | Irvine Pony Baseball",
    description:
      "Official home of Irvine Pony Baseball All-Stars. Coach applications, tryout registration, and parent portal for all twelve divisions.",
    siteName: "Irvine All-Stars",
    type: "website",
    url: "https://irvineallstars.com",
  },
  twitter: {
    card: "summary",
    title: "Irvine All-Stars | Irvine Pony Baseball",
    description:
      "Official home of Irvine Pony Baseball All-Stars. Coach applications, tryout registration, and parent portal.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${oswald.variable} ${rubik.variable} ${delaGothicOne.variable} antialiased`}>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
