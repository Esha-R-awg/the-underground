interface Props {
  paused: boolean;
  speed: 1 | 2;
  onTogglePause: () => void;
  onStep: () => void;
  onToggleSpeed: () => void;
  onReset: () => void;
}

export function Controls({ paused, speed, onTogglePause, onStep, onToggleSpeed, onReset }: Props) {
  return (
    <div className="controls">
      <button className="ctl-btn" onClick={onTogglePause} title="Pause or resume time">
        {paused ? '▶ Play' : '⏸ Pause'}
      </button>
      <button className="ctl-btn" onClick={onStep} disabled={!paused} title="Advance one tick while paused">
        ⏭ Step
      </button>
      <button className="ctl-btn" onClick={onToggleSpeed} title="Change simulation speed">
        {speed}×
      </button>
      <button className="ctl-btn" onClick={onReset} title="Restart the village from the beginning">
        ↺ Reset
      </button>
    </div>
  );
}
