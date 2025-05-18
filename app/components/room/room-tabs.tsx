"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExportHistory } from "@/app/components/room/export-history"

interface Story {
  id: string;
  title: string;
  description: string;
  active: boolean;
  completed: boolean;
  finalScore?: string;
  finalEstimate?: string;
  manualOverride?: boolean;
  createdAt?: string;
  votes?: {
    playerId: string;
    playerName: string;
    value: string;
  }[];
}

interface RoomTabsProps {
  roomId: string;
  settings: {
    deck: string;
    celebrationsEnabled: boolean;
    emojisEnabled: boolean;
  };
  completedStories: Story[];
  onSettingsUpdate: (settings: any) => Promise<void>;
  onDeckUpdate: (deck: string) => Promise<void>;
}

export function RoomTabs({ roomId, settings, completedStories, onSettingsUpdate, onDeckUpdate }: RoomTabsProps) {
  return (
    <Tabs defaultValue="settings" className="w-full">
      <TabsList>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="settings">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Voting Deck</label>
            <select
              value={settings.deck}
              onChange={(e) => onDeckUpdate(e.target.value)}
              className="form-select"
            >
              <option value="fibonacci">Fibonacci</option>
              <option value="modified">Modified Fibonacci</option>
              <option value="tshirt">T-Shirt Sizes</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Celebrations</label>
            <input
              type="checkbox"
              checked={settings.celebrationsEnabled}
              onChange={(e) => onSettingsUpdate({ ...settings, celebrationsEnabled: e.target.checked })}
              className="form-checkbox"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Emojis</label>
            <input
              type="checkbox"
              checked={settings.emojisEnabled}
              onChange={(e) => onSettingsUpdate({ ...settings, emojisEnabled: e.target.checked })}
              className="form-checkbox"
            />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="history">
        <ExportHistory storyHistory={completedStories} />
      </TabsContent>
    </Tabs>
  );
}
