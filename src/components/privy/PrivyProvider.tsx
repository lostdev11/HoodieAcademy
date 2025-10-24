'use client';

import { PrivyProvider as BasePrivyProvider } from '@privy-io/react-auth';
import { privyConfig } from '@/lib/privy-config';

interface PrivyProviderProps {
  children: React.ReactNode;
}

export function PrivyProvider({ children }: PrivyProviderProps) {
  return (
    <BasePrivyProvider
      appId={privyConfig.appId}
      config={privyConfig}
    >
      {children}
    </BasePrivyProvider>
  );
}
