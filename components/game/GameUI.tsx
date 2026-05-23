import { Link } from "react-router";
import type { TimeOfDay, Weather } from "./config";
import { SHIPS, ISLAND_GLB } from "./config";
import { LoadingScreen } from "./LoadingScreen";
import { StatBar, TBtn, InfoTooltip } from "./ui-primitives";

export type { TBtn };

export interface GameUIProps {
  mountRef: React.RefObject<HTMLDivElement | null>;
  helmImgRef: React.RefObject<HTMLImageElement | null>;
  playMode: boolean;
  onExitPlay?: () => void;
  loaded: boolean;
  errMsg: string | null;
  canvasJoystick: { cx: number; cy: number; x: number; y: number } | null;
  todUI: TimeOfDay;
  wxUI: Weather;
  onSetTimeOfDay: (v: TimeOfDay) => void;
  onSetWeather: (v: Weather) => void;
  shipIdx: number;
  swapping: boolean;
  onShipPrev: () => void;
  onShipNext: () => void;
  nearIsland: string | null;
  heading: number;
  speedPct: number;
  shipPos: { x: number; z: number };
  pressKey: (k: string) => void;
  releaseKey: (k: string) => void;
  onHelmPointerDown: (e: React.PointerEvent<HTMLImageElement>) => void;
  onHelmPointerMove: (e: React.PointerEvent<HTMLImageElement>) => void;
  onHelmPointerUp: () => void;
  onCompassClick: () => void;
}

export function GameUI({
  mountRef, helmImgRef, playMode, onExitPlay, loaded, errMsg,
  canvasJoystick, todUI, wxUI, onSetTimeOfDay, onSetWeather,
  shipIdx, swapping, onShipPrev, onShipNext,
  nearIsland, heading, speedPct, shipPos,
  pressKey, releaseKey,
  onHelmPointerDown, onHelmPointerMove, onHelmPointerUp,
  onCompassClick,
}: GameUIProps) {
  const maxS = Math.max(...SHIPS.map(x => x.maxSpeed));
  const maxT = Math.max(...SHIPS.map(x => x.turnSpeed));

  return (
    <div className={`fixed inset-0 overflow-hidden select-none ${playMode ? "bg-black" : ""}`}>
      <div ref={mountRef} className="w-full h-full" />

      {/* Canvas joystick visual */}
      {canvasJoystick && playMode && loaded && (() => {
        const dx = canvasJoystick.x - canvasJoystick.cx;
        const dy = canvasJoystick.y - canvasJoystick.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const MAX = 60;
        const clampedX = canvasJoystick.cx + dx / Math.max(dist, MAX) * Math.min(dist, MAX);
        const clampedY = canvasJoystick.cy + dy / Math.max(dist, MAX) * Math.min(dist, MAX);
        return (
          <svg className="fixed inset-0 pointer-events-none z-40" width="100%" height="100%">
            <circle cx={canvasJoystick.cx} cy={canvasJoystick.cy} r={MAX} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <line x1={canvasJoystick.cx} y1={canvasJoystick.cy} x2={clampedX} y2={clampedY} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <circle cx={clampedX} cy={clampedY} r={18} fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          </svg>
        );
      })()}

      {playMode && (
        <>
          {/* Back / exit */}
          {onExitPlay ? (
            <button onClick={onExitPlay} className="fixed top-5 left-5 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-black/55 backdrop-blur-md border border-white/15 text-white/70 text-sm font-mono hover:border-white/40 hover:text-white transition-all duration-200 cursor-pointer">
              ← Portfolio
            </button>
          ) : (
            <Link to="/" className="fixed top-5 left-5 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-black/55 backdrop-blur-md border border-white/15 text-white/70 text-sm font-mono hover:border-white/40 hover:text-white transition-all duration-200 cursor-pointer">
              ← Portfolio
            </Link>
          )}

          {/* Environment + ship controls */}
          {loaded && (
            <div className="fixed top-16 left-5 z-50 flex flex-col gap-2">
              {/* Time of day */}
              <div className="flex gap-0.5 bg-black/55 backdrop-blur-md border border-white/15 rounded-lg p-1.5">
                {([ ["day","☀️"], ["sunset","🌅"], ["night","🌙"] ] as [TimeOfDay, string][]).map(([v, e]) => (
                  <button key={v} onClick={() => onSetTimeOfDay(v)} title={v}
                    className={`text-base px-2 py-1 rounded cursor-pointer transition-all duration-200 ${todUI === v ? "bg-white/20" : "opacity-35 hover:opacity-65"}`}
                  >{e}</button>
                ))}
              </div>
              {/* Weather */}
              <div className="flex gap-0.5 bg-black/55 backdrop-blur-md border border-white/15 rounded-lg p-1.5">
                {([ ["calm","🌊"], ["windy","💨"], ["rainy","🌧️"] ] as [Weather, string][]).map(([v, e]) => (
                  <button key={v} onClick={() => onSetWeather(v)} title={v}
                    className={`text-base px-2 py-1 rounded cursor-pointer transition-all duration-200 ${wxUI === v ? "bg-white/20" : "opacity-35 hover:opacity-65"}`}
                  >{e}</button>
                ))}
              </div>
              {/* Ship selector */}
              <div className="flex flex-col gap-1 bg-black/55 backdrop-blur-md border border-white/15 rounded-lg p-1.5">
                <div className="flex items-center gap-1">
                  <button onClick={onShipPrev} disabled={swapping} className="text-white/60 hover:text-white px-1.5 py-1 rounded cursor-pointer transition-all duration-200 disabled:opacity-30">‹</button>
                  <span className={`text-[11px] font-mono flex-1 text-center transition-opacity duration-200 ${swapping ? "text-white/30 animate-pulse" : "text-white/80"}`}>
                    {swapping ? "loading…" : SHIPS[shipIdx].name}
                  </span>
                  {!swapping && SHIPS[shipIdx].sketchLink && (
                    <InfoTooltip sketchLink={SHIPS[shipIdx].sketchLink!} author={SHIPS[shipIdx].author} license={SHIPS[shipIdx].license} />
                  )}
                  <button onClick={onShipNext} disabled={swapping} className="text-white/60 hover:text-white px-1.5 py-1 rounded cursor-pointer transition-all duration-200 disabled:opacity-30">›</button>
                </div>
                {!swapping && (
                  <div className="flex flex-col gap-0.5 px-1 pb-0.5">
                    <span className="text-[9px] font-mono text-white/35 text-center">{SHIPS[shipIdx].desc}</span>
                    <StatBar label="spd" value={SHIPS[shipIdx].maxSpeed / maxS} />
                    <StatBar label="hdl" value={SHIPS[shipIdx].turnSpeed / maxT} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Compass + speed + coordinates */}
          {loaded && (
            <div className="fixed top-5 right-5 z-50 flex flex-col items-center gap-2">
              <div className="relative w-20 h-20 cursor-pointer" onClick={onCompassClick} title="Snap to north">
                <svg viewBox="0 0 80 80" className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                  <defs>
                    <filter id="cShadow">
                      <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.7" />
                    </filter>
                    <radialGradient id="cBg" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#1a1f2e" stopOpacity="0.92" />
                      <stop offset="100%" stopColor="#0d1017" stopOpacity="0.97" />
                    </radialGradient>
                  </defs>
                  <circle cx="40" cy="40" r="38" fill="url(#cBg)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                  {Array.from({ length: 36 }).map((_, i) => {
                    const a = (i / 36) * Math.PI * 2;
                    const major = i % 9 === 0;
                    const r1 = major ? 30 : 32, r2 = 34;
                    return (
                      <line key={i}
                        x1={40 + Math.sin(a) * r1} y1={40 - Math.cos(a) * r1}
                        x2={40 + Math.sin(a) * r2} y2={40 - Math.cos(a) * r2}
                        stroke={major ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.12)"}
                        strokeWidth={major ? "1" : "0.5"}
                      />
                    );
                  })}
                  {([["N", 0, 25], ["S", 180, 25], ["E", 90, 25], ["W", 270, 25]] as [string, number, number][]).map(([lbl, deg, r]) => {
                    const a = (deg * Math.PI) / 180;
                    return (
                      <text key={lbl}
                        x={40 + Math.sin(a) * r} y={40 - Math.cos(a) * r + 3.5}
                        textAnchor="middle" fontSize="8.5"
                        fontFamily="ui-sans-serif,system-ui,sans-serif" fontWeight="800"
                        fill={lbl === "N" ? "#f87171" : "rgba(255,255,255,0.7)"}
                        filter="url(#cShadow)"
                      >{lbl}</text>
                    );
                  })}
                  <g transform={`rotate(${heading} 40 40)`} filter="url(#cShadow)">
                    <polygon points="40,10 43,40 40,34 37,40" fill="#ef4444" />
                    <polygon points="40,10 43,40 40,34 37,40" fill="none" stroke="#7f1d1d" strokeWidth="0.4" />
                    <polygon points="40,70 43,40 40,46 37,40" fill="rgba(255,255,255,0.6)" />
                    <polygon points="40,70 43,40 40,46 37,40" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="0.4" />
                    <circle cx="40" cy="40" r="2.5" fill="#e5e7eb" stroke="#6b7280" strokeWidth="0.6" />
                  </g>
                </svg>
              </div>
              <span className="text-[10px] font-mono text-white/50 bg-black/50 px-2 py-0.5 rounded tracking-wider">{heading}°</span>
              <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400/60 rounded-full transition-all duration-100" style={{ width: `${speedPct}%` }} />
              </div>
              <span className="text-[9px] font-mono text-white/30">{speedPct}%</span>
              <span className="text-[9px] font-mono text-white/25 tabular-nums">{shipPos.x}, {shipPos.z}</span>
            </div>
          )}

          {/* Nearby island label */}
          {nearIsland && loaded && (
            <div className="fixed bottom-48 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-2 rounded-lg bg-black/65 backdrop-blur-md border border-white/15 text-white/80 text-sm font-mono pointer-events-none">
              🏝️ {nearIsland}
              {ISLAND_GLB[nearIsland]?.sketchLink && (
                <span className="pointer-events-auto">
                  <InfoTooltip sketchLink={ISLAND_GLB[nearIsland].sketchLink!} author={ISLAND_GLB[nearIsland].author} license={ISLAND_GLB[nearIsland].license} position="top" />
                </span>
              )}
            </div>
          )}

          {/* Desktop keyboard hint */}
          {loaded && (
            <div className="fixed bottom-5 right-5 z-50 hidden md:flex flex-col gap-1 items-end text-[10px] font-mono text-white/25 pointer-events-none">
              <span><span className="text-white/40">↑ W</span> Throttle</span>
              <span><span className="text-white/40">← → / drag helm</span> Steer</span>
              <span><span className="text-white/40">↓ S</span> Brake</span>
            </div>
          )}

          {/* Loading / error overlay */}
          {!loaded && (
            errMsg ? (
              <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center gap-4">
                <span className="text-red-400 font-mono text-sm">Failed to initialize</span>
                <pre className="text-red-300/60 text-xs max-w-lg text-center whitespace-pre-wrap px-4">{errMsg}</pre>
                {onExitPlay
                  ? <button onClick={onExitPlay} className="mt-4 text-white/50 font-mono text-xs underline">← go back</button>
                  : <Link to="/" className="mt-4 text-white/50 font-mono text-xs underline">← go back</Link>
                }
              </div>
            ) : (
              <LoadingScreen />
            )
          )}
        </>
      )}

      {/* Helm — always mounted so the ref attaches regardless of playMode */}
      <div
        className="fixed bottom-8 left-0 right-0 z-50 flex items-end justify-center gap-6 px-8"
        style={{ opacity: playMode && loaded ? 1 : 0, transition: "opacity 0.6s", pointerEvents: playMode && loaded ? "auto" : "none" }}
      >
        <div className="flex flex-col items-center gap-1.5">
          <img
            ref={helmImgRef}
            src="/helm_white.png"
            alt="helm"
            className="w-24 h-24 will-change-transform cursor-grab active:cursor-grabbing touch-none select-none"
            style={{ opacity: 0.7, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.8))" }}
            draggable={false}
            onPointerDown={onHelmPointerDown}
            onPointerMove={onHelmPointerMove}
            onPointerUp={onHelmPointerUp}
            onPointerCancel={onHelmPointerUp}
          />
          <span className="text-[10px] font-mono text-white/30 tracking-widest pointer-events-none">
            {playMode && loaded ? (speedPct > 2 ? "SAILING" : "ANCHORED") : ""}
          </span>
          <span className="md:hidden text-[9px] font-mono text-white/20 pointer-events-none">
            {playMode && loaded ? "drag ↕ throttle  ↔ steer" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
