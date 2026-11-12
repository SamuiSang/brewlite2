// Run with Playwright MCP browser_run_code using this file as filename; start web dev on port 3101.
async (page) => {
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  await page.goto('http://localhost:3101/dev/ui-states');
  const results = [];
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole('button', { name: 'Đang tải', exact: true }).click();
    check(await page.locator('.skeleton-shimmer').count() === 8, 'Expected eight skeleton cards');
    check(await page.getByRole('status').getAttribute('aria-busy') === 'true', 'Loading must announce busy state');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    check(await page.locator('.skeleton-shimmer').first().evaluate((el) => getComputedStyle(el).animationName) === 'none', 'Reduced motion must disable shimmer');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.getByRole('button', { name: 'Không có kết quả', exact: true }).click();
    check(await page.getByRole('textbox', { name: 'Từ khóa tìm kiếm' }).inputValue() === 'Matcha', 'Expected active search filter');
    await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click();
    check((await page.getByRole('status').innerText()).includes('Từ khóa: (trống)'), 'Reset must clear filter');
    await page.getByRole('button', { name: 'Lỗi kết nối', exact: true }).click();
    check((await page.locator('main [role="alert"]').innerText()).includes('Không thể tải thực đơn'), 'Error must be announced');
    await page.getByRole('button', { name: 'Thử lại', exact: true }).focus();
    await page.keyboard.press('Enter');
    check((await page.getByRole('status').innerText()).includes('Callback đã chạy'), 'Keyboard retry must invoke callback');
    check(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'Page must not overflow');
    results.push({ width, passed: true });
  }
  return results;
}
