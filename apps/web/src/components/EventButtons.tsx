import type { EventKind, LocationId } from '@the-underground/engine';

interface Props {
  onTrigger: (kind: EventKind, location: LocationId) => void;
}

const EVENTS: { kind: EventKind; location: LocationId; label: string }[] = [
  { kind: 'blackout',          location: 'inn',    label: '🕯 Blackout'       },
  { kind: 'missing_bell',      location: 'church', label: '🔔 Missing Bell'   },
  { kind: 'stranger_arrives',  location: 'square', label: '🧥 Stranger Arrives' },
];

export function EventButtons({ onTrigger }: Props) {
  return (
    <>
      {EVENTS.map(({ kind, location, label }) => (
        <button
          key={kind}
          className="event-btn"
          onClick={() => onTrigger(kind, location)}
        >
          {label}
        </button>
      ))}
    </>
  );
}
