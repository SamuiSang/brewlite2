import { notFound } from 'next/navigation';
import Task5Preview from './preview';

export default function Task5Page() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <Task5Preview />;
}
