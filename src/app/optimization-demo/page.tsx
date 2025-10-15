import { Metadata } from 'next';
import OptimizationShowcase from '@/components/OptimizationExample';

export const metadata: Metadata = {
  title: 'Performance Optimizations - Hoodie Academy',
  description: 'See how we optimized Hoodie Academy for lightning-fast response times and smooth UX',
};

export default function OptimizationDemoPage() {
  return <OptimizationShowcase />;
}

