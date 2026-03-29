import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { saveTournament } from "@/lib/redis"
import { generateFullSchedule } from "@/lib/tournament"
import type { Player } from "@/lib/tournament"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("[v0] POST /api/tournament body:", body)
    
    const { players: playerNames, courts, tournamentDuration, matchDuration } = body as {
      players: string[]
      courts: number
      tournamentDuration: number
      matchDuration: number
    }

    if (!playerNames || playerNames.length < 4) {
      console.log("[v0] Not enough players:", playerNames?.length)
      return NextResponse.json(
        { error: "At least 4 players required" },
        { status: 400 }
      )
    }

    const id = nanoid(10)
    const adminSecret = nanoid(24)
    console.log("[v0] Generated id:", id)

    const playerObjects: Player[] = playerNames.map((name: string) => ({
      name,
      wins: 0,
      losses: 0,
      gamesFor: 0,
      gamesAgainst: 0,
    }))

    // Generate all possible rounds, then cap to what fits in tournament duration
    console.log("[v0] Generating schedule for", playerNames.length, "players,", courts, "courts")
    const allRounds = generateFullSchedule(playerNames, courts)
    console.log("[v0] Generated", allRounds.length, "rounds")
    
    const maxRounds = Math.floor(tournamentDuration / matchDuration)
    const rounds = allRounds.slice(0, maxRounds)
    console.log("[v0] Capped to", rounds.length, "rounds (max:", maxRounds, ")")

    const tournament = {
      id,
      adminSecret,
      screen: "schedule" as const,
      players: playerObjects,
      rounds,
      currentRound: 0,
      matchHistory: [],
      tournamentDuration,
      matchDuration,
      createdAt: Date.now(),
    }

    console.log("[v0] Saving tournament to Redis...")
    await saveTournament(tournament)
    console.log("[v0] Tournament saved successfully")

    return NextResponse.json({ id, adminSecret })
  } catch (err) {
    console.error("[v0] Error creating tournament:", err)
    return NextResponse.json(
      { error: "Failed to create tournament" },
      { status: 500 }
    )
  }
}
