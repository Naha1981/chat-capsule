import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
});

// Hanken Grotesk - use local or Google Fonts
const hankenGrotesk = localFont({
  src: [
    {
      path: "../fonts/HankenGrotesk-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/HankenGrotesk-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/HankenGrotesk-ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-hanken-grotesk",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "CapsuleFlow AI | Autonomous Trade Logistics",
  description: "The first AI swarm designed for the African supply chain. Automate SARS compliance, eliminate demurrage, and clear cargo in seconds—not days.",
  keywords: ["CapsuleFlow", "AI", "Logistics", "Multi-Agent", "South Africa", "SARS", "Trade"],
  authors: [{ name: "CapsuleFlow AI" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${hankenGrotesk.variable} antialiased bg-background text-foreground font-sans`}
        style={{ fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
