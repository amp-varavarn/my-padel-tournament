"use client"

import { useState, useCallback, useEffect } from "react"
import { SetupScreen } from "@/components/setup-screen"
import { SchedulePreview } from "@/components/schedule-preview"
import { ActiveRound } from "@/components/active-round"
import { Leaderboard } from "@/components/leaderboard"
import { generateFullSchedule } from "@/lib/tournament"
import type { Player, Round, MatchResult } from "@/lib/tournament"

type Screen = "setup" | "schedule" | "active" | "leaderboard"

const STORAGE_KEY = "espresso-padel-tournament"

interface TournamentState {
  screen: Screen
  players: Player[]
  rounds: Round[]
  currentRound: number
  matchDuration: number
  matchHistory: MatchResult[]
}

function loadState(): TournamentState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as TournamentState
  } catch {
    return null
  }
}

function saveState(state: TournamentState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage full or unavailable
  }
}

function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export default function Page() {
  const [screen, setScreen] = useState<Screen>("setup")
  const [players, setPlayers] = useState<Player[]>([])
  const [rounds, setRounds] = useState<Round[]>([])
  const [currentRound, setCurrentRound] = useState(0)
  const [matchDuration, setMatchDuration] = useState(10)
  const [matchHistory, setMatchHistory] = useState<MatchResult[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Restore from localStorage on mount
  useEffect(() => {
    const saved = loadState()
    if (saved) {
      setScreen(saved.screen)
      setPlayers(saved.players)
      setRounds(saved.rounds)
      setCurrentRound(saved.currentRound)
      setMatchDuration(saved.matchDuration)
      setMatchHistory(saved.matchHistory ?? [])
    }
    setHydrated(true)
  }, [])

  // Persist every state change (after hydration)
  useEffect(() => {
    if (!hydrated) return
    saveState({ screen, players, rounds, currentRound, matchDuration, matchHistory })
  }, [hydrated, screen, players, rounds, currentRound, matchDuration, matchHistory])

  const handleGenerate = useCallback(
    (playerNames: string[], courts: number, duration: number) => {
      const newPlayers: Player[] = playerNames.map((name) => ({
        name,
        wins: 0,
        losses: 0,
        gamesFor: 0,
        gamesAgainst: 0,
      }))

      setPlayers(newPlayers)
      setMatchDuration(duration)
      setMatchHistory([])

      const schedule = generateFullSchedule(playerNames, courts)
      setRounds(schedule)
      setCurrentRound(0)
      setScreen("schedule")
    },
    []
  )

  const handleStartTournament = useCallback(() => {
    setCurrentRound(1)
    setScreen("active")
  }, [])

  const handleSubmitScores = useCallback(
    (results: { score1: number; score2: number }[]) => {
      const round = rounds[currentRound - 1]
      if (!round) return

      // Build history entries for this round
      const newHistoryEntries: MatchResult[] = results.map((result, idx) => {
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

      setMatchHistory((prev) => [...prev, ...newHistoryEntries])

      setPlayers((prev) => {
        const updated = prev.map((p) => ({ ...p }))

        results.forEach((result, idx) => {
          const match = round.matches[idx]
          if (!match) return

          const team1Won = result.score1 > result.score2
          const isDraw = result.score1 === result.score2

          // Team 1 players
          match.team1.forEach((name) => {
            const player = updated.find((p) => p.name === name)
            if (player) {
              player.gamesFor += result.score1
              player.gamesAgainst += result.score2
              if (!isDraw) {
                if (team1Won) player.wins += 1
                else player.losses += 1
              }
            }
          })

          // Team 2 players
          match.team2.forEach((name) => {
            const player = updated.find((p) => p.name === name)
            if (player) {
              player.gamesFor += result.score2
              player.gamesAgainst += result.score1
              if (!isDraw) {
                if (!team1Won) player.wins += 1
                else player.losses += 1
              }
            }
          })
        })

        return updated
      })

      setScreen("leaderboard")
    },
    [rounds, currentRound]
  )

  const handleNextRound = useCallback(() => {
    setCurrentRound((prev) => prev + 1)
    setScreen("active")
  }, [])

  const handleNewTournament = useCallback(() => {
    setScreen("setup")
    setPlayers([])
    setRounds([])
    setCurrentRound(0)
    setMatchHistory([])
    clearState()
  }, [])

  // Don't render until hydrated to avoid flash of wrong state
  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (screen === "setup") {
    return <SetupScreen onGenerate={handleGenerate} />
  }

  if (screen === "schedule") {
    return (
      <SchedulePreview
        rounds={rounds}
        onStart={handleStartTournament}
        onBack={() => setScreen("setup")}
      />
    )
  }

  if (screen === "active") {
    const round = rounds[currentRound - 1]
    if (!round) return null

    return (
      <ActiveRound
        matches={round.matches}
        roundNumber={round.roundNumber}
        totalRounds={rounds.length}
        bye={round.bye}
        onSubmitScores={handleSubmitScores}
        onViewLeaderboard={() => setScreen("leaderboard")}
      />
    )
  }

  return (
    <Leaderboard
      players={players}
      currentRound={currentRound}
      totalRounds={rounds.length}
      isFinal={currentRound >= rounds.length}
      matchHistory={matchHistory}
      onNextRound={handleNextRound}
      onNewTournament={handleNewTournament}
    />
  )
}
