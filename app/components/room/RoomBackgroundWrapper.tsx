"use client";
import React from "react";
import dynamic from "next/dynamic";

const RoomParticlesBackground = dynamic(() => import("@/app/components/room/RoomParticlesBackground"), { ssr: false });

export default function RoomBackgroundWrapper({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <RoomParticlesBackground />
      {children}
    </>
  );
} 