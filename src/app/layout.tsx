// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import AppProvider from '@/components/providers/AppProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hoodie Academy',
  description: 'Learn Web3 the Hoodie way',
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', url: '/favicon.ico' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0ea5e9' },
    { media: '(prefers-color-scheme: dark)',  color: '#06b6d4' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Fetch initial announcements and settings for the app
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id,title,content,starts_at,ends_at,is_published,created_at,updated_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const { data: globalSettings } = await supabase
    .from("global_settings")
    .select("*")
    .maybeSingle();

  const { data: featureFlags } = await supabase
    .from("feature_flags")
    .select("*");

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProvider
          initialAnnouncements={announcements ?? []}
          initialGlobalSettings={globalSettings ?? {}}
          initialFeatureFlags={featureFlags ?? []}
        >
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
