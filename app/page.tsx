import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createRoom, joinRoom } from "@/app/actions/room-actions"
import { DeckType } from "@/types/card"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/80 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-primary">EstiM8</h1>
          <p className="text-muted-foreground">Real-time Planning Poker for agile teams</p>
        </div>

        <Tabs defaultValue="join" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="join">Join Room</TabsTrigger>
            <TabsTrigger value="create">Create Room</TabsTrigger>
          </TabsList>

          <TabsContent value="join">
            <Card>
              <CardHeader>
                <CardTitle>Join an existing room</CardTitle>
                <CardDescription>Enter a room code to join an existing session</CardDescription>
              </CardHeader>
              <form action={joinRoom}>
                <CardContent>
                  <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <Input
                        name="roomCode"
                        placeholder="Room code (e.g. ABCD123)"
                        className="text-center text-xl tracking-wider"
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <Input name="playerName" placeholder="Your name" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full">
                    Join Room
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create a new room</CardTitle>
                <CardDescription>Start a new Planning Poker session</CardDescription>
              </CardHeader>
              <form action={createRoom}>
                <CardContent>
                  <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <Input name="roomName" placeholder="Room name (optional)" />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <Input name="hostName" placeholder="Your name (as host)" required />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-sm font-medium">Deck Type</label>
                      <Select name="deckType" defaultValue={DeckType.FIBONACCI}>
                        <SelectTrigger>
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
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full">
                    Create Room
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            No registration required.{" "}
            <Link href="/about" className="underline underline-offset-4 hover:text-primary">
              Learn more
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
