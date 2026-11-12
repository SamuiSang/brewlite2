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
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
      },
      colors: {
        brew: {
          primary: '#183B2B',      // Màu xanh rêu chủ đạo chuẩn Figma
          primaryHover: '#234D39', // Màu hover cho nút bấm xanh rêu
          caramel: '#D98236',      // Màu vàng caramel điểm nhấn chuẩn Figma
          caramelHover: '#C47029', // Màu hover cho nút caramel
          linen: '#FBF9F5',        // Màu nền kem linen ấm chuẩn Figma
          card: '#FFFFFF',         // Màu bề mặt thẻ trắng
          text: '#182B22',         // Màu chữ chính đậm chuẩn Figma
          subtext: '#59665F',      // Màu chữ phụ ghi xám chuẩn Figma
          border: '#E5E8E1',       // Màu viền taupe mỏng chuẩn Figma
          badge: '#E8EDE7',        // Màu nền huy hiệu nhạt
          success: '#246344',      // Màu trạng thái thành công
          error: '#B42318',        // Màu trạng thái lỗi
        },
      },
    },
  },
  plugins: [],
};
