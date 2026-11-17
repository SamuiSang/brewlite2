const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const RootLayout = require('../src/app/layout').default;

test('root layout renders without requiring a remote font provider', () => {
  const html = renderToStaticMarkup(
    React.createElement(RootLayout, { children: React.createElement('main', null, 'Content') }),
  );

  expect(html).toContain('<html lang="vi">');
  expect(html).toContain('<main>Content</main>');
});
