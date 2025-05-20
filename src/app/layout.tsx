import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "CFQ WOD",
  description: "CFQ WOD & Ranking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-800 font-sans">
        <Navbar />
        <main className="max-w-4xl mx-auto p-8">{children}</main>
      </body>
    </html>
  );
}
