"use client"
import { createContext, useContext, useState } from "react"

export const CurrentStoryContext = createContext<any>(null)

export function useCurrentStory() {
  return useContext(CurrentStoryContext)
}

export function CurrentStoryProvider({ initialStory, children }: { initialStory: any, children: React.ReactNode }) {
  const [currentStory, setCurrentStory] = useState(initialStory)
  return (
    <CurrentStoryContext.Provider value={{ currentStory, setCurrentStory }}>
      {children}
    </CurrentStoryContext.Provider>
  )
}