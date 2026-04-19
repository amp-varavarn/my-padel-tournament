export interface Player {
  name: string
  wins: number
  losses: number
  gamesFor: number
  gamesAgainst: number
}

export interface Match {
  court: number
  team1: [string, string]
  team2: [string, string]
  score1: number
  score2: number
  submitted: boolean
}

export interface Round {
  roundNumber: number
  matches: Match[]
  bye: string | null
}

export interface MatchResult {
  roundNumber: number
  court: number
  team1: [string, string]
  team2: [string, string]
  score1: number
  score2: number
}

/**
 * Recompute all player stats from scratch based on the full match history.
 * Used by both server (API) and client to avoid incremental drift.
 */
export function recalculateStats(
  history: MatchResult[],
  playerList: Player[]
): Player[] {
  const updated = playerList.map((p) => ({
    ...p,
    wins: 0,
    losses: 0,
    gamesFor: 0,
    gamesAgainst: 0,
  }))

  history.forEach((entry) => {
    const team1Won = entry.score1 > entry.score2
    const isDraw = entry.score1 === entry.score2

    entry.team1.forEach((name) => {
      const player = updated.find((p) => p.name === name)
      if (player) {
        player.gamesFor += entry.score1
        player.gamesAgainst += entry.score2
        if (!isDraw) {
          if (team1Won) player.wins += 1
          else player.losses += 1
        }
      }
    })

    entry.team2.forEach((name) => {
      const player = updated.find((p) => p.name === name)
      if (player) {
        player.gamesFor += entry.score2
        player.gamesAgainst += entry.score1
        if (!isDraw) {
          if (!team1Won) player.wins += 1
          else player.losses += 1
        }
      }
    })
  })

  return updated
}

/**
 * Continuous Individual Americano scheduler.
 *
 * Generates EXACTLY `totalSlots` rounds by cycling through all possible matchups.
 * For 4 players there are 3 unique Padel pairings; we use modulo (%) to repeat them.
 * Ensures variety by avoiding same matchup in consecutive rounds when possible.
 */
export function generateFullSchedule(
  playerNames: string[],
  courts: number,
  totalSlots: number
): Round[] {
  const n = playerNames.length
  const isOdd = n % 2 !== 0

  // Pre-generate ALL possible matchups for a set of players
  function generateAllMatchups(players: string[]): { team1: [string, string]; team2: [string, string] }[] {
    const matchups: { team1: [string, string]; team2: [string, string] }[] = []
    const teams: [string, string][] = []
    
    // Generate all possible teams of 2
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        teams.push([players[i], players[j]])
      }
    }
    
    // Generate all valid matchups (two teams with no overlapping players)
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const t1 = teams[i]
        const t2 = teams[j]
        const t1Set = new Set(t1)
        if (!t2.some(p => t1Set.has(p))) {
          matchups.push({ team1: t1, team2: t2 })
        }
      }
    }
    return matchups
  }

  // For even player counts, pre-compute matchups once
  const baseMatchups = isOdd ? [] : generateAllMatchups(playerNames)
  const numBaseMatchups = baseMatchups.length
  
  // For odd player counts, track bye distribution
  const byeCount: Map<string, number> = new Map()
  playerNames.forEach((p) => byeCount.set(p, 0))

  // Create output array with EXACTLY totalSlots rounds
  const rounds: Round[] = new Array(totalSlots)
  
  let prevRoundKey = ""

  // STRICT FOR LOOP: runs exactly totalSlots times
  for (let i = 0; i < totalSlots; i++) {
    const roundNum = i + 1
    let bye: string | null = null
    let activePlayers = [...playerNames]
    let matchups = baseMatchups

    // Handle bye for odd player counts
    if (isOdd) {
      // Pick player with fewest byes so far
      activePlayers.sort((a, b) => (byeCount.get(a) || 0) - (byeCount.get(b) || 0))
      bye = activePlayers.shift()!
      byeCount.set(bye, (byeCount.get(bye) || 0) + 1)
      // Regenerate matchups for remaining players
      matchups = generateAllMatchups(activePlayers)
    }

    const numMatchups = matchups.length
    
    // Build matches array (up to one disjoint match per court).
    // A player can only appear once per round, even with multiple courts.
    const maxMatches = Math.min(courts, Math.floor(activePlayers.length / 4))
    const startIndex = i % numMatchups
    const selectedMatchups:
      { team1: [string, string]; team2: [string, string] }[] = []

    // Try different start points to assemble a full disjoint set.
    // Greedy is sufficient here because valid combinations are dense.
    for (let attempt = 0; attempt < numMatchups && selectedMatchups.length < maxMatches; attempt++) {
      const usedPlayers = new Set<string>()
      const candidate: { team1: [string, string]; team2: [string, string] }[] = []

      for (let step = 0; step < numMatchups; step++) {
        const idx = (startIndex + attempt + step) % numMatchups
        const matchup = matchups[idx]
        const playersInMatch = [
          matchup.team1[0],
          matchup.team1[1],
          matchup.team2[0],
          matchup.team2[1],
        ]
        const hasOverlap = playersInMatch.some((p) => usedPlayers.has(p))
        if (hasOverlap) continue

        candidate.push(matchup)
        playersInMatch.forEach((p) => usedPlayers.add(p))

        if (candidate.length === maxMatches) break
      }

      if (candidate.length > selectedMatchups.length) {
        selectedMatchups.splice(0, selectedMatchups.length, ...candidate)
      }
    }

    // Avoid repeating exact same court set in consecutive rounds when possible.
    const candidateRoundKey = selectedMatchups
      .map((m) => [...m.team1, ...m.team2].sort().join(":"))
      .sort()
      .join("|")
    if (candidateRoundKey === prevRoundKey && numMatchups > 1) {
      // One more shifted pass to try a different disjoint combination.
      const usedPlayers = new Set<string>()
      const alternative: { team1: [string, string]; team2: [string, string] }[] = []
      for (let step = 0; step < numMatchups; step++) {
        const idx = (startIndex + 1 + step) % numMatchups
        const matchup = matchups[idx]
        const playersInMatch = [
          matchup.team1[0],
          matchup.team1[1],
          matchup.team2[0],
          matchup.team2[1],
        ]
        const hasOverlap = playersInMatch.some((p) => usedPlayers.has(p))
        if (hasOverlap) continue
        alternative.push(matchup)
        playersInMatch.forEach((p) => usedPlayers.add(p))
        if (alternative.length === maxMatches) break
      }
      if (alternative.length === maxMatches) {
        selectedMatchups.splice(0, selectedMatchups.length, ...alternative)
      }
    }

    prevRoundKey = selectedMatchups
      .map((m) => [...m.team1, ...m.team2].sort().join(":"))
      .sort()
      .join("|")

    const matches: Match[] = []
    for (let c = 0; c < selectedMatchups.length; c++) {
      const matchup = selectedMatchups[c]
      matches.push({
        court: c + 1,
        team1: matchup.team1,
        team2: matchup.team2,
        score1: 0,
        score2: 0,
        submitted: false,
      })
    }

    rounds[i] = {
      roundNumber: roundNum,
      matches,
      bye,
    }
  }

  console.log("[v0] generateFullSchedule: totalSlots =", totalSlots, ", returning", rounds.length, "rounds")
  return rounds
}
