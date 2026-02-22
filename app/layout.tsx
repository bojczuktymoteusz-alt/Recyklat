import type { Metadata } from "next";
import "./globals.css";
import LiveChat from './components/LiveChat';

export const metadata: Metadata = {
  title: "Recyklat B2B - Giełda Surowców Wtórnych",
  description: "Ogólnopolska platforma handlowa dla surowców wtórnych. Kupuj i sprzedawaj odpady oraz recyklaty w hurcie.",
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="antialiased">
        {children}
        {/* Tu dodajemy naszą sprężystą ikonę */}
        <LiveChat />
      </body>
    </html>
  );
}