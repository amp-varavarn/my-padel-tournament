import { NextResponse } from "next/server"
import { loadTournament, saveTournament } from "@/lib/redis"
import { recalculateStats } from "@/lib/tournament"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const tournament = await loadTournament(id)

  if (!tournament) {
    return NextResponse.json(
      { error: "Tournament not found" },
      { status: 404 }
    )
  }

  // Check if the caller is admin
  const url = new URL(request.url)
  const adminParam = url.searchParams.get("admin")
  const isAdmin = adminParam === tournament.adminSecret

  // Never expose the adminSecret to the client
  const { adminSecret: _secret, ...publicData } = tournament

  return NextResponse.json({ ...publicData, isAdmin })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const tournament = await loadTournament(id)

  if (!tournament) {
    return NextResponse.json(
      { error: "Tournament not found" },
      { status: 404 }
    )
  }

  const body = await request.json()
  const { adminSecret, ...updates } = body as Record<string, unknown>

  // Verify admin
  if (adminSecret !== tournament.adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // Apply updates
  if (updates.screen !== undefined) tournament.screen = updates.screen
  if (updates.currentRound !== undefined)
    tournament.currentRound = updates.currentRound

  // If matchHistory is provided, replace and recalculate stats
  if (updates.matchHistory !== undefined) {
    tournament.matchHistory = updates.matchHistory
    tournament.players = recalculateStats(
      tournament.matchHistory,
      tournament.players
    )
  }

  await saveTournament(tournament)

  // Return updated state (without secret)
  const { adminSecret: _s, ...publicData } = tournament
  return NextResponse.json({ ...publicData, isAdmin: true })
}
