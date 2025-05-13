"use client"

import React, { useRef, useState, useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createRoom, joinRoom } from "@/app/actions/room-actions"
import { DeckType } from "@/types/card"
import Link from "next/link"
import { motion } from "framer-motion"
import { User, Hash, Crown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/app/components/ui/loading-spinner"
import { AvatarBuilder } from "@/app/components/room/avatar-builder"

export default function Home() {
  const { toast } = useToast()
  const [tab, setTab] = useState("join")
  const [loading, setLoading] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const joinRoomReducer = async (_state: any, formData: FormData) => joinRoom(formData);
  const [joinState, joinFormAction] = useActionState(joinRoomReducer, null);
  // Avatar state for join form
  const [avatar, setAvatar] = useState({ style: "big-smile", seed: "" });
  // Avatar state for create form (host)
  const [hostAvatar, setHostAvatar] = useState({ style: "big-smile", seed: "" });
  // Add state for avatar options
  const [avatarOptions, setAvatarOptions] = useState({})
  const [hostAvatarOptions, setHostAvatarOptions] = useState({})

  // Autofocus name input on tab change or mount
  React.useEffect(() => {
    if (tab === "create" && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [tab])

  async function handleCreateRoom(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true)
    const formData = new FormData(e.currentTarget);
    try {
      const result: any = await createRoom(formData)
      if (result?.error) {
        toast({ title: "Error", description: result.error })
      } else {
        toast({ title: "Room created!", description: "Your Planning Poker room is ready." })
      }
    } catch (e: any) {
      // Ignore redirect errors
      if (e?.message?.includes('NEXT_REDIRECT')) {
        return;
      }
      toast({ title: "Error", description: "Failed to create room." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-700">
      {/* Mobile logo (top center) */}
      <div className="w-full flex justify-center pt-6 pb-2 md:hidden">
        <img src="/images/placeholder-logo.png" alt="EstiM8 logo" className="h-12 sm:h-14 md:h-16 lg:h-20 mb-2 mx-auto filter invert block md:hidden" />
      </div>
      <main className="flex-1 flex flex-col md:flex-row items-stretch justify-center max-w-5xl mx-auto px-2 sm:px-4 py-4 sm:py-8 gap-4 md:gap-8">
        {/* Left column */}
        <section className="hidden md:flex flex-1 flex-col justify-center items-center md:items-center text-center gap-6 md:gap-8 py-8 md:py-0 max-w-md mx-auto">
          <div className="w-full flex flex-col items-center">
            {/* Desktop logo (in hero) */}
            <img src="/images/placeholder-logo.png" alt="EstiM8 logo" className="h-16 md:h-20 mb-2 mx-auto filter invert hidden md:block" />
            <p className="text-xl md:text-2xl text-indigo-200 font-medium mb-4">Plan smarter, together.</p>
            <div className="flex flex-col md:flex-row items-center justify-center w-full gap-6 md:gap-8 mt-4">
              {/* Illustration with glow/gradient burst */}
              <div className="relative flex-shrink-0">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-56 h-32 md:w-60 md:h-36 bg-gradient-to-br from-indigo-400/30 via-purple-400/20 to-pink-400/10 rounded-full blur-2xl z-0" />
                <img src="/images/estim8-hero-visual.png" alt="Planning Poker illustration" className="relative z-10 mx-auto w-36 sm:w-44 md:w-52 rounded-xl  transition-transform duration-300 hover:-translate-y-2 " />
              </div>
              {/* Feature list to the right of the illustration */}
              <ul className="flex flex-col gap-3 md:gap-5 items-start justify-center md:min-w-[260px]">
                <li className="flex items-center gap-2 md:gap-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-green-500/20 text-green-400">
                    <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4 md:w-5 md:h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>
                  </span>
                  <span className="text-sm md:text-base lg:text-lg text-indigo-100">Real-time planning poker</span>
                </li>
                <li className="flex items-center gap-2 md:gap-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-green-500/20 text-green-400">
                    <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4 md:w-5 md:h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>
                  </span>
                  <span className="text-sm md:text-base lg:text-lg text-indigo-100">Customizable cards</span>
                </li>
                <li className="flex items-center gap-2 md:gap-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-green-500/20 text-green-400">
                    <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4 md:w-5 md:h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>
                  </span>
                  <span className="text-sm md:text-base lg:text-lg text-indigo-100">Live feedback</span>
                </li>
                <li className="flex items-center gap-2 md:gap-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-green-500/20 text-green-400">
                    <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4 md:w-5 md:h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>
                  </span>
                  <span className="text-sm md:text-base lg:text-lg text-indigo-100">Absolutely 100% Free</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
        {/* Vertical divider for desktop */}
        <div className="hidden md:flex items-center">
          <div className="h-5/6 w-[2px] bg-white/10 backdrop-blur-md rounded-full shadow-lg mx-4" />
        </div>
        {/* Right column */}
        <section className="flex-1 flex flex-col justify-center items-center">
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-xs sm:max-w-md md:max-w-lg min-h-[500px] flex flex-col justify-start rounded-2xl shadow-2xl shadow-indigo-900/40 bg-white/10 border border-white/10 backdrop-blur-md p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8"
          >
            <Tabs defaultValue={tab} value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-2">
                <TabsTrigger value="join" className={tab === "join" ? "border-b-2 border-indigo-500 text-indigo-300 transition-all" : "transition-all"}>Join Room</TabsTrigger>
                <TabsTrigger value="create" className={tab === "create" ? "border-b-2 border-indigo-500 text-indigo-300 transition-all" : "transition-all"}>Create Room</TabsTrigger>
              </TabsList>
              <TabsContent value="join">
                <Card className="bg-transparent shadow-none border-0 w-full">
                  <CardHeader>
                    <CardTitle className="text-white">Join an existing room</CardTitle>
                    <CardDescription className="text-slate-400">Enter a room code to join an existing session</CardDescription>
                  </CardHeader>
                  <form action={joinFormAction}>
                    <CardContent>
                      <div className="grid w-full items-center gap-2">
                        {/* Room Code Input */}
                        <div className="flex flex-col space-y-1">
                          <div className="relative flex items-center">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none">
                              <Hash size={18} />
                            </span>
                            <Input
                              name="roomCode"
                              placeholder="Room code (e.g. ABCD123)"
                              className="pl-10 text-base sm:text-xl tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                          </div>
                          {/* Server action error display */}
                          {typeof joinState?.error === 'string' && (
                            <span className="text-xs text-red-500 mt-1 ml-2 text-left">{joinState.error}</span>
                          )}
                        </div>
                        {/* User Name Input */}
                        <div className="flex flex-col space-y-1.5 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400"><User size={18} /></span>
                          <Input name="playerName" placeholder="Your name" className="pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        </div>
                        {/* Avatar Customization Section */}
                        <fieldset className="flex flex-col items-center mb-2 border border-border rounded-lg p-4 mt-2">
                          <legend className="px-2 text-sm font-semibold text-muted-foreground mb-2">Customize Avatar</legend>
                          <AvatarBuilder onAvatarChange={(_, options) => setAvatarOptions(options)} />
                          {/* Hidden input to submit avatar info as JSON */}
                          <input type="hidden" name="avatarStyle" value="big-smile" />
                          <input type="hidden" name="avatarSeed" value={JSON.stringify(avatarOptions)} />
                        </fieldset>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button type="submit" className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:brightness-110 active:scale-95 transition-all duration-200 text-white text-base py-2">
                        Join Room
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>
              <TabsContent value="create">
                <Card className="bg-transparent shadow-none border-0 w-full">
                  <CardHeader>
                    <CardTitle className="text-white">Create a new room</CardTitle>
                    <CardDescription className="text-slate-400">Start a new Planning Poker session</CardDescription>
                  </CardHeader>
                  <form onSubmit={handleCreateRoom}>
                    <CardContent>
                      <div className="grid w-full items-center gap-2">
                        {/* Room Name Input */}
                        <div className="flex flex-col space-y-1.5 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400"><Crown size={18} /></span>
                          <Input name="roomName" placeholder="Room name (optional)" className="pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        </div>
                        {/* Host Name Input */}
                        <div className="flex flex-col space-y-1.5 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400"><User size={18} /></span>
                          <Input ref={nameInputRef} name="hostName" placeholder="Your name (as host)" required className="pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        </div>
                        {/* Deck Type */}
                        <div className="flex flex-col space-y-1.5">
                          <label className="text-sm font-medium text-white">Deck Type</label>
                          <Select name="deckType" defaultValue={DeckType.FIBONACCI}>
                            <SelectTrigger className="focus:outline-none focus:ring-2 focus:ring-indigo-400">
                              <SelectValue placeholder="Select deck type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={DeckType.FIBONACCI}>Fibonacci</SelectItem>
                              <SelectItem value={DeckType.MODIFIED_FIBONACCI}>Modified Fibonacci</SelectItem>
                              <SelectItem value={DeckType.TSHIRT}>T-Shirt Sizes</SelectItem>
                              <SelectItem value={DeckType.POWERS_OF_TWO}>Powers of Two</SelectItem>
                              <SelectItem value={DeckType.SEQUENTIAL}>Sequential</SelectItem>
                              <SelectItem value={DeckType.RISK}>Risk Assessment</SelectItem>
                              <SelectItem value={DeckType.CUSTOM}>Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Avatar Customization Section */}
                        <fieldset className="flex flex-col items-center mb-2 border border-border rounded-lg p-4 mt-2">
                          <legend className="px-2 text-sm font-semibold text-muted-foreground mb-2">Customize Avatar</legend>
                          <AvatarBuilder onAvatarChange={(_, options) => setHostAvatarOptions(options)} />
                          <input type="hidden" name="avatarStyle" value="big-smile" />
                          <input type="hidden" name="avatarSeed" value={JSON.stringify(hostAvatarOptions)} />
                        </fieldset>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:brightness-110 active:scale-95 transition-all duration-200 text-white text-base py-2">
                        {loading ? <LoadingSpinner size={20} className="mr-2" /> : null}
                        Create Room
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </section>
      </main>
      {/* Footer always at the bottom */}
      <footer className="w-full text-center text-sm text-slate-400 py-4 mt-auto">
        <p>
          No registration required.{' '}
          <Link href="/about" className="underline underline-offset-4 hover:text-primary">
            Learn more
          </Link>
        </p>
      </footer>
    </div>
  )
}
