import { Metadata } from 'next';
import PublicProfileView from '@/components/profile/PublicProfileView';

export async function generateMetadata(
  { params }: { params: { wallet: string } }
): Promise<Metadata> {
  return {
    title: `Profile - ${params.wallet.slice(0, 6)}...`,
    description: 'View user profile on Hoodie Academy',
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function PublicProfilePage({
  params,
}: {
  params: { wallet: string };
}) {
  return <PublicProfileView walletAddress={params.wallet} />;
}

