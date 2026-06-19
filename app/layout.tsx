import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Cdeez AI Bets",
  description: "AI-powered sports odds, predictions, props, and betting analytics dashboard."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ backgroundColor: "#02040b", color: "#f8fafc" }}>
      <body style={{ backgroundColor: "#02040b", color: "#f8fafc", minHeight: "100vh" }}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
