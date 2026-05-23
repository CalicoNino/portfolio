import { useState } from "react";

export function InfoTooltip({ sketchLink, author, license }: { sketchLink: string; author?: string; license?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex-shrink-0">
      {open && <div className="fixed inset-0 z-[190]" onPointerDown={() => setOpen(false)} />}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="relative z-[200] text-white/30 hover:text-white/60 text-[11px] w-4 h-4 flex items-center justify-center transition-colors cursor-pointer leading-none"
        title="Attribution"
      >ℹ</button>
      {open && (
        <div className="absolute z-[200] top-1/2 -translate-y-1/2 left-full ml-2 bg-black/90 backdrop-blur-md border border-white/20 rounded-lg p-2.5 shadow-xl whitespace-nowrap pointer-events-auto">
          {author && <div className="text-[10px] font-mono text-white/90 mb-0.5">{author}</div>}
          {license && <div className="text-[9px] font-mono text-white/60 mb-2">{license}</div>}
          <a href={sketchLink} target="_blank" rel="noopener noreferrer"
            className="text-[10px] font-mono text-cyan-300 hover:text-cyan-200 underline"
          >View on Sketchfab ↗</a>
        </div>
      )}
    </div>
  );
}

export function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[8px] font-mono text-white/30 w-5">{label}</span>
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-cyan-400/50 rounded-full" style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
}

export function TBtn({ k, children, className, pressKey, releaseKey }: {
  k: string; children: React.ReactNode; className?: string;
  pressKey: (k: string) => void; releaseKey: (k: string) => void;
}) {
  return (
    <button
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pressKey(k); }}
      onPointerUp={() => releaseKey(k)}
      onPointerLeave={() => releaseKey(k)}
      onPointerCancel={() => releaseKey(k)}
      onContextMenu={(e) => e.preventDefault()}
      className={`flex items-center justify-center w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm border border-white/25 text-white text-2xl active:bg-white/20 select-none touch-none cursor-pointer ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
