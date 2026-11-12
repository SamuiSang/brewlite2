import { notFound } from 'next/navigation';
import UIStatesPreview from './preview';

export default function UIStatesPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <UIStatesPreview />;
}
