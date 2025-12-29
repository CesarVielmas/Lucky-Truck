import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";

import "./globals.css";

const openSans = Noto_Sans({
  subsets:["latin"],
  weight:["300","400","500","600","700","800"]
});

export const metadata: Metadata = {
  title: "Lucky Truck",
  description: "Web application for lucky truck",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={openSans.className}>
        {children}
      </body>
    </html>
  );
}
