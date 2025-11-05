import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Authentication',
  description: 'Admin authentication check page',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
  // No canonical URL - this page should not be indexed
};

export default function AdminAuthCheckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

