'use client';

export const dynamic = "force-dynamic";

import { ProfileView } from '@/components/profile/ProfileView';
import TokenGate from '@/components/TokenGate';

export default function ProfilePage() {
  return (
    <TokenGate>
      <ProfileView />
    </TokenGate>
  );
} 