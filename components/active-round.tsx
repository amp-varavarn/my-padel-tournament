"use client"

import { useState, useCallback } from "react"
import { Trophy, Coffee, Minus, Plus, Check } from "lucide-react"
import type { Match } from "@/lib/tournament"

interface ActiveRoundProps {
  matches: Match[]
  roundNumber: number
  totalRounds: number
  bye: string | null
  onSubmitScores: (results: { score1: number; score2: number }[]) => void
  onViewLeaderboard: () => void
}

export function ActiveRound({
  matches,
  roundNumber,
  totalRounds,
  bye,
  onSubmitScores,
  onViewLeaderboard,
}: ActiveRoundProps) {
  const [scores, setScores] = useState<{ score1: number; score2: number }[]>(
    matches.map(() => ({ score1: 0, score2: 0 }))
  )
  const [confirming, setConfirming] = useState(false)

  const updateScore = useCallback(
    (matchIdx: number, team: "score1" | "score2", delta: number) => {
      setScores((prev) => {
        const copy = [...prev]
        const current = copy[matchIdx][team]
        const newVal = Math.max(0, current + delta)
        copy[matchIdx] = { ...copy[matchIdx], [team]: newVal }
        return copy
      })
    },
    []
  )

  const allFilled = scores.every((s) => s.score1 > 0 || s.score2 > 0)

  const handleSubmit = () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    onSubmitScores(scores)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-10 pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Round {roundNumber} of {totalRounds}
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-foreground">
            Match Scoring
          </h1>
        </div>
        <button
          onClick={onViewLeaderboard}
          className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground transition-all hover:bg-secondary"
        >
          <Trophy className="h-3.5 w-3.5" />
          Standings
        </button>
      </header>

      <main className="flex flex-1 flex-col gap-5 px-6 pb-10">
        {/* Bye notice */}
        {bye && (
          <div className="flex items-center gap-3 rounded-2xl bg-secondary px-5 py-3.5">
            <Coffee className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-foreground">
              <span className="font-semibold">{bye}</span>
              <span className="text-muted-foreground"> rests this round</span>
            </p>
          </div>
        )}

        {/* Match Cards */}
        {matches.map((match, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-card border border-border overflow-hidden"
          >
            {/* Court label */}
            <div className="bg-secondary/50 px-5 py-3">
              <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Court {match.court}
              </span>
            </div>

            <div className="px-5 py-5">
              {/* Team 1 row */}
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-snug truncate">
                    {match.team1[0]}
                  </p>
                  <p className="text-sm text-muted-foreground leading-snug truncate">
                    {match.team1[1]}
                  </p>
                </div>

                {/* Score 1 controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateScore(idx, "score1", -1)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-all hover:text-foreground active:scale-95"
                    aria-label="Decrease team 1 score"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-mono text-3xl font-bold tabular-nums text-foreground">
                    {scores[idx].score1}
                  </span>
                  <button
                    onClick={() => updateScore(idx, "score1", 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:opacity-90 active:scale-95"
                    aria-label="Increase team 1 score"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="my-4 flex items-center gap-3">
                <div className="flex-1 border-t border-border" />
                <span className="text-xs font-medium text-muted-foreground uppercase">vs</span>
                <div className="flex-1 border-t border-border" />
              </div>

              {/* Team 2 row */}
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-snug truncate">
                    {match.team2[0]}
                  </p>
                  <p className="text-sm text-muted-foreground leading-snug truncate">
                    {match.team2[1]}
                  </p>
                </div>

                {/* Score 2 controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateScore(idx, "score2", -1)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-all hover:text-foreground active:scale-95"
                    aria-label="Decrease team 2 score"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-mono text-3xl font-bold tabular-nums text-foreground">
                    {scores[idx].score2}
                  </span>
                  <button
                    onClick={() => updateScore(idx, "score2", 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:opacity-90 active:scale-95"
                    aria-label="Increase team 2 score"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Submit Area */}
        <div className="mt-auto pt-4">
          {confirming ? (
            <div className="flex flex-col gap-3">
              <p className="text-center text-sm text-muted-foreground">
                Confirm scores and continue?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 rounded-2xl border border-border bg-card py-4 text-sm font-medium text-foreground transition-all hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
                >
                  <Check className="h-4 w-4" />
                  Confirm
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              className={`w-full rounded-2xl py-4 text-base font-semibold transition-all ${
                allFilled
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              Submit Match
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
