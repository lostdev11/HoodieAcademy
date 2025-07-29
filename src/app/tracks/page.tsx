import Link from 'next/link';

const squads = [
  {
    name: 'Creators',
    emoji: '🎨',
    color: 'from-pink-100 to-pink-200',
    text: 'text-pink-700',
    description: 'Visual Culture & Lore Architects'
  },
  {
    name: 'Decoders',
    emoji: '🧠',
    color: 'from-green-100 to-green-200',
    text: 'text-green-800',
    description: 'Meta Analysts & Alpha Hunters'
  },
  {
    name: 'Raiders',
    emoji: '⚔️',
    color: 'from-cyan-100 to-yellow-100',
    text: 'text-cyan-800',
    description: 'Timeline Tacticians & Meme Warriors'
  },
  {
    name: 'Speakers',
    emoji: '🎤',
    color: 'from-orange-100 to-red-100',
    text: 'text-orange-800',
    description: 'Vibe Leads & Space Hosts'
  }
];

export default function TracksPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-10 text-black">🎓 Choose Your Hoodie Squad</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {squads.map((squad) => (
          <Link key={squad.name} href={`/${squad.name.toLowerCase()}`}>
            <div className={`rounded-xl shadow-lg p-6 bg-gradient-to-br ${squad.color} hover:scale-[1.02] transition cursor-pointer`}>
              <h2 className={`text-2xl font-semibold mb-1 ${squad.text}`}>{squad.emoji} {squad.name}</h2>
              <p className="text-gray-700">{squad.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 