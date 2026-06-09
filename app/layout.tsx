import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AuthProvider } from "@/components/layout/auth-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Aura — Track Your Carbon Footprint | India",
  description: "Track, reduce, and share your carbon impact with AI-powered insights. Sourced with Indian emission factors for auto-rickshaws, metros, paneer, and biryani.",
  keywords: ["carbon footprint", "india", "sustainability", "climate change", "carbon tracker", "gemini ai"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(inter.variable, spaceGrotesk.variable)}
    >
      <body className="min-h-screen flex flex-col antialiased font-sans bg-background text-foreground transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Navbar />
            {/* Nav height buffer */}
            <div className="h-18.25" />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
