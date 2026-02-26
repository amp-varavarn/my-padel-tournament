"use client"

import { useState, useRef, useEffect } from "react"
import {
  ArrowLeft,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  Pencil,
  RefreshCw,
} from "lucide-react"
import { TournamentIdBadge } from "@/components/tournament-id-badge"
import type { Player, MatchResult } from "@/lib/tournament"

interface LeaderboardProps {
  players: Player[]
  currentRound: number
  totalRounds: number
  isFinal: boolean
  isAdmin: boolean
  matchHistory: MatchResult[]
  tournamentId?: string
  onNextRound: () => void
  onNewTournament: () => void
  onBack: () => void
  onEditRound?: (roundNumber: number) => void
  onRefresh?: () => void
}

export function Leaderboard({
  players,
  currentRound,
  totalRounds,
  isFinal,
  isAdmin,
  matchHistory,
  tournamentId,
  onNextRound,
  onNewTournament,
  onBack,
  onEditRound,
  onRefresh,
}: LeaderboardProps) {
  const sorted = [...players].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins
    const diffA = a.gamesFor - a.gamesAgainst
    const diffB = b.gamesFor - b.gamesAgainst
    if (diffB !== diffA) return diffB - diffA
    return b.gamesFor - a.gamesFor
  })

  // Group history by round
  const roundGroups = matchHistory.reduce<Record<number, MatchResult[]>>(
    (acc, result) => {
      if (!acc[result.roundNumber]) acc[result.roundNumber] = []
      acc[result.roundNumber].push(result)
      return acc
    },
    {}
  )
  const roundNumbers = Object.keys(roundGroups)
    .map(Number)
    .sort((a, b) => b - a)

  // Accordion state
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const toggleRound = (rn: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(rn)) next.delete(rn)
      else next.add(rn)
      return next
    })
  }

  // "Back to top" visibility
  const leaderboardRef = useRef<HTMLDivElement>(null)
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowBackToTop(!entry.isIntersecting),
      { threshold: 0.1 }
    )
    if (leaderboardRef.current) observer.observe(leaderboardRef.current)
    return () => observer.disconnect()
  }, [])

  const scrollToTop = () => {
    leaderboardRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <header
        className="flex items-center gap-4 px-6 pt-10 pb-6"
        ref={leaderboardRef}
      >
        <button
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all hover:bg-secondary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {isFinal ? "Final Standings" : `After Round ${currentRound}`}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-foreground">
            {isFinal ? "Champion" : "Leaderboard"}
          </h1>
          {tournamentId && (
            <div className="mt-1.5">
              <TournamentIdBadge tournamentId={tournamentId} isAdmin={isAdmin} />
            </div>
          )}
        </div>
        {!isAdmin && onRefresh && (
          <button
            onClick={onRefresh}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all hover:bg-secondary"
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </header>

      <main className="flex flex-1 flex-col gap-6 px-6 pb-10">
        {/* Winner highlight on final */}
        {isFinal && sorted.length > 0 && (
          <div className="flex flex-col items-center rounded-2xl bg-primary px-6 py-8 text-center">
            <span className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground/60">
              Winner
            </span>
            <h2 className="font-serif text-3xl font-bold text-primary-foreground">
              {sorted[0].name}
            </h2>
            <p className="mt-1 text-sm text-primary-foreground/70">
              {sorted[0].wins} {sorted[0].wins === 1 ? "win" : "wins"}{" "}
              &middot;{" "}
              {sorted[0].gamesFor - sorted[0].gamesAgainst > 0 ? "+" : ""}
              {sorted[0].gamesFor - sorted[0].gamesAgainst} game diff
            </p>
          </div>
        )}

        {/* Rankings Table */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="grid grid-cols-[2.5rem_1fr_3rem_3rem_3rem_3.5rem] items-center gap-1 px-5 py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground border-b border-border">
            <span>#</span>
            <span>Player</span>
            <span className="text-center">W</span>
            <span className="text-center">L</span>
            <span className="text-center">GW</span>
            <span className="text-center">+/-</span>
          </div>

          {sorted.map((player, idx) => {
            const diff = player.gamesFor - player.gamesAgainst
            const isFirst = idx === 0

            return (
              <div
                key={player.name}
                className={`grid grid-cols-[2.5rem_1fr_3rem_3rem_3rem_3.5rem] items-center gap-1 px-5 py-3.5 text-sm ${
                  idx !== sorted.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    idx < 3
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {idx + 1}
                </span>

                <span
                  className={`font-medium truncate ${
                    isFirst ? "text-foreground" : "text-foreground/80"
                  }`}
                >
                  {player.name}
                </span>

                <span className="text-center font-mono font-bold text-foreground">
                  {player.wins}
                </span>

                <span className="text-center font-mono text-muted-foreground">
                  {player.losses}
                </span>

                <span className="text-center font-mono text-muted-foreground">
                  {player.gamesFor}
                </span>

                <span
                  className={`text-center font-mono font-semibold ${
                    diff > 0
                      ? "text-foreground"
                      : diff < 0
                        ? "text-destructive"
                        : "text-muted-foreground"
                  }`}
                >
                  {diff > 0 ? `+${diff}` : diff}
                </span>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isAdmin && !isFinal && (
            <button
              onClick={onNextRound}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground transition-all hover:opacity-90"
            >
              Round {currentRound + 1}
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={onNewTournament}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-4 text-sm font-medium text-foreground transition-all hover:bg-secondary"
          >
            <RotateCcw className="h-4 w-4" />
            New Tournament
          </button>
        </div>

        {/* Round Summaries */}
        {roundNumbers.length > 0 && (
          <section className="mt-2">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Round Summaries
            </h2>

            <div className="flex flex-col gap-3">
              {roundNumbers.map((rn) => {
                const isOpen = expanded.has(rn)
                const results = roundGroups[rn]

                return (
                  <div
                    key={rn}
                    className="rounded-2xl border border-border bg-card overflow-hidden"
                  >
                    {/* Accordion trigger */}
                    <button
                      onClick={() => toggleRound(rn)}
                      className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-secondary/40"
                    >
                      <span className="text-sm font-semibold text-foreground">
                        Round {rn}
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Edit button -- Admin only */}
                        {isAdmin && onEditRound && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onEditRound(rn)
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            aria-label={`Edit round ${rn}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {/* Accordion content */}
                    {isOpen && (
                      <div className="border-t border-border">
                        {results.map((result, idx) => {
                          const t1Won = result.score1 > result.score2

                          return (
                            <div
                              key={idx}
                              className={`flex items-center gap-3 px-5 py-3.5 ${
                                idx !== results.length - 1
                                  ? "border-b border-border"
                                  : ""
                              }`}
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-muted-foreground">
                                {result.court}
                              </span>

                              <div className="flex flex-1 flex-col gap-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2">
                                  <span
                                    className={`text-sm truncate ${
                                      t1Won
                                        ? "font-semibold text-foreground"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {result.team1[0]} / {result.team1[1]}
                                  </span>
                                  <span
                                    className={`shrink-0 font-mono text-sm tabular-nums ${
                                      t1Won
                                        ? "font-bold text-foreground"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {result.score1}
                                  </span>
                                </div>
                                <div className="flex items-baseline justify-between gap-2">
                                  <span
                                    className={`text-sm truncate ${
                                      !t1Won
                                        ? "font-semibold text-foreground"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {result.team2[0]} / {result.team2[1]}
                                  </span>
                                  <span
                                    className={`shrink-0 font-mono text-sm tabular-nums ${
                                      !t1Won
                                        ? "font-bold text-foreground"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {result.score2}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>

      {/* Floating "Back to Leaderboard" button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:opacity-90 active:scale-95"
          aria-label="Back to leaderboard"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
