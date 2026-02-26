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
 * Rotating-ribbon (circle-method) Individual Americano scheduler.
 *
 * Fix Player 1 in place. The remaining N-1 players sit on a "ribbon" that
 * rotates one position clockwise each round.
 *
 * Even player count (N):
 *   - N-1 rounds, 0 byes.
 *   - Each round: pair the top row with the bottom row (folded) to form
 *     two-person teams, then pair teams against each other for matches.
 *
 * Odd player count (N):
 *   - N rounds (we add a phantom slot; whoever lands on it gets the bye).
 *   - After removing the bye player, the remaining even group is paired
 *     identically.
 *
 * Result: every player partners with every other player exactly once over
 * the full tournament (for even N), or nearly once (for odd N).
 */
export function generateFullSchedule(
  playerNames: string[],
  courts: number
): Round[] {
  const n = playerNames.length

  // For the circle method we need an even-sized list.
  // If odd, we add a "BYE" phantom and whoever is paired with it sits out.
  const isOdd = n % 2 !== 0
  const list = [...playerNames]
  if (isOdd) list.push("__BYE__")

  const size = list.length // always even now
  const totalRounds = size - 1

  // The "fixed" player is list[0]. The rest rotate.
  const fixed = list[0]
  const rotating = list.slice(1) // length = size - 1

  const rounds: Round[] = []

  for (let r = 0; r < totalRounds; r++) {
    // Build the current ordering: fixed + rotated array
    const current = [fixed, ...rotating]

    // Pair them using the fold method:
    // Position 0 pairs with position size-1
    // Position 1 pairs with position size-2
    // etc.
    const pairs: [string, string][] = []
    for (let i = 0; i < size / 2; i++) {
      pairs.push([current[i], current[size - 1 - i]])
    }

    // Determine if there is a bye this round
    let bye: string | null = null
    const activePairs: [string, string][] = []

    for (const pair of pairs) {
      if (pair[0] === "__BYE__") {
        bye = pair[1]
      } else if (pair[1] === "__BYE__") {
        bye = pair[0]
      } else {
        activePairs.push(pair)
      }
    }

    // Now group pairs into matches (two pairs per match).
    // Each match puts one pair as team1 and another as team2.
    // Limit to the number of courts available.
    const matchCount = Math.min(courts, Math.floor(activePairs.length / 2))
    const matches: Match[] = []

    for (let m = 0; m < matchCount; m++) {
      const p1 = activePairs[m * 2]
      const p2 = activePairs[m * 2 + 1]
      if (p1 && p2) {
        matches.push({
          court: m + 1,
          team1: p1,
          team2: p2,
          score1: 0,
          score2: 0,
          submitted: false,
        })
      }
    }

    rounds.push({
      roundNumber: r + 1,
      matches,
      bye,
    })

    // Rotate the ribbon: last element moves to the front
    rotating.unshift(rotating.pop()!)
  }

  return rounds
}
