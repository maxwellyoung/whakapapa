import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Load fonts via CSS imports for better control
// Sentient for display headings, General Sans for body text

export const metadata: Metadata = {
  title: "Whakapapa - Family Knowledge Base",
  description: "Preserve your family's stories with AI. An elegant genealogy app for capturing the memories, relationships, and wisdom that make us who we are.",
  keywords: ["family tree", "genealogy", "family history", "AI", "stories", "whakapapa", "ancestry"],
  authors: [{ name: "Maxwell Young", url: "https://github.com/maxwellyoung" }],
  creator: "Maxwell Young",
  manifest: "/manifest.json",
  metadataBase: new URL("https://whakapapa.vercel.app"),
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Whakapapa",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Whakapapa",
    title: "Whakapapa - Family Knowledge Base",
    description: "Preserve your family's stories with AI. An elegant genealogy app for capturing the memories, relationships, and wisdom that make us who we are.",
    url: "https://whakapapa.vercel.app",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Whakapapa - AI-powered family knowledge base",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Whakapapa - Family Knowledge Base",
    description: "Preserve your family's stories with AI. An elegant genealogy app for capturing the memories, relationships, and wisdom that make us who we are.",
    images: ["/og-image.png"],
    creator: "@maxtheyoung",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#0c0a09" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster richColors position="bottom-right" />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

function ServiceWorkerRegistration() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function() {
                // Service worker registration failed, continuing without it
              });
            });
          }
        `,
      }}
    />
  );
}
