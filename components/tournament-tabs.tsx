"use client"

import { Trophy, Calendar, Play } from "lucide-react"

export type TabId = "leaderboard" | "rounds" | "current"

interface TournamentTabsProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  currentRound: number
  totalRounds: number
  hasStarted: boolean
}

export function TournamentTabs({
  activeTab,
  onTabChange,
  currentRound,
  totalRounds,
  hasStarted,
}: TournamentTabsProps) {
  const tabs: { id: TabId; label: string; icon: React.ReactNode; disabled?: boolean }[] = [
    {
      id: "leaderboard",
      label: "Leaderboard",
      icon: <Trophy className="h-4 w-4" />,
    },
    {
      id: "rounds",
      label: "Rounds",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      id: "current",
      label: currentRound > 0 ? `Round ${currentRound}` : "Current",
      icon: <Play className="h-4 w-4" />,
      disabled: !hasStarted,
    },
  ]

  return (
    <nav className="sticky top-0 z-40 flex items-center justify-center gap-1 border-b border-border bg-background/95 px-4 py-2 backdrop-blur-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => !tab.disabled && onTabChange(tab.id)}
          disabled={tab.disabled}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === tab.id
              ? "bg-primary text-primary-foreground"
              : tab.disabled
                ? "text-muted-foreground/40 cursor-not-allowed"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          {tab.icon}
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}

      {/* Progress indicator */}
      {hasStarted && (
        <div className="ml-3 flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5">
          <span className="text-xs text-muted-foreground">
            {currentRound}/{totalRounds}
          </span>
        </div>
      )}
    </nav>
  )
}
