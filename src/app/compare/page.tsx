import type { Metadata } from 'next';
import { CompareView } from '@/components/content/CompareView';

export const metadata: Metadata = { title: 'Compare products', description: 'Compare IEMs side by side — price, drivers, impedance and more.', robots: { index: false } };

export default function ComparePage() {
  return <CompareView />;
}
