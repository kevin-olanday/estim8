"use client";
import React, { useRef, useEffect } from "react";

// Aurora color palette
const COLORS = [
  "#6D44B8", // deep violet
  "#1A96FF", // electric blue
  "#0B0F1A", // dark navy
];

export default function AuroraGradientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = window.innerWidth;
    let height = window.innerHeight;

    function resize() {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    }
    resize();
    window.addEventListener("resize", resize);

    // Aurora state: 3 moving gradient points
    const points = [
      { x: 0.2, y: 0.5, angle: Math.PI / 3, speed: 0.008 },
      { x: 0.8, y: 0.6, angle: -Math.PI / 4, speed: 0.006 },
      { x: 0.5, y: 0.2, angle: Math.PI / 6, speed: 0.005 },
    ];

    function animateAurora(now: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Animate points in slow, looping orbits
      points.forEach((pt) => {
        pt.x += Math.cos(pt.angle + now * pt.speed * 0.00003) * 0.0005;
        pt.y += Math.sin(pt.angle + now * pt.speed * 0.00003) * 0.0005;
        // Keep within bounds
        pt.x = Math.max(0, Math.min(1, pt.x));
        pt.y = Math.max(0, Math.min(1, pt.y));
      });

      // Create a smooth, multi-stop gradient
      const grad = ctx.createLinearGradient(
        points[0].x * width, points[0].y * height,
        points[1].x * width, points[1].y * height
      );
      grad.addColorStop(0, COLORS[0]);
      grad.addColorStop(0.5, COLORS[1]);
      grad.addColorStop(1, COLORS[2]);

      // Fill with gradient, then blur
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Optional: overlay a second, offset gradient for more depth
      const grad2 = ctx.createLinearGradient(
        points[2].x * width, points[2].y * height,
        points[0].x * width, points[0].y * height
      );
      grad2.addColorStop(0, COLORS[1]);
      grad2.addColorStop(1, COLORS[0]);
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      ctx.globalAlpha = 1;

      animationRef.current = requestAnimationFrame(animateAurora);
    }

    animationRef.current = requestAnimationFrame(animateAurora);
    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-[-1] pointer-events-none"
      style={{
        filter: "blur(60px) brightness(0.9)",
        mixBlendMode: "screen",
        background: "#0B0F1A",
        transition: "filter 0.5s",
      }}
      aria-hidden="true"
    />
  );
} 