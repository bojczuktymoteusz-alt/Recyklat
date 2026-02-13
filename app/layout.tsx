// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recyklat B2B - Giełda Surowców Wtórnych",
  description: "Ogólnopolska platforma handlowa dla surowców wtórnych. Kupuj i sprzedawaj odpady oraz recyklaty w hurcie.",
  manifest: "/site.webmanifest", // Pamiętasz nasze ikonki? To też tu musi być.
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