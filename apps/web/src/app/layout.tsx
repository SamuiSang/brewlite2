// apps/web/src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BrewLite – Cà phê nguyên bản',
  description: 'Hệ thống đặt đồ uống trực tuyến BrewLite – Phong cách Modern Botanical & Scandinavian Minimalist',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-[#F3E8D4] text-[#3F3027] font-sans antialiased selection:bg-[#7D3F32] selection:text-[#FFFAF0]">
        {children}
      </body>
    </html>
  );
}
