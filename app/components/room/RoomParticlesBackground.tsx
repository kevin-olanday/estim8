import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

export default function RoomParticlesBackground() {
  const particlesInit = useCallback(async (engine: any) => {
    await loadFull(engine);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Particles
        id="room-particles-bg"
        init={particlesInit}
        options={{
          fullScreen: false,
          background: { color: { value: "transparent" } },
          fpsLimit: 30,
          particles: {
            number: { value: 60, density: { enable: true, area: 1200 } },
            color: { value: "#fff" },
            opacity: {
              value: 0.2,
              random: { enable: true, minimumValue: 0.1 },
              animation: { enable: true, speed: 0.1, minimumValue: 0.1, sync: false },
            },
            size: {
              value: 5,
              random: { enable: true, minimumValue: 2 },
              animation: { enable: true, speed: 1, minimumValue: 2, sync: false },
            },
            move: {
              enable: true,
              speed: 0.15,
              direction: "none",
              random: true,
              straight: false,
              outModes: { default: "out" },
            },
            shape: { type: "circle" },
            shadow: {
              enable: true,
              color: "#fff",
              blur: 6,
            },
            links: { enable: false },
            blendMode: "screen",
          },
          detectRetina: true,
        }}
      />
    </div>
  );
} 