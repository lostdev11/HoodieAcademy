export const dynamic = "force-dynamic";
import SquadChatClient from './SquadChatClient';

// Generate static params for all possible squad routes
export async function generateStaticParams() {
  const squads = [
    'hoodie-creators',
    'hoodie-decoders', 
    'hoodie-speakers',
    'hoodie-raiders',
    'hoodie-rangers',
    'treasury-builders'
  ];
  
  return squads.map((squad) => ({
    squad: squad,
  }));
}

interface PageProps {
  params: {
    squad: string;
  };
}

export default function SquadChatPage({ params }: PageProps) {
  return <SquadChatClient params={params} />;
} 