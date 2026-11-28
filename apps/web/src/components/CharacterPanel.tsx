import type { Character, World } from '@the-underground/engine';
import { LOCATION_NAMES } from '@the-underground/engine';
import { CHARACTER_COLOURS } from '../canvas/renderer';

interface Props {
  character: Character | null;
  world: World;
}

function moodColour(mood: number): string {
  if (mood > 0.2) return 'var(--color-positive)';
  if (mood < -0.1) return 'var(--color-negative)';
  return 'var(--color-neutral)';
}

function moodLabel(mood: number): string {
  if (mood > 0.5) return 'Content';
  if (mood > -0.1) return 'Calm';
  if (mood > -0.25) return 'Uneasy';
  if (mood > -0.6) return 'Frightened';
  return 'Terrified';
}

function confidencePct(c: number): string {
  return `${Math.round(c * 100)}%`;
}

function sourceName(heardFrom: string, world: World): string {
  if (heardFrom === 'witnessed') return 'Witnessed directly';
  const c = world.characters.find(x => x.id === heardFrom);
  return c ? `Told by ${c.name}` : `Told by ${heardFrom}`;
}

export function CharacterPanel({ character, world }: Props) {
  if (!character) {
    return (
      <aside className="character-panel">
        <p className="empty-state">Click a character<br />to inspect them.</p>
        <div className="legend">
          <h3>How to read the village</h3>
          <div className="legend-row"><span className="dot gold" />Gold pulse: just witnessed an event</div>
          <div className="legend-row"><span className="dot blue" />Blue pulse: just heard a rumour</div>
          <div className="legend-row"><span className="dot badge">2</span>Number of memories they hold</div>
          <div className="legend-row"><span className="dot red" />Red ring: frightened</div>
          <p className="legend-note">Rumours lose a little confidence every time they are retold.</p>
        </div>
      </aside>
    );
  }

  const colour = CHARACTER_COLOURS[character.id] ?? '#ffffff';
  const moodPct = `${Math.round(((character.mood + 1) / 2) * 100)}%`;

  return (
    <aside className="character-panel">
      {/* Header */}
      <div>
        <h2 style={{ color: colour }}>{character.name}</h2>
        <div className="job">
          {character.job} &middot; at the {LOCATION_NAMES[character.location] ?? character.location}
        </div>
      </div>

      {/* Mood */}
      <div className="panel-section">
        <h3>Mood</h3>
        <div className="bar-row">
          <div className="bar-label">
            <span>{moodLabel(character.mood)}</span>
            <span style={{ color: moodColour(character.mood) }}>
              {character.mood.toFixed(2)}
            </span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: moodPct,
                background: moodColour(character.mood),
              }}
            />
          </div>
        </div>
      </div>

      {/* Memories */}
      <div className="panel-section">
        <h3>Memories ({character.memories.length})</h3>
        {character.memories.length === 0 && (
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>
            Nothing remembered yet.
          </p>
        )}
        {character.memories.map((mem, i) => (
          <div className="memory-card" key={i}>
            <div className="memory-text">{mem.text}</div>
            <div className="memory-source">{sourceName(mem.heardFrom, world)}</div>
            <div className="bar-row">
              <div className="bar-label">
                <span>Confidence</span>
                <span>{confidencePct(mem.confidence)}</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: confidencePct(mem.confidence),
                    background: `hsl(${mem.confidence * 120}, 60%, 55%)`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Relationships */}
      <div className="panel-section">
        <h3>Relationships</h3>
        {Object.entries(character.relationships).map(([otherId, trust]) => {
          const other = world.characters.find(x => x.id === otherId);
          if (!other) return null;
          const pct = `${Math.round(((trust + 1) / 2) * 100)}%`;
          const col = trust > 0.1
            ? 'var(--color-positive)'
            : trust < -0.1
            ? 'var(--color-negative)'
            : 'var(--color-neutral)';
          return (
            <div className="bar-row" key={otherId}>
              <div className="bar-label">
                <span style={{ color: CHARACTER_COLOURS[otherId] ?? '#fff' }}>
                  {other.name}
                </span>
                <span style={{ color: col }}>{trust.toFixed(2)}</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: pct, background: col }} />
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
