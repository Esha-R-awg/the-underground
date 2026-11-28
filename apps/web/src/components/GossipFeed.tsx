import { useEffect, useRef } from 'react';
import type { FeedLine } from '../engine/useSimulation';
import { CHARACTER_COLOURS } from '../canvas/renderer';

interface Props {
  lines: FeedLine[];
}

const NAME_TO_ID: Record<string, string> = {
  Mara: 'mara',
  'Father Edwin': 'father_edwin',
  Tobias: 'tobias',
  Wren: 'wren',
  Odalys: 'odalys',
  Alder: 'alder',
};
const NAME_PATTERN = /(Father Edwin|Mara|Tobias|Wren|Odalys|Alder)/;

/** Colour each villager's name with their token colour. */
function colourise(text: string) {
  return text.split(NAME_PATTERN).map((part, i) => {
    const id = NAME_TO_ID[part];
    if (!id) return <span key={i}>{part}</span>;
    return (
      <span key={i} style={{ color: CHARACTER_COLOURS[id], fontWeight: 700 }}>
        {part}
      </span>
    );
  });
}

export function GossipFeed({ lines }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest line in view
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length]);

  return (
    <div className="gossip-feed" ref={scrollRef}>
      {lines.length === 0 && (
        <span className="feed-empty">The village is quiet… trigger an event and watch the whispers spread.</span>
      )}
      {lines.map((line) => (
        <div className={`feed-line ${line.kind}`} key={line.id}>
          <span className="feed-tick">t{line.tick}</span>
          <span className="feed-text">{colourise(line.text)}</span>
        </div>
      ))}
    </div>
  );
}
