import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Hoodie Academy',
  description: 'Login to Hoodie Academy',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
  // No canonical URL - login pages should not be indexed
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

