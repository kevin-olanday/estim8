"use client"
import { createContext, useContext, useState, useEffect } from "react"

export const CurrentStoryContext = createContext<any>(null)

export function useCurrentStory() {
  return useContext(CurrentStoryContext)
}

export function CurrentStoryProvider({ initialStory, children }: { initialStory: any, children: React.ReactNode }) {
  const [currentStory, setCurrentStory] = useState(initialStory)

  useEffect(() => {
    console.log('[CONTEXT] currentStory updated:', currentStory);
  }, [currentStory]);

  return (
    <CurrentStoryContext.Provider value={{ currentStory, setCurrentStory }}>
      {children}
    </CurrentStoryContext.Provider>
  )
}