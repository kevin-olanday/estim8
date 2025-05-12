"use client";
import React, { useRef, useEffect } from "react";

// Volumetric Fog Canvas
function FogLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

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

    // Simple animated noise
    const imageData = ctx.createImageData(width, height);
    function drawFog(time: number) {
      if (!canvas || !ctx) return;
      // Animate offset for drifting
      const xOffset = (time * 0.0002) % 1;
      for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
          const noise = Math.floor(
            128 +
              64 *
                Math.sin(
                  (x * 0.01 + xOffset * 100) +
                  (y * 0.01 - xOffset * 50) +
                  Math.sin(time * 0.00005)
                )
          );
          const idx = (y * width + x) * 4;
          imageData.data[idx] = noise;
          imageData.data[idx + 1] = noise;
          imageData.data[idx + 2] = noise;
          imageData.data[idx + 3] = 16; // very low alpha
        }
      }
      ctx.putImageData(imageData, 0, 0);
      animationRef.current = requestAnimationFrame(drawFog);
    }
    animationRef.current = requestAnimationFrame(drawFog);

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-[-2] pointer-events-none"
      style={{
        filter: "blur(32px)",
        opacity: 0.06,
        transition: "opacity 0.5s",
        background: "transparent",
      }}
      aria-hidden="true"
    />
  );
}

export default function DefaultThemeBackground({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <>
      <FogLayer />
    </>
  );
} 