"use client"

import React from "react"
import { useState, useEffect, useRef } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Shuffle, Sparkles, Cat, Smile, Glasses as GlassesIcon, Sun, Moon, Star, Shield, Scissors, Palette, Eye, Droplet, Ban, Settings } from "lucide-react"
import { LoadingSpinner } from "@/app/components/ui/loading-spinner"

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

const ACCESSORY_ICONS: Record<string, React.ElementType | string> = {
  "catEars": Cat, // Cat Ears
  "clownNose": Smile, // Clown Nose
  "faceMask": Shield, // Face Mask (fallback)
  "glasses": GlassesIcon, // Glasses
  "mustache": Smile, // Mustache (fallback)
  "sailormoonCrown": Star, // Sailormoon Crown
  "sleepMask": Moon, // Sleep Mask
  "sunglasses": Sun, // Sunglasses
};

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
  // Use a fixed initial value for SSR
  const [options, setOptions] = useState<{
    hair: string;
    mouth: string;
    eyes: string;
    hairColor: string;
    skinColor: string;
    accessories: string[];
  }>(() => ({
    hair: initialOptions?.hair || HAIR_OPTIONS[0],
    mouth: initialOptions?.mouth || MOUTH_OPTIONS[0],
    eyes: initialOptions?.eyes || EYES_OPTIONS[0],
    hairColor: initialOptions?.hairColor || HAIR_COLOR_OPTIONS[0],
    skinColor: initialOptions?.skinColor || SKIN_COLOR_OPTIONS[0],
    accessories: initialOptions?.accessories || [],
  }));

  const [randomizing, setRandomizing] = useState(false);

  // On client mount, randomize if no initialOptions were provided
  useEffect(() => {
    if (!initialOptions) {
      const randomOption = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
      setOptions({
        hair: randomOption(HAIR_OPTIONS),
        mouth: randomOption(MOUTH_OPTIONS),
        eyes: randomOption(EYES_OPTIONS),
        hairColor: randomOption(HAIR_COLOR_OPTIONS),
        skinColor: randomOption(SKIN_COLOR_OPTIONS),
        accessories: [randomOption(ACCESSORIES_OPTIONS)],
      });
      setRandomizing(true);
    }
  // Only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showAdvanced, setShowAdvanced] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)

  const [accessoryMenuOpen, setAccessoryMenuOpen] = useState(false);
  const accessoryButtonRef = useRef<HTMLButtonElement>(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    onAvatarChange("big-smile", options)
  }, [options, onAvatarChange])

  const handleOptionChange = (key: string, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  const handleAccessoryChange = (value: string) => {
    if (value === "none") {
      setOptions(prev => ({ ...prev, accessories: [] }))
      setRandomizing(false);
    } else {
      setOptions(prev => ({ ...prev, accessories: [value] }))
      setRandomizing(false);
    }
  }

  const randomizeAll = () => {
    const randomOption = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]
    setOptions({
      hair: randomOption(HAIR_OPTIONS),
      mouth: randomOption(MOUTH_OPTIONS),
      eyes: randomOption(EYES_OPTIONS),
      hairColor: randomOption(HAIR_COLOR_OPTIONS),
      skinColor: randomOption(SKIN_COLOR_OPTIONS),
      accessories: [randomOption(ACCESSORIES_OPTIONS)],
    })
    setRandomizing(true);
  }

  // Build the Dicebear URL using direct query parameters for v9.x
  const accessoriesParam = options.accessories && options.accessories.length > 0
    ? options.accessories.map(a => `&accessories[]=${encodeURIComponent(a)}`).join("")
    : "";
  const accessoriesProbability = options.accessories.length === 0 ? '&accessoriesProbability=0' : `&accessoriesProbability=${randomizing ? 50 : 100}`;
  const url = `https://api.dicebear.com/9.x/big-smile/svg?hair[]=${options.hair}&mouth[]=${options.mouth}&eyes[]=${options.eyes}&hairColor[]=${options.hairColor}&skinColor[]=${options.skinColor}${accessoriesParam}${accessoriesProbability}`;

  // Log the API call for debugging
  useEffect(() => {
    console.log('Dicebear API URL:', url);
  }, [url]);

  // Set loading to true whenever the URL changes
  useEffect(() => {
    setLoading(true)
  }, [url])

  const diceRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="w-full max-w-[260px] mx-auto p-4 rounded-xl bg-muted border border-border flex flex-col items-center gap-3 relative" style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)' }}>
      {/* Avatar Preview */}
      <div className="w-24 h-24 flex items-center justify-center rounded-lg bg-background shadow-inner border border-border relative">
        {loading && (
          <LoadingSpinner className="text-accent" size={32} />
        )}
        <img
          src={url}
          key={url}
          alt=""
          className="w-20 h-20 rounded-lg"
          style={{ background: "transparent", display: loading ? "none" : "block" }}
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
        {/* Dice randomize button */}
        <button
          type="button"
          ref={diceRef}
          className="absolute top-0.5 right-0.5 bg-accent/80 text-white rounded-full p-1 shadow cursor-pointer ring-0 border-none focus:ring-0 active:ring-0 active:border-none animate-dice-idle hover:animate-dice-bounce hover:shadow-dice-glow"
          title="Randomize avatar"
          onClick={e => {
            if (diceRef.current) {
              diceRef.current.classList.remove('animate-dice-idle');
              diceRef.current.classList.remove('hover:animate-dice-bounce');
              diceRef.current.classList.remove('dice-spin');
              void diceRef.current.offsetWidth;
              diceRef.current.classList.add('dice-spin');
            }
            randomizeAll();
          }}
          onAnimationEnd={e => {
            if (e.animationName === 'diceSpin' && diceRef.current) {
              diceRef.current.classList.remove('dice-spin');
              diceRef.current.classList.add('animate-dice-idle');
              diceRef.current.classList.add('hover:animate-dice-bounce');
            }
          }}
          aria-label="Randomize avatar"
          style={{ fontSize: 22, lineHeight: 1 }}
        >
          🎲
        </button>
      </div>
      {/* Shuffle and Customize Buttons */}
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-1 bg-accent hover:bg-accent/80 text-accent-foreground rounded-full shadow focus:outline-none focus:ring-2 focus:ring-accent transition text-xs font-medium"
          onClick={() => { setShowAdvanced(true); setAccessoryMenuOpen(false); }}
          aria-expanded={showAdvanced}
          aria-controls="avatar-advanced-popover"
          style={{ alignSelf: 'center' }}
        >
          <Settings className="w-4 h-4" />
          <span>Customize</span>
        </button>
      </div>
      {/* Customize Pop-up (was Advanced Controls Popover) */}
      {showAdvanced && (
        isMobile ? (
          <>
            <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowAdvanced(false)} />
            <div className="fixed bottom-0 left-0 w-full z-50 bg-background rounded-t-3xl shadow-2xl p-0 px-4 pb-6 flex flex-col items-center animate-slide-up max-h-[80vh] overflow-y-auto transition-all">
              <div className="sticky top-0 bg-background z-10 flex items-center justify-between w-full border-b border-muted mb-4 pb-2 pt-6">
                <div className="flex-1 flex justify-center">
                  <h3 className="text-xl font-bold text-center">Customize</h3>
                </div>
                <button
                  className="absolute right-4 top-6 text-muted-foreground hover:text-accent p-2 rounded-full focus:outline-none"
                  onClick={() => setShowAdvanced(false)}
                  aria-label="Close customize menu"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-2 w-full px-4 pb-4 pt-2">
                <div className="flex flex-col">
                  <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1"><Scissors className="w-4 h-4" /> Hair Style</span>
                  <Select value={options.hair} onValueChange={v => handleOptionChange('hair', v)}>
                    <SelectTrigger className="w-full min-h-[40px] mt-0 rounded-lg shadow-sm border border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HAIR_OPTIONS.map(style => (
                        <SelectItem key={style} value={style}>
                          {style.charAt(0).toUpperCase() + style.slice(1).replace(/([A-Z])/g, ' $1')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1"><Palette className="w-4 h-4" /> Hair Color</span>
                  <Select value={options.hairColor} onValueChange={v => handleOptionChange('hairColor', v)}>
                    <SelectTrigger className="w-full min-h-[40px] mt-0 rounded-lg shadow-sm border border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HAIR_COLOR_OPTIONS.map(color => (
                        <SelectItem key={color} value={color}>{color}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1"><Eye className="w-4 h-4" /> Eyes</span>
                  <Select value={options.eyes} onValueChange={v => handleOptionChange('eyes', v)}>
                    <SelectTrigger className="w-full min-h-[40px] mt-0 rounded-lg shadow-sm border border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EYES_OPTIONS.map(style => (
                        <SelectItem key={style} value={style}>
                          {style.charAt(0).toUpperCase() + style.slice(1).replace(/([A-Z])/g, ' $1')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-1 flex flex-col">
                  <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1"><Smile className="w-4 h-4" /> Mouth</span>
                  <Select value={options.mouth} onValueChange={v => handleOptionChange('mouth', v)}>
                    <SelectTrigger className="w-full min-h-[40px] mt-0 rounded-lg shadow-sm border border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MOUTH_OPTIONS.map(style => (
                        <SelectItem key={style} value={style}>
                          {style.charAt(0).toUpperCase() + style.slice(1).replace(/([A-Z])/g, ' $1')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-1 flex flex-col">
                  <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1"><Sparkles className="w-4 h-4" /> Accessory</span>
                  <Select value={options.accessories[0] || 'none'} onValueChange={v => handleAccessoryChange(v)}>
                    <SelectTrigger className="w-full min-h-[40px] mt-0 rounded-lg shadow-sm border border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {ACCESSORIES_OPTIONS.map(acc => (
                        <SelectItem key={acc} value={acc}>
                          {acc.charAt(0).toUpperCase() + acc.slice(1).replace(/([A-Z])/g, ' $1')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowAdvanced(false)} />
            <div
              id="avatar-advanced-popover"
              ref={popoverRef}
              className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2 bg-background border border-border rounded-2xl shadow-2xl p-0 w-[340px] flex flex-col animate-slide-up"
            >
              <div className="sticky top-0 bg-background z-10 flex items-center justify-between w-full border-b border-muted mb-4 pb-2 pt-6">
                <div className="flex-1 flex justify-center">
                  <h3 className="text-xl font-bold text-center">Customize</h3>
                </div>
                <button
                  className="absolute right-4 top-6 text-muted-foreground hover:text-accent p-2 rounded-full focus:outline-none"
                  onClick={() => setShowAdvanced(false)}
                  aria-label="Close customize menu"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 w-full px-4 pb-4 pt-2">
                {/* Column 1 */}
                <div className="flex flex-col">
                  <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1"><Scissors className="w-4 h-4" /> Hair Style</span>
                  <Select value={options.hair} onValueChange={v => handleOptionChange('hair', v)}>
                    <SelectTrigger className="w-full min-h-[40px] mt-0 rounded-lg shadow-sm border border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HAIR_OPTIONS.map(style => (
                        <SelectItem key={style} value={style}>
                          {style.charAt(0).toUpperCase() + style.slice(1).replace(/([A-Z])/g, ' $1')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1 mt-2"><Eye className="w-4 h-4" /> Eyes</span>
                  <Select value={options.eyes} onValueChange={v => handleOptionChange('eyes', v)}>
                    <SelectTrigger className="w-full min-h-[40px] mt-0 rounded-lg shadow-sm border border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EYES_OPTIONS.map(style => (
                        <SelectItem key={style} value={style}>
                          {style.charAt(0).toUpperCase() + style.slice(1).replace(/([A-Z])/g, ' $1')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Column 2 */}
                <div className="flex flex-col">
                  <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1"><Palette className="w-4 h-4" /> Hair Color</span>
                  <Select value={options.hairColor} onValueChange={v => handleOptionChange('hairColor', v)}>
                    <SelectTrigger className="w-full min-h-[40px] mt-0 rounded-lg shadow-sm border border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HAIR_COLOR_OPTIONS.map(color => (
                        <SelectItem key={color} value={color}>{color}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1 mt-2"><Droplet className="w-4 h-4" /> Skin Color</span>
                  <Select value={options.skinColor} onValueChange={v => handleOptionChange('skinColor', v)}>
                    <SelectTrigger className="w-full min-h-[40px] mt-0 rounded-lg shadow-sm border border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SKIN_COLOR_OPTIONS.map(color => (
                        <SelectItem key={color} value={color}>{color}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-1 flex flex-col">
                  <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1"><Smile className="w-4 h-4" /> Mouth</span>
                  <Select value={options.mouth} onValueChange={v => handleOptionChange('mouth', v)}>
                    <SelectTrigger className="w-full min-h-[40px] mt-0 rounded-lg shadow-sm border border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MOUTH_OPTIONS.map(style => (
                        <SelectItem key={style} value={style}>
                          {style.charAt(0).toUpperCase() + style.slice(1).replace(/([A-Z])/g, ' $1')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-1 flex flex-col">
                  <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1"><Sparkles className="w-4 h-4" /> Accessory</span>
                  <Select value={options.accessories[0] || 'none'} onValueChange={v => handleAccessoryChange(v)}>
                    <SelectTrigger className="w-full min-h-[40px] mt-0 rounded-lg shadow-sm border border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {ACCESSORIES_OPTIONS.map(acc => (
                        <SelectItem key={acc} value={acc}>
                          {acc.charAt(0).toUpperCase() + acc.slice(1).replace(/([A-Z])/g, ' $1')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </>
        )
      )}
    </div>
  )
}

{/* Idle and hover dice animation */}
<style jsx global>{`
@keyframes diceIdle {
  0% { transform: translateY(0) rotate(-5deg); }
  50% { transform: translateY(-4px) rotate(5deg); }
  100% { transform: translateY(0) rotate(-5deg); }
}
.animate-dice-idle {
  animation: diceIdle 2.2s ease-in-out infinite;
}
@keyframes diceBounce {
  0%, 100% { transform: translateY(0) scale(1); }
  30% { transform: translateY(-8px) scale(1.1); }
  50% { transform: translateY(-4px) scale(1.05); }
  70% { transform: translateY(-8px) scale(1.1); }
}
.hover\:animate-dice-bounce:hover {
  animation: diceBounce 0.5s cubic-bezier(.36,1.56,.64,1) 1;
}
.hover\:shadow-dice-glow:hover {
  box-shadow: 0 0 0 3px #a5b4fc, 0 0 8px 2px #818cf8;
}
`}</style> 