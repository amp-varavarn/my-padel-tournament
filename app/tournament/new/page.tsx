"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SetupScreen } from "@/components/setup-screen"
import { track } from "@vercel/analytics"

export default function NewTournamentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleGenerate = async (
    players: string[],
    courts: number,
    tournamentDuration: number,
    matchDuration: number
  ) => {
    track("tournament_create_submitted", {
      playersCount: players.length,
      courts,
      tournamentDuration,
      matchDuration,
    })
    setLoading(true)
    try {
      const res = await fetch("/api/tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players, courts, tournamentDuration, matchDuration }),
      })

      if (!res.ok) throw new Error("Failed to create tournament")

      const { id, adminSecret } = await res.json()
      track("tournament_created", {
        tournamentId: id,
        playersCount: players.length,
        courts,
      })
      router.push(`/tournament/${id}?admin=${adminSecret}`)
    } catch {
      track("tournament_create_failed", {
        playersCount: players.length,
        courts,
      })
      setLoading(false)
      alert("Failed to create tournament. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Creating tournament...
          </p>
        </div>
      </div>
    )
  }

  return <SetupScreen onGenerate={handleGenerate} />
}
