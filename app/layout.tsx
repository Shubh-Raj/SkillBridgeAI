import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";
import "./globals.css";

const monaSans = Mona_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mona-sans",
});


export const metadata: Metadata = {
  title: "SkillBridge",
  description: "An AI-powered platform for preparing for mock interviews.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${monaSans.className} antialiased pattern`}
      >
        {children}
      </body>
    </html>
  );
}
