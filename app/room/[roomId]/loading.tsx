"use client"

import { useMemo } from "react";
import { LoadingSpinner } from "@/app/components/ui/loading-spinner"

const TIPS = [
  "Tip: You can customize your avatar for every session!",
  "Tip: Use keyboard shortcuts for faster voting.",
  "Tip: Share your room code to invite teammates.",
  "Tip: Try different deck types for your team's needs.",
  "Tip: You can change your name anytime in the session.",
  "Tip: Click the logo to return to the home screen.",
  "Tip: Use the chat to discuss estimates in real time.",
];

export default function Loading() {
  // Pick a random tip only once per mount
  const tip = useMemo(() => TIPS[Math.floor(Math.random() * TIPS.length)], []);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-700"
      aria-busy="true"
    >
      <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl px-10 py-8 border border-white/20">
        {/* Logo with animation */}
        <img
          src="/images/placeholder-logo.png"
          alt="EstiM8 logo"
          className="h-16 mb-4 animate-bounce-slow filter invert drop-shadow-lg"
          style={{ animation: "bounce 2s infinite" }}
        />
        {/* Animated spinner */}
        <LoadingSpinner size={48} className="mb-4 text-indigo-300" />
        {/* Friendly message */}
        <div className="text-lg font-semibold text-white mb-2">Getting things ready…</div>
        <div className="text-sm text-indigo-100 mb-2">Shuffling the cards and setting up your session.</div>
        {/* Random tip */}
        <div className="text-xs text-indigo-200 italic mt-2">
          {tip}
        </div>
      </div>
      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0);}
          50% { transform: translateY(-12px);}
        }
      `}</style>
    </div>
  )
}
