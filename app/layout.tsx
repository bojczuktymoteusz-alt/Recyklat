// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recyklat.pl - Giełda Odpadów i Surowców Wtórnych",
  description: "Ogólnopolska giełda recyklingu. Kupuj i sprzedawaj odpady, surowce i recyklaty.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}