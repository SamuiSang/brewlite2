/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-lora)', 'Georgia', 'serif'],
        sans: ['var(--font-plus-jakarta-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brew: {
          primary: '#7D3F32',      // Nâu đỏ đất nung chủ đạo chuẩn Figma Cloud
          primaryHover: '#693327', // Nâu đậm khi hover
          linen: '#F3E8D4',        // Nền kem bơ ấm toàn trang chuẩn Figma Cloud
          card: '#FFFAF0',         // Bề mặt thẻ kem sữa chuẩn Figma Cloud
          text: '#3F3027',         // Màu chữ chính nâu cà phê đậm chuẩn Figma Cloud
          subtext: '#786B5A',      // Màu chữ phụ taupe ấm chuẩn Figma Cloud
          accent: '#D9C19B',       // Điểm nhấn be vàng chuẩn Figma Cloud
          border: '#E8D7B8',       // Đường viền be nhạt chuẩn Figma Cloud
          badge: '#E8D7B8',        // Nền huy hiệu và nút tạm hết
          success: '#2E7D32',      // Màu trạng thái thành công
          error: '#B42318',        // Màu trạng thái lỗi
        },
      },
    },
  },
  plugins: [],
};
