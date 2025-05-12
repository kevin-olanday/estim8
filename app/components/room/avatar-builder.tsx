"use client"

import { useState, useEffect, useRef } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Shuffle } from "lucide-react"

// Define available options for each feature
const HAIR_OPTIONS = [
  "bangs", "bowlCutHair", "braids", "bunHair", "curlyBob", "curlyShortHair", "froBun",
  "halfShavedHead", "mohawk", "shavedHead", "shortHair", "straightHair", "wavyBob"
]

const MOUTH_OPTIONS = [
  "awkwardSmile", "braces", "gapSmile", "kawaii", "openedSmile", "openSad", "teethSmile", "unimpressed"
]

const EYES_OPTIONS = [
  "angry", "cheery", "confused", "normal", "sad", "sleepy", "starstruck", "winking"
]

const HAIR_COLOR_OPTIONS = [
  "3a1a00", "220f00", "238d80", "605de4", "71472d", "d56c0c", "e2ba87", "e9b729"
]

const SKIN_COLOR_OPTIONS = [
  "8c5a2b", "643d19", "a47539", "c99c62", "e2ba87", "efcc9f", "f5d7b1", "ffe4c0"
]

const ACCESSORIES_OPTIONS = [
  "catEars",
  "clownNose",
  "faceMask",
  "glasses",
  "mustache",
  "sailormoonCrown",
  "sleepMask",
  "sunglasses",
]

interface AvatarBuilderProps {
  onAvatarChange: (style: string, options: {
    hair: string;
    mouth: string;
    eyes: string;
    hairColor: string;
    skinColor: string;
    accessories: string[];
  }) => void
  initialOptions?: {
    hair?: string;
    mouth?: string;
    eyes?: string;
    hairColor?: string;
    skinColor?: string;
    accessories?: string[];
  }
}

export function AvatarBuilder({ onAvatarChange, initialOptions }: AvatarBuilderProps) {
  // Only use initialOptions on mount
  const [options, setOptions] = useState<{
    hair: string;
    mouth: string;
    eyes: string;
    hairColor: string;
    skinColor: string;
    accessories: string[];
  }>(() => ({
    hair: initialOptions?.hair || "bangs",
    mouth: initialOptions?.mouth || "awkwardSmile",
    eyes: initialOptions?.eyes || "angry",
    hairColor: initialOptions?.hairColor || "3a1a00",
    skinColor: initialOptions?.skinColor || "8c5a2b",
    accessories: initialOptions?.accessories || [...ACCESSORIES_OPTIONS], // all enabled by default
  }))
  const [showAdvanced, setShowAdvanced] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    onAvatarChange("big-smile", options)
  }, [options, onAvatarChange])

  const handleOptionChange = (key: string, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  const randomizeAll = () => {
    const randomOption = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]
    setOptions(prev => ({
      hair: randomOption(HAIR_OPTIONS),
      mouth: randomOption(MOUTH_OPTIONS),
      eyes: randomOption(EYES_OPTIONS),
      hairColor: randomOption(HAIR_COLOR_OPTIONS),
      skinColor: randomOption(SKIN_COLOR_OPTIONS),
      accessories: prev.accessories, // do not change accessories on randomize
    }))
  }

  // Build the Dicebear URL using direct query parameters for v9.x
  const accessoriesParam = options.accessories && options.accessories.length > 0
    ? options.accessories.map(a => `&accessories[]=${encodeURIComponent(a)}`).join("")
    : ""
  const url = `https://api.dicebear.com/9.x/big-smile/svg?hair=${options.hair}&mouth=${options.mouth}&eyes=${options.eyes}&hairColor[]=${options.hairColor}&skinColor[]=${options.skinColor}${accessoriesParam}&accessoriesProbability=30`;

  return (
    <div className="w-full max-w-[260px] mx-auto p-4 rounded-xl bg-muted border border-border flex flex-col items-center gap-3 relative" style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)' }}>
      {/* Avatar Preview */}
      <div className="w-24 h-24 flex items-center justify-center rounded-lg bg-background shadow-inner border border-border">
        <img
          src={url}
          key={url}
          alt="Avatar Preview"
          className="w-20 h-20 rounded-lg"
          style={{ background: "transparent" }}
        />
      </div>
      {/* Shuffle Button */}
      <button
        type="button"
        className="flex items-center gap-2 mt-2 px-3 py-1 bg-accent hover:bg-accent/80 text-accent-foreground rounded-full shadow focus:outline-none focus:ring-2 focus:ring-accent transition text-xs font-medium"
        onClick={randomizeAll}
        aria-label="Randomize avatar"
      >
        <Shuffle className="w-4 h-4" />
        <span>Randomize</span>
      </button>
      {/* Advanced Customization Toggle */}
      <button
        type="button"
        className="mt-2 text-xs font-semibold text-foreground hover:text-accent transition px-2 py-1 rounded"
        onClick={() => setShowAdvanced(v => !v)}
        aria-expanded={showAdvanced}
        aria-controls="avatar-advanced-popover"
        style={{ alignSelf: 'center' }}
      >
        Advanced Customization {showAdvanced ? '▴' : '▾'}
      </button>
      {/* Advanced Controls Popover */}
      {showAdvanced && (
        <div
          id="avatar-advanced-popover"
          ref={popoverRef}
          className="absolute left-full top-0 ml-4 z-30 bg-card/90 border border-border rounded-xl shadow-xl p-4 min-w-[260px] max-w-[320px] backdrop-blur-sm"
          style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.18)' }}
        >
          <div className="grid grid-cols-2 gap-4 w-full text-foreground">
            <div className="flex flex-col gap-1">
              <Label>Hair Style</Label>
              <Select value={options.hair} onValueChange={v => handleOptionChange("hair", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HAIR_OPTIONS.map(style => (
                    <SelectItem key={style} value={style}>
                      {style.charAt(0).toUpperCase() + style.slice(1).replace(/([A-Z])/g, " $1")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Hair Color</Label>
              <Select value={options.hairColor} onValueChange={v => handleOptionChange("hairColor", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HAIR_COLOR_OPTIONS.map(color => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Eyes</Label>
              <Select value={options.eyes} onValueChange={v => handleOptionChange("eyes", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EYES_OPTIONS.map(style => (
                    <SelectItem key={style} value={style}>
                      {style.charAt(0).toUpperCase() + style.slice(1).replace(/([A-Z])/g, " $1")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Mouth</Label>
              <Select value={options.mouth} onValueChange={v => handleOptionChange("mouth", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MOUTH_OPTIONS.map(style => (
                    <SelectItem key={style} value={style}>
                      {style.charAt(0).toUpperCase() + style.slice(1).replace(/([A-Z])/g, " $1")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Skin Color</Label>
              <Select value={options.skinColor} onValueChange={v => handleOptionChange("skinColor", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SKIN_COLOR_OPTIONS.map(color => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Accessories Multi-select at the bottom, all toggled on by default */}
            <div className="col-span-2 flex flex-col gap-1 mt-2">
              <Label>Accessories</Label>
              <div className="flex flex-wrap gap-2">
                {ACCESSORIES_OPTIONS.map(acc => (
                  <label key={acc} className="flex items-center gap-1 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.accessories.includes(acc)}
                      onChange={e => {
                        if (e.target.checked) {
                          handleOptionChange("accessories", [...options.accessories, acc])
                        } else {
                          handleOptionChange("accessories", options.accessories.filter(a => a !== acc))
                        }
                      }}
                    />
                    {acc.charAt(0).toUpperCase() + acc.slice(1).replace(/([A-Z])/g, " $1")}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 