import React, { useState, useEffect } from 'react';

const squads = ["All", "Decoders", "Raiders", "Speakers", "Creators"];

export default function SquadFilter({ onChange, selectedSquad }: { onChange: (squad: string) => void, selectedSquad?: string }) {
  const [active, setActive] = useState(selectedSquad || "All");

  // Sync with external state
  useEffect(() => {
    if (selectedSquad && selectedSquad !== active) {
      setActive(selectedSquad);
    }
  }, [selectedSquad, active]);

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