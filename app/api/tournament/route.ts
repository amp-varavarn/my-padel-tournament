import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { saveTournament } from "@/lib/redis"
import { generateFullSchedule } from "@/lib/tournament"
import type { Player } from "@/lib/tournament"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { players: playerNames, courts, tournamentDuration, matchDuration } = body as {
      players: string[]
      courts: number
      tournamentDuration: number
      matchDuration: number
    }

    if (!playerNames || playerNames.length < 4) {
      return NextResponse.json(
        { error: "At least 4 players required" },
        { status: 400 }
      )
    }

    const id = nanoid(10)
    const adminSecret = nanoid(24)

    const playerObjects: Player[] = playerNames.map((name: string) => ({
      name,
      wins: 0,
      losses: 0,
      gamesFor: 0,
      gamesAgainst: 0,
    }))

    // Calculate total slots with 5-minute buffer between rounds
    const BUFFER_TIME = 5
    const roundCycleTime = matchDuration + BUFFER_TIME
    const totalSlots = Math.floor(tournamentDuration / roundCycleTime)
    
    // Generate rounds to fill all available slots
    const rounds = generateFullSchedule(playerNames, courts, totalSlots)

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

    await saveTournament(tournament)

    return NextResponse.json({ id, adminSecret })
  } catch {
    return NextResponse.json(
      { error: "Failed to create tournament" },
      { status: 500 }
    )
  }
}
