import { useState } from 'react';
import { useSimulation } from './engine/useSimulation';
import { VillageCanvas } from './canvas/VillageCanvas';
import { CharacterPanel } from './components/CharacterPanel';
import { GossipFeed } from './components/GossipFeed';
import { EventButtons } from './components/EventButtons';
import './styles/global.css';

export default function App() {
  const { world, triggerEvent } = useSimulation();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedCharacter = world.characters.find(c => c.id === selectedId) ?? null;

  const phase = world.phase === 'day' ? '☀ Day' : '🌙 Night';

  return (
    <div className="app">
      {/* Top toolbar */}
      <div className="toolbar">
        <h1>The Underground</h1>
        <EventButtons onTrigger={triggerEvent} />
        <div className="tick-info">
          Tick {world.tick} &nbsp;·&nbsp; {phase}
        </div>
      </div>

      {/* Village canvas */}
      <div className="canvas-wrap">
        <VillageCanvas
          world={world}
          selectedId={selectedId}
          onSelectCharacter={setSelectedId}
        />
      </div>

      {/* Gossip feed */}
      <GossipFeed lines={world.gossipFeed} />

      {/* Character panel */}
      <CharacterPanel character={selectedCharacter} world={world} />
    </div>
  );
}
