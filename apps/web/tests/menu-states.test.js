const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const Loading = require('../src/app/loading').default;
const ErrorPage = require('../src/app/error').default;
const MenuEmpty = require('../src/components/menu/MenuEmpty').default;
const { ErrorState } = require('../src/components/UIStates');

// Missing accessible status, exposed error details, or missing recovery must fail.
test('loading announces progress and hides decorative skeletons', () => {
  const html = renderToStaticMarkup(React.createElement(Loading));
  expect(html).toContain('role="status"');
  expect(html).toContain('Đang tải menu');
  expect(html).toContain('aria-hidden="true"');
  expect(html).toContain('motion-safe:animate-pulse');
});

test('empty filtered menu provides a working filter reset', () => {
  let resets = 0;
  const element = MenuEmpty({ onReset: () => { resets += 1; } });
  const html = renderToStaticMarkup(element);
  expect(html).toContain('role="status"');
  expect(html).toContain('Xóa bộ lọc');
  const button = React.Children.toArray(element.props.children)
    .find((child) => child.type === 'button');
  button.props.onClick();
  expect(resets).toBe(1);
});

test('unfiltered empty menu does not offer a dead reset button', () => {
  const html = renderToStaticMarkup(React.createElement(MenuEmpty));
  expect(html).toContain('Chưa có đồ uống');
  expect(html).not.toContain('<button');
});

test('error offers retry without exposing internal error details', () => {
  const html = renderToStaticMarkup(React.createElement(ErrorPage, {
    error: new Error('private database password'),
    reset: () => {},
  }));
  expect(html).toContain('role="alert"');
  expect(html).toContain('Không thể tải thực đơn');
  expect(html).toContain('type="button"');
  expect(html).toContain('Thử lại');
  expect(html).not.toContain('private database password');
});

test('retry invokes the recovery callback', () => {
  let retries = 0;
  const element = ErrorState({ onRetry: () => { retries += 1; } });
  const button = React.Children.toArray(element.props.children)
    .find((child) => child.type === 'button');
  button.props.onClick();
  expect(retries).toBe(1);
});
