"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { TournamentTabs, type TabId } from "@/components/tournament-tabs"
import { SchedulePreview } from "@/components/schedule-preview"
import { ActiveRound } from "@/components/active-round"
import { Leaderboard } from "@/components/leaderboard"
import { TournamentIdBadge } from "@/components/tournament-id-badge"
import { recalculateStats } from "@/lib/tournament"
import type { Player, Round, MatchResult } from "@/lib/tournament"

interface TournamentData {
  id: string
  screen: "schedule" | "active" | "leaderboard"
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

  // Local tab state (derived from server screen, but can be changed locally)
  const [activeTab, setActiveTab] = useState<TabId>("leaderboard")

  // For edit-round flow
  const [editingRound, setEditingRound] = useState<number | null>(null)

  // Persisted scores across tab switches (admin only)
  const [draftScores, setDraftScores] = useState<
    Record<number, { score1: number; score2: number }[]>
  >({})

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

      // Initialize tab based on server state
      if (json.currentRound === 0) {
        setActiveTab("rounds")
      } else if (json.screen === "leaderboard") {
        setActiveTab("leaderboard")
      } else {
        setActiveTab("current")
      }
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
    setActiveTab("current")
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

      // Clear draft scores for this round
      setDraftScores((prev) => {
        const copy = { ...prev }
        delete copy[roundNum]
        return copy
      })

      setEditingRound(null)
      setActiveTab("leaderboard")
    },
    [data, patchTournament]
  )

  const handleNextRound = useCallback(async () => {
    if (!data) return
    await patchTournament({
      screen: "active",
      currentRound: data.currentRound + 1,
    })
    setActiveTab("current")
  }, [data, patchTournament])

  const handleNewTournament = useCallback(() => {
    window.location.href = "/"
  }, [])

  const handleEditRound = useCallback((roundNumber: number) => {
    setEditingRound(roundNumber)
    setActiveTab("current")
  }, [])

  // Save draft scores when switching tabs
  const handleSaveDraftScores = useCallback(
    (roundNum: number, scores: { score1: number; score2: number }[]) => {
      setDraftScores((prev) => ({
        ...prev,
        [roundNum]: scores,
      }))
    },
    []
  )

  // --- Render ---

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading tournament...</p>
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

  const { isAdmin, players, rounds, currentRound, matchHistory } = data
  const hasStarted = currentRound > 0
  const computedPlayers = recalculateStats(matchHistory, players)

  // Determine which round to show in the "current" tab
  const displayRound = editingRound ?? currentRound
  const round = rounds[displayRound - 1]

  // Get existing or draft scores for this round
  const getScoresForRound = (roundNum: number) => {
    if (draftScores[roundNum]) return draftScores[roundNum]
    const existingResults = matchHistory.filter((e) => e.roundNumber === roundNum)
    if (existingResults.length > 0) {
      const r = rounds[roundNum - 1]
      if (r) {
        return r.matches.map((match) => {
          const found = existingResults.find((e) => e.court === match.court)
          return found
            ? { score1: found.score1, score2: found.score2 }
            : { score1: 0, score2: 0 }
        })
      }
    }
    return undefined
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header with ID */}
      <header className="flex items-center justify-between px-6 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-xl font-semibold text-foreground">
            Padel Espresso
          </h1>
        </div>
        <TournamentIdBadge tournamentId={id} isAdmin={isAdmin} />
      </header>

      {/* Tab Navigation */}
      <TournamentTabs
        activeTab={activeTab}
        onTabChange={(tab) => {
          // Save current scores before switching
          if (isAdmin && activeTab === "current" && round && displayRound > 0) {
            const currentScores = draftScores[displayRound]
            if (currentScores) {
              handleSaveDraftScores(displayRound, currentScores)
            }
          }
          setEditingRound(null)
          setActiveTab(tab)
        }}
        currentRound={currentRound}
        totalRounds={rounds.length}
        hasStarted={hasStarted}
      />

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === "leaderboard" && (
          <Leaderboard
            players={computedPlayers}
            currentRound={currentRound}
            totalRounds={rounds.length}
            isFinal={currentRound >= rounds.length}
            isAdmin={isAdmin}
            matchHistory={matchHistory}
            onNextRound={handleNextRound}
            onNewTournament={handleNewTournament}
            onEditRound={isAdmin ? handleEditRound : undefined}
          />
        )}

        {activeTab === "rounds" && (
          <SchedulePreview
            rounds={rounds}
            isAdmin={isAdmin}
            tournamentId={id}
            onStart={handleStartTournament}
            onBack={() => (window.location.href = "/")}
            onRefresh={fetchTournament}
          />
        )}

        {activeTab === "current" && hasStarted && round && (
          <ActiveRound
            matches={round.matches}
            roundNumber={displayRound}
            totalRounds={rounds.length}
            bye={round.bye}
            isAdmin={isAdmin || editingRound !== null}
            tournamentId={id}
            existingScores={getScoresForRound(displayRound)}
            onSubmitScores={(results) => handleSubmitScores(results, editingRound ?? undefined)}
            onViewLeaderboard={() => setActiveTab("leaderboard")}
            onBack={() => setActiveTab("rounds")}
            onRefresh={fetchTournament}
            onScoresChange={
              isAdmin
                ? (scores) => handleSaveDraftScores(displayRound, scores)
                : undefined
            }
          />
        )}
      </div>
    </div>
  )
}
