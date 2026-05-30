import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GeoNarrative AI — Conversational GeoAI Digital Twin Platform",
  description:
    "AI-powered geospatial intelligence platform for smart-city analytics, flood risk prediction, and conversational GIS insights. Built for enterprise disaster management and urban planning.",
  keywords: [
    "GeoAI",
    "Digital Twin",
    "Flood Prediction",
    "Smart City",
    "GIS",
    "Geospatial Intelligence",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css"
          rel="stylesheet"
        />
      </head>
      <body className="bg-geo-dark text-gray-100 overflow-hidden">
        {children}
      </body>
    </html>
  );
}
