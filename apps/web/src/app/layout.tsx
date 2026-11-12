// apps/web/src/app/layout.tsx
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

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
    <html lang="vi" className={plusJakartaSans.variable}>
      <body className="min-h-screen bg-[#FBF9F5] text-[#182B22] font-sans antialiased selection:bg-[#183B2B] selection:text-white">
        {children}
      </body>
    </html>
  );
}
