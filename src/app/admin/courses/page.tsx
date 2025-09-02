import { Metadata } from 'next';
import AdminCoursesClient from './AdminCoursesClient';

export const metadata: Metadata = {
  title: 'Admin - Course Management',
  description: 'Manage courses, visibility, and track completion statistics',
};

export default function AdminCoursesPage() {
  // No server-side data fetching - handled in client component like main admin dashboard
  return <AdminCoursesClient />;
}
