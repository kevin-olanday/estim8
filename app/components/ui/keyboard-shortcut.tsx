import React from "react"

interface KeyboardShortcutProps {
  keys: string[]
  className?: string
}

export function KeyboardShortcut({ keys, className = "" }: KeyboardShortcutProps) {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
            {key}
          </kbd>
          {index < keys.length - 1 && <span className="text-xs">+</span>}
        </React.Fragment>
      ))}
    </div>
  )
}
