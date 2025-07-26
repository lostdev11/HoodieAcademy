import { useState } from 'react';

const squads = ["All", "Decoders", "Raiders", "Speakers", "Creators"];

export default function SquadFilter({ onChange }: { onChange: (squad: string) => void }) {
  const [active, setActive] = useState("All");

  return (
    <div className="flex gap-2 p-4 flex-wrap">
      {squads.map((squad) => (
        <button
          key={squad}
          onClick={() => {
            setActive(squad);
            onChange(squad);
          }}
          className={`px-4 py-1 rounded-full text-sm font-semibold transition border ${
            active === squad
              ? 'bg-black text-white border-black'
              : 'bg-white text-black border-gray-300'
          }`}
        >
          {squad}
        </button>
      ))}
    </div>
  );
} 