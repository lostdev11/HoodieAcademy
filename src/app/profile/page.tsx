import { Metadata } from 'next';
import { ProfileView } from '@/components/profile/ProfileView';
import TokenGate from '@/components/TokenGate';

export const metadata: Metadata = {
  title: 'Your Profile',
  description: 'Manage your Hoodie Academy profile, view your courses, achievements, and squad status. Track your progress and customize your learning experience.',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: '/profile',
  },
};

export default function ProfilePage() {
  return (
    <TokenGate>
      <ProfileView />
    </TokenGate>
  );
} 