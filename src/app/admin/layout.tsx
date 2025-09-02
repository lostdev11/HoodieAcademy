import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Hoodie Academy',
  description: 'Administrative dashboard for Hoodie Academy platform management',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-layout">
      {/* Additional security note - this layout is protected by middleware */}
      {children}
    </div>
  );
}
