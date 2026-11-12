// apps/web/src/app/page.tsx
import { redirect } from 'next/navigation';

export default function HomePage() {
  // Tự động điều hướng vào màn hình Thực đơn đồ uống chính (/menu)
  redirect('/menu');
}
