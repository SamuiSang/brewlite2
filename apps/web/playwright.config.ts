// apps/web/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

/**
 * Cấu hình kiểm thử End-to-End (E2E) bằng Playwright cho BrewLite 2 Frontend (Next.js).
 * Phù hợp với kiến trúc Monorepo và Next.js App Router.
 */
export default defineConfig({
  // Thư mục chứa các kịch bản kiểm thử E2E
  testDir: './tests/e2e',

  // Thời gian chờ tối đa cho mỗi bài kiểm thử (60 giây để đảm bảo ổn định trên mọi môi trường)
  timeout: 60 * 1000,

  expect: {
    // Thời gian chờ tối đa cho các lệnh expect (15 giây)
    timeout: 15 * 1000,
  },

  // Chạy song song có kiểm soát để đảm bảo hiệu năng và không nghẽn tài nguyên CPU
  fullyParallel: true,

  // Nghiêm cấm test.only khi chạy trên môi trường CI để tránh bỏ sót test
  forbidOnly: !!process.env.CI,

  // Số lần thử lại nếu bài test thất bại (chỉ retry trên CI)
  retries: process.env.CI ? 2 : 0,

  // Số lượng worker chạy song song (2 workers ở local để tối ưu hiệu năng)
  workers: process.env.CI ? 1 : 2,

  // Định dạng xuất báo cáo kiểm thử: danh sách dòng lệnh và trang HTML
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  // Cấu hình dùng chung cho tất cả các bài test
  use: {
    // Đường dẫn gốc cho các lệnh điều hướng như page.goto('/')
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',

    // Ghi lại trace khi bài test bị lỗi ở lần thử lại đầu tiên để phục vụ gỡ lỗi
    trace: 'on-first-retry',

    // Chụp ảnh màn hình khi bài test thất bại
    screenshot: 'only-on-failure',

    // Ghi lại video khi bài test thất bại
    video: 'retain-on-failure',

    // Tùy chọn khởi chạy trình duyệt: hỗ trợ làm chậm tốc độ thao tác (mili-giây) để quan sát trực quan
    launchOptions: {
      slowMo: process.env.SLOWMO ? parseInt(process.env.SLOWMO, 10) : 0,
    },
  },

  // Danh sách các thiết bị và trình duyệt cần kiểm thử
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],

  // Tự động khởi động máy chủ Next.js trước khi chạy kiểm thử
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    cwd: __dirname,
  },
});
