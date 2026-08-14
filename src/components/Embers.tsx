"use client";

import { useEffect, useRef } from "react";

/** Partículas de brasas douradas flutuando ao fundo. */
export default function Embers() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    interface Ember {
      x: number; y: number; r: number; vx: number; vy: number; phase: number; alpha: number;
    }
    const spawn = (randomY = false): Ember => ({
      x: Math.random() * canvas.width,
      y: randomY ? Math.random() * canvas.height : canvas.height + 8,
      r: 0.6 + Math.random() * 1.8,
      vy: 0.15 + Math.random() * 0.45,
      vx: (Math.random() - 0.5) * 0.22,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.15 + Math.random() * 0.4,
    });
    const embers = Array.from(
      { length: Math.min(46, Math.floor(window.innerWidth / 30)) },
      () => spawn(true),
    );

    const tick = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        e.y -= e.vy;
        e.x += e.vx + Math.sin(time / 1800 + e.phase) * 0.12;
        if (e.y < -10) embers[i] = spawn();
        const flicker = 0.75 + 0.25 * Math.sin(time / 300 + e.phase * 3);
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226, 183, 78, ${e.alpha * flicker})`;
        ctx.fill();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{ background: "radial-gradient(120% 90% at 50% 40%, transparent 55%, #00000066 100%)" }}
        aria-hidden
      />
    </>
  );
}
