import { useEffect, useState } from "react";

export function InfoTooltip({ sketchLink, author, license, position = "right" }: { sketchLink: string; author?: string; license?: string; position?: "right" | "top" }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    document.addEventListener("touchend", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("touchend", close);
    };
  }, [open]);

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        onTouchEnd={(e) => e.stopPropagation()}
        className="text-white/30 hover:text-white/60 w-4 h-4 flex items-center justify-center transition-colors cursor-pointer"
        title="Attribution"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <circle cx="8" cy="8" r="6.5" />
          <line x1="8" y1="7" x2="8" y2="11.5" />
          <circle cx="8" cy="4.75" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute z-[200] bg-black/90 backdrop-blur-md border border-white/20 rounded-lg p-2.5 shadow-xl whitespace-nowrap ${position === "top" ? "bottom-full left-1/2 -translate-x-1/2 mb-2" : "top-1/2 -translate-y-1/2 left-full ml-2"}`}
        >
          {author && <div className="text-[10px] font-mono text-white/60 mb-0.5">{author}</div>}
          {license && <div className="text-[9px] font-mono text-white/35 mb-2">{license}</div>}
          <a href={sketchLink} target="_blank" rel="noopener noreferrer"
            className="text-[10px] font-mono text-cyan-400/80 hover:text-cyan-300 underline"
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
