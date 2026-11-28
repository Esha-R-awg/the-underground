import { useState } from 'react';
import { useSimulation } from './engine/useSimulation';
import { VillageCanvas } from './canvas/VillageCanvas';
import { CharacterPanel } from './components/CharacterPanel';
import { GossipFeed } from './components/GossipFeed';
import { EventButtons } from './components/EventButtons';
import { Controls } from './components/Controls';
import './styles/global.css';

export default function App() {
  const { world, feed, paused, speed, triggerEvent, step, reset, togglePause, toggleSpeed } =
    useSimulation();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedCharacter = world.characters.find(c => c.id === selectedId) ?? null;
  const phase = world.phase === 'day' ? '☀ Day' : '🌙 Night';

  return (
    <div className="app">
      {/* Top toolbar */}
      <div className="toolbar">
        <div className="brand">
          <h1>The Underground</h1>
          <span className="tagline">a village of whispers</span>
        </div>
        <div className="event-group">
          <EventButtons onTrigger={triggerEvent} />
        </div>
        <div className="toolbar-right">
          <Controls
            paused={paused}
            speed={speed}
            onTogglePause={togglePause}
            onStep={step}
            onToggleSpeed={toggleSpeed}
            onReset={reset}
          />
          <div className="tick-info">
            Tick {world.tick} &nbsp;·&nbsp; {phase}
          </div>
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
      <GossipFeed lines={feed} />

      {/* Character panel */}
      <CharacterPanel character={selectedCharacter} world={world} />
    </div>
  );
}
