import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

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
        <header className="bg-gray-100 shadow-md px-8 py-4">
          <nav className="flex items-center justify-between max-w-4xl mx-auto">
            <Link href="/" className="text-xl font-bold text-green-600">
              👑 CFQ WOD 👑
            </Link>
            <div className="space-x-12">
              <Link href="/wods" className="text-gray-700 hover:text-green-600">
                WOD
              </Link>
              <Link
                href="/rankings"
                className="text-gray-700 hover:text-green-600"
              >
                랭킹
              </Link>
            </div>
          </nav>
        </header>
        <main className="max-w-4xl mx-auto p-8">{children}</main>
      </body>
    </html>
  );
}
