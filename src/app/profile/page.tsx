'use client';

import { ProfileView } from '@/components/profile/ProfileView';
import TokenGate from '@/components/TokenGate';

export default function ProfilePage() {
  return (
    <TokenGate>
      <ProfileView />
    </TokenGate>
  );
} 