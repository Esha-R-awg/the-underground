import { useEffect, useRef } from 'react';

interface Props {
  lines: string[];
}

export function GossipFeed({ lines }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest line
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines.length]);

  return (
    <div className="gossip-feed">
      {lines.length === 0 && (
        <span style={{ color: 'var(--color-text-dim)', fontStyle: 'italic' }}>
          The village is quiet…
        </span>
      )}
      {lines.map((line, i) => (
        <div className="feed-line" key={i}>
          {line}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
