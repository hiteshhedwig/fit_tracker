import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shape Log",
  description: "A private lean muscle and park training tracker."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
