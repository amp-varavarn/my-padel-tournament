"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { SchedulePreview } from "@/components/schedule-preview"
import { ActiveRound } from "@/components/active-round"
import { Leaderboard } from "@/components/leaderboard"
import { recalculateStats } from "@/lib/tournament"
import type { Player, Round, MatchResult } from "@/lib/tournament"

type Screen = "schedule" | "active" | "leaderboard"

interface TournamentData {
  id: string
  screen: Screen
  players: Player[]
  rounds: Round[]
  currentRound: number
  matchHistory: MatchResult[]
  isAdmin: boolean
}

export default function TournamentPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const adminSecret = searchParams.get("admin") ?? ""

  const [data, setData] = useState<TournamentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // For edit-round flow: which round is being edited (null = normal flow)
  const [editingRound, setEditingRound] = useState<number | null>(null)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch tournament data
  const fetchTournament = useCallback(async () => {
    try {
      const url = adminSecret
        ? `/api/tournament/${id}?admin=${adminSecret}`
        : `/api/tournament/${id}`
      const res = await fetch(url)
      if (!res.ok) {
        if (res.status === 404) {
          setError("Tournament not found")
        } else {
          setError("Failed to load tournament")
        }
        return
      }
      const json = await res.json()
      setData(json)
      setError("")
    } catch {
      setError("Failed to load tournament")
    } finally {
      setLoading(false)
    }
  }, [id, adminSecret])

  // Initial load
  useEffect(() => {
    fetchTournament()
  }, [fetchTournament])

  // Polling for viewers (every 5s)
  useEffect(() => {
    if (!data || data.isAdmin) return

    pollRef.current = setInterval(fetchTournament, 5000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [data?.isAdmin, fetchTournament, data])

  // PATCH helper for admin mutations
  const patchTournament = useCallback(
    async (updates: Record<string, unknown>) => {
      const res = await fetch(`/api/tournament/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminSecret, ...updates }),
      })
      if (!res.ok) throw new Error("Failed to update")
      const json = await res.json()
      setData(json)
      return json
    },
    [id, adminSecret]
  )

  // --- Admin handlers ---

  const handleStartTournament = useCallback(async () => {
    await patchTournament({ screen: "active", currentRound: 1 })
  }, [patchTournament])

  const handleSubmitScores = useCallback(
    async (
      results: { score1: number; score2: number }[],
      forRound?: number
    ) => {
      if (!data) return

      const roundNum = forRound ?? data.currentRound
      const round = data.rounds[roundNum - 1]
      if (!round) return

      const newEntries: MatchResult[] = results.map((result, idx) => {
        const match = round.matches[idx]
        return {
          roundNumber: round.roundNumber,
          court: match.court,
          team1: match.team1,
          team2: match.team2,
          score1: result.score1,
          score2: result.score2,
        }
      })

      // Replace this round's entries in history
      const withoutThisRound = data.matchHistory.filter(
        (e) => e.roundNumber !== round.roundNumber
      )
      const correctedHistory = [...withoutThisRound, ...newEntries]

      await patchTournament({
        matchHistory: correctedHistory,
        screen: "leaderboard",
      })
      setEditingRound(null)
    },
    [data, patchTournament]
  )

  const handleNextRound = useCallback(async () => {
    if (!data) return
    await patchTournament({
      screen: "active",
      currentRound: data.currentRound + 1,
    })
  }, [data, patchTournament])

  const handleNewTournament = useCallback(() => {
    window.location.href = "/"
  }, [])

  const handleEditRound = useCallback(
    (roundNumber: number) => {
      if (!data) return
      setEditingRound(roundNumber)
    },
    [data]
  )

  // --- Render ---

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Loading tournament...
          </p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6">
        <p className="text-sm text-destructive">{error || "Not found"}</p>
        <button
          onClick={() => (window.location.href = "/")}
          className="mt-4 rounded-2xl border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-all hover:bg-secondary"
        >
          Back to Home
        </button>
      </div>
    )
  }

  const { isAdmin, screen, players, rounds, currentRound, matchHistory } = data

  // If editing a past round, show ActiveRound for that round
  if (editingRound !== null) {
    const round = rounds[editingRound - 1]
    if (!round) {
      setEditingRound(null)
      return null
    }

    // Pre-fill with existing scores from match history
    const existingResults = matchHistory.filter(
      (e) => e.roundNumber === editingRound
    )
    const existingScores = round.matches.map((match) => {
      const found = existingResults.find(
        (e) => e.court === match.court
      )
      return found
        ? { score1: found.score1, score2: found.score2 }
        : { score1: 0, score2: 0 }
    })

    return (
      <ActiveRound
        matches={round.matches}
        roundNumber={round.roundNumber}
        totalRounds={rounds.length}
        bye={round.bye}
        isAdmin={true}
        existingScores={existingScores}
        onSubmitScores={(results) =>
          handleSubmitScores(results, editingRound)
        }
        onViewLeaderboard={() => setEditingRound(null)}
        onBack={() => setEditingRound(null)}
      />
    )
  }

  // Recalculate stats client-side from history for display
  const computedPlayers = recalculateStats(matchHistory, players)

  if (screen === "schedule") {
    return (
      <SchedulePreview
        rounds={rounds}
        isAdmin={isAdmin}
        onStart={handleStartTournament}
        onBack={() => (window.location.href = "/")}
        onRefresh={fetchTournament}
      />
    )
  }

  if (screen === "active") {
    const round = rounds[currentRound - 1]
    if (!round) return null

    // Check if this round already has scores in history (re-entering)
    const existingResults = matchHistory.filter(
      (e) => e.roundNumber === round.roundNumber
    )
    const existingScores =
      existingResults.length > 0
        ? round.matches.map((match) => {
            const found = existingResults.find(
              (e) => e.court === match.court
            )
            return found
              ? { score1: found.score1, score2: found.score2 }
              : { score1: 0, score2: 0 }
          })
        : undefined

    return (
      <ActiveRound
        matches={round.matches}
        roundNumber={round.roundNumber}
        totalRounds={rounds.length}
        bye={round.bye}
        isAdmin={isAdmin}
        existingScores={existingScores}
        onSubmitScores={(results) => handleSubmitScores(results)}
        onViewLeaderboard={async () => {
          if (isAdmin) {
            await patchTournament({ screen: "leaderboard" })
          }
        }}
        onBack={async () => {
          if (isAdmin) {
            await patchTournament({ screen: "schedule" })
          }
        }}
        onRefresh={fetchTournament}
      />
    )
  }

  return (
    <Leaderboard
      players={computedPlayers}
      currentRound={currentRound}
      totalRounds={rounds.length}
      isFinal={currentRound >= rounds.length}
      isAdmin={isAdmin}
      matchHistory={matchHistory}
      tournamentId={id}
      onNextRound={handleNextRound}
      onNewTournament={handleNewTournament}
      onBack={async () => {
        if (isAdmin) {
          await patchTournament({ screen: "active" })
        }
      }}
      onEditRound={isAdmin ? handleEditRound : undefined}
      onRefresh={fetchTournament}
    />
  )
}
