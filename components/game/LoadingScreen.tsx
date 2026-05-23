import { useEffect, useState } from "react";
import { Link } from "react-router";

const TIPS = [
  "Use WASD or arrow keys to sail",
  "Drag the helm wheel to steer",
  "Tap the compass rose to snap to north",
  "Explore 12 unique islands",
  "Switch between 10 different ships",
  "Change time of day from the panel",
  "Storm weather makes seas treacherous",
  "Your last position is saved automatically",
];

const CSS = `
@keyframes ls-bob    { 0%,100%{transform:translateY(0) rotate(-2deg) scaleX(1)} 25%{transform:translateY(-12px) rotate(0deg) scaleX(1.02)} 50%{transform:translateY(-6px) rotate(2deg) scaleX(1)} 75%{transform:translateY(-14px) rotate(-1deg) scaleX(0.98)} }
@keyframes ls-fill   { from{width:0%} to{width:100%} }
@keyframes ls-tip    { 0%{opacity:0;transform:translateY(8px)} 12%,88%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-8px)} }
@keyframes ls-glow   { 0%,100%{text-shadow:0 0 20px rgba(100,200,255,0.3),0 0 40px rgba(50,150,255,0.1)} 50%{text-shadow:0 0 30px rgba(120,220,255,0.6),0 0 60px rgba(80,180,255,0.3)} }
@keyframes ls-skull  { 0%,100%{transform:rotate(-5deg) scale(1)} 50%{transform:rotate(5deg) scale(1.05)} }
@keyframes ls-compass{ 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
`;

interface Props {
  onBack?: () => void;
}

export function LoadingScreen({ onBack }: Props) {
  const [tip, setTip]   = useState(0);
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const ti = setInterval(() => setTip(t => (t + 1) % TIPS.length), 2800);
    const di = setInterval(() => setDots(d => (d + 1) % 4), 500);
    return () => { clearInterval(ti); clearInterval(di); };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden select-none pointer-events-none">
      <style>{CSS}</style>

      {/* Title */}
      <h1
        className="font-mono font-bold tracking-[0.35em] text-white mb-1 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
        style={{ fontSize: "clamp(16px,4vw,26px)", animation: "ls-glow 3s ease-in-out infinite" }}
      >
        SETTING SAIL{".".repeat(dots)}
      </h1>

      {/* Skull decorators */}
      <div className="flex items-center gap-3 mb-3">
        <div style={{ animation: "ls-skull 4s ease-in-out infinite", fontSize: "16px", opacity: 0.6 }}>☠️</div>
        <div className="w-24 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)" }} />
        <div style={{ animation: "ls-skull 4s ease-in-out 2s infinite", fontSize: "16px", opacity: 0.6 }}>☠️</div>
      </div>

      {/* Progress bar */}
      <div className="relative w-60 h-1 rounded-full overflow-hidden mb-4"
        style={{ background: "rgba(0,0,0,0.35)", boxShadow: "0 0 8px rgba(0,0,0,0.5)" }}>
        <div className="h-full rounded-full"
          style={{
            animation: "ls-fill 3s linear forwards",
            background: "linear-gradient(to right, #0ea5e9, #38bdf8, #7dd3fc)",
            boxShadow: "0 0 12px rgba(56,189,248,0.8)",
          }} />
      </div>

      {/* Rotating tip */}
      <p
        key={tip}
        className="font-mono text-xs text-center px-10 max-w-xs drop-shadow-[0_1px_6px_rgba(0,0,0,1)]"
        style={{ color: "rgba(180,230,255,0.85)", letterSpacing: "0.05em", animation: "ls-tip 2.8s ease-in-out forwards" }}
      >
        ⚓ {TIPS[tip]}
      </p>

      {/* Slowly rotating compass rose */}
      <div className="absolute bottom-8 right-8 opacity-30" style={{ animation: "ls-compass 20s linear infinite" }}>
        <svg viewBox="0 0 60 60" width="50" height="50">
          <circle cx="30" cy="30" r="28" fill="none" stroke="white" strokeWidth="0.8" />
          <polygon points="30,4 33,30 30,24 27,30" fill="white" />
          <polygon points="30,56 33,30 30,36 27,30" fill="rgba(255,255,255,0.4)" />
          <polygon points="4,30 30,27 24,30 30,33" fill="rgba(255,255,255,0.6)" />
          <polygon points="56,30 30,27 36,30 30,33" fill="rgba(255,255,255,0.6)" />
          <circle cx="30" cy="30" r="3" fill="white" />
        </svg>
      </div>

      {/* Back button — re-enable pointer events for this element only */}
      <div className="absolute top-5 left-5 pointer-events-auto">
        {onBack ? (
          <button
            onClick={onBack}
            className="text-white/40 font-mono text-xs hover:text-white/70 transition-colors cursor-pointer tracking-widest drop-shadow-[0_1px_4px_rgba(0,0,0,1)]"
          >
            ← BACK
          </button>
        ) : (
          <Link
            to="/"
            className="text-white/40 font-mono text-xs hover:text-white/70 transition-colors tracking-widest drop-shadow-[0_1px_4px_rgba(0,0,0,1)]"
          >
            ← BACK
          </Link>
        )}
      </div>
    </div>
  );
}
