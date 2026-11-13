// apps/web/src/app/layout.tsx
import type { Metadata } from 'next';
import { Lora, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

// Font tiêu đề cổ điển, sang trọng chuẩn bản vẽ Figma Cloud BrewLite 2
const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
});

// Font nội dung thanh lịch, hiện đại chuẩn bản vẽ Figma Cloud BrewLite 2
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
    <html lang="vi" className={`${lora.variable} ${plusJakartaSans.variable}`}>
      <body className="min-h-screen bg-[#F3E8D4] text-[#3F3027] font-sans antialiased selection:bg-[#7D3F32] selection:text-[#FFFAF0]">
        {children}
      </body>
    </html>
  );
}
