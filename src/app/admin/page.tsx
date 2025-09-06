import AdminDashboardFixed from '../admin-fixed/page';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Main admin page - uses the fixed admin dashboard without infinite loops
export default function AdminPage() {
  return (
    <ErrorBoundary>
      <AdminDashboardFixed />
    </ErrorBoundary>
  );
}