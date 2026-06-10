import { useEffect, useRef, useState } from "react";

type Tap = { id: number; x: number; y: number };

export function CursorGlow() {
  const [mounted, setMounted] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const [taps, setTaps] = useState<Tap[]>([]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const dot = dotRef.current;
    if (!dot) return;

    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX; ty = e.clientY;
      dot.classList.add("is-active");
    };
    const onLeave = () => dot.classList.remove("is-active");

    const tick = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      dot.style.setProperty("--cx", `${cx}px`);
      dot.style.setProperty("--cy", `${cy}px`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    let nextId = 1;
    const onTap = (e: PointerEvent) => {
      const id = nextId++;
      setTaps((t) => [...t, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setTaps((t) => t.filter((p) => p.id !== id)), 700);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("pointerdown", onTap);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("pointerdown", onTap);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <>
      <div ref={dotRef} className="cursor-glow" aria-hidden />
      {taps.map((t) => (
        <span
          key={t.id}
          className="tap-glow"
          aria-hidden
          style={{ ["--tx" as any]: `${t.x}px`, ["--ty" as any]: `${t.y}px` }}
        />
      ))}
    </>
  );
}
