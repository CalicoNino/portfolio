import { useEffect, useRef, useState } from "react";

export function RotatingHelm() {
  const [rotation, setRotation] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const s = useRef({ active: false, lastAngle: 0, rotation: 0, velocity: 0, raf: null as number | null });

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const getAngle = (x: number, y: number) => {
      const r = img.getBoundingClientRect();
      return Math.atan2(y - (r.top + r.height / 2), x - (r.left + r.width / 2)) * (180 / Math.PI);
    };

    const stopInertia = () => {
      if (s.current.raf) { cancelAnimationFrame(s.current.raf); s.current.raf = null; }
    };

    const startInertia = () => {
      stopInertia();
      const tick = () => {
        if (Math.abs(s.current.velocity) < 0.05) return;
        s.current.velocity *= 0.96;
        s.current.rotation += s.current.velocity;
        setRotation(s.current.rotation);
        s.current.raf = requestAnimationFrame(tick);
      };
      s.current.raf = requestAnimationFrame(tick);
    };

    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      stopInertia();
      s.current.active = true;
      s.current.lastAngle = getAngle(e.clientX, e.clientY);
      img.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!s.current.active) return;
      const angle = getAngle(e.clientX, e.clientY);
      let delta = angle - s.current.lastAngle;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      s.current.velocity = delta;
      s.current.rotation += delta;
      s.current.lastAngle = angle;
      setRotation(s.current.rotation);
    };

    const onUp = () => {
      if (!s.current.active) return;
      s.current.active = false;
      startInertia();
    };

    img.addEventListener("pointerdown", onDown);
    img.addEventListener("pointermove", onMove);
    img.addEventListener("pointerup", onUp);
    img.addEventListener("pointercancel", onUp);

    return () => {
      img.removeEventListener("pointerdown", onDown);
      img.removeEventListener("pointermove", onMove);
      img.removeEventListener("pointerup", onUp);
      img.removeEventListener("pointercancel", onUp);
      stopInertia();
    };
  }, []);

  return (
    <div className="flex justify-center items-center py-2">
      <img
        ref={imgRef}
        src="/helm_white.png"
        alt="Ship's helm"
        draggable={false}
        className="w-32 h-32 sm:w-40 sm:h-40 opacity-80 hover:opacity-100 select-none cursor-grab drop-shadow-[0_0_20px_oklch(0.7_0.26_25/0.4)]"
        style={{ transform: `rotate(${rotation}deg)`, touchAction: "none", userSelect: "none" }}
      />
    </div>
  );
}
