import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BrewLite – Đặt Đồ Uống Trực Tuyến (Mobile-first PWA)',
  description: 'Hệ thống đặt đồ uống trực tuyến BrewLite – Next.js PWA, NestJS Modular Monolith & PostgreSQL',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-[#faf8f5] text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
