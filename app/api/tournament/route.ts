import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { saveTournament } from "@/lib/redis"
import { generateFullSchedule } from "@/lib/tournament"
import type { Player } from "@/lib/tournament"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { players: playerNames, courts } = body as {
      players: string[]
      courts: number
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

    const rounds = generateFullSchedule(playerNames, courts)

    const tournament = {
      id,
      adminSecret,
      screen: "schedule" as const,
      players: playerObjects,
      rounds,
      currentRound: 0,
      matchHistory: [],
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
