import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/contexts/AuthContext";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Hotel Billing Admin",
  description: "Hotel billing management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SessionProvider>{children}</SessionProvider>
        </Providers>
      </body>
    </html>
  );
}
