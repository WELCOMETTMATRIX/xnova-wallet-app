import { useEffect, useRef } from "react";

/**
 * Cinematic hero background rendered directly to a <canvas>.
 * Autoplays, loops forever, has no controls and never blocks page load.
 * Falls back to a static gradient when motion is reduced or WebGL/2D fails.
 */
export function HeroCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let running = true;
    let width = 0;
    let height = 0;

    const stars = Array.from({ length: 160 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * 0.9 + 0.1,
      s: Math.random() * 1.4 + 0.3,
    }));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t: number) => {
      const time = t / 1000;
      ctx.clearRect(0, 0, width, height);

      // Deep space wash
      const g = ctx.createLinearGradient(0, 0, width, height);
      g.addColorStop(0, "rgba(18,18,22,1)");
      g.addColorStop(0.55, "rgba(24,16,20,1)");
      g.addColorStop(1, "rgba(12,12,15,1)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

      // Perspective grid
      const horizon = height * 0.62;
      ctx.strokeStyle = "rgba(230,60,60,0.14)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 18; i++) {
        const p = i / 18;
        const y = horizon + Math.pow(p, 2.1) * (height - horizon) + ((time * 22) % 26);
        if (y > height) continue;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      for (let i = -14; i <= 14; i++) {
        ctx.beginPath();
        ctx.moveTo(width / 2 + i * 18, horizon);
        ctx.lineTo(width / 2 + i * 190, height);
        ctx.stroke();
      }

      // Star / data field
      for (const st of stars) {
        const drift = (st.x + time * 0.012 * st.z) % 1;
        const x = drift * width;
        const y = st.y * horizon;
        ctx.globalAlpha = 0.25 + st.z * 0.6;
        ctx.fillStyle = st.z > 0.8 ? "rgba(255,90,80,0.9)" : "rgba(220,220,230,0.75)";
        ctx.fillRect(x, y, st.s, st.s);
      }
      ctx.globalAlpha = 1;

      // Live price-like waveform
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,70,60,0.55)";
      ctx.lineWidth = 1.5;
      for (let x = 0; x <= width; x += 6) {
        const n =
          Math.sin(x * 0.006 + time * 0.9) * 18 +
          Math.sin(x * 0.017 - time * 1.7) * 9 +
          Math.sin(x * 0.031 + time * 0.4) * 5;
        const y = horizon * 0.72 + n;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Vignette
      const v = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.2,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75,
      );
      v.addColorStop(0, "rgba(0,0,0,0)");
      v.addColorStop(1, "rgba(0,0,0,0.85)");
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, width, height);

      if (running && !reduced) raf = requestAnimationFrame(draw);
    };

    resize();
    draw(0);
    if (!reduced) raf = requestAnimationFrame(draw);

    const onResize = () => {
      resize();
      draw(performance.now());
    };
    window.addEventListener("resize", onResize);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting && !running && !reduced) {
          running = true;
          raf = requestAnimationFrame(draw);
        } else if (!entry.isIntersecting) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0.05 },
    );
    io.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      io.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      style={{ background: "linear-gradient(160deg,#131315,#1c1216 55%,#0d0d10)" }}
    />
  );
}
