"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"

interface SetupScreenProps {
  onGenerate: (players: string[], courts: number, matchDuration: number) => void
}

export function SetupScreen({ onGenerate }: SetupScreenProps) {
  const [playerName, setPlayerName] = useState("")
  const [players, setPlayers] = useState<string[]>([])
  const [courts, setCourts] = useState(1)
  const [matchDuration, setMatchDuration] = useState(10)

  const addPlayer = () => {
    const trimmed = playerName.trim()
    if (trimmed && !players.includes(trimmed)) {
      setPlayers([...players, trimmed])
      setPlayerName("")
    }
  }

  const removePlayer = (name: string) => {
    setPlayers(players.filter((p) => p !== name))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addPlayer()
    }
  }

  const canGenerate = players.length >= 4
  const isOdd = players.length % 2 !== 0 && players.length >= 4

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <header className="px-6 pt-10 pb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Tournament Setup
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-foreground">
          Espresso Padel
        </h1>
      </header>

      <main className="flex flex-1 flex-col gap-8 px-6 pb-10">
        {/* Courts */}
        <section>
          <label className="mb-3 block text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Number of Courts
          </label>
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((c) => (
              <button
                key={c}
                onClick={() => setCourts(c)}
                className={`flex h-14 flex-1 items-center justify-center rounded-2xl text-sm font-semibold transition-all ${
                  courts === c
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-foreground border border-border hover:border-foreground/20"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        {/* Match Duration */}
        <section>
          <label className="mb-3 block text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Match Duration
          </label>
          <div className="flex gap-3">
            {[7, 10, 12, 15].map((mins) => (
              <button
                key={mins}
                onClick={() => setMatchDuration(mins)}
                className={`flex h-14 flex-1 items-center justify-center rounded-2xl text-sm font-semibold transition-all ${
                  matchDuration === mins
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-foreground border border-border hover:border-foreground/20"
                }`}
              >
                {mins} min
              </button>
            ))}
          </div>
        </section>

        {/* Players */}
        <section className="flex-1">
          <div className="mb-3 flex items-baseline justify-between">
            <label className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Players
            </label>
            <span className="text-xs text-muted-foreground">
              {players.length} added {players.length < 4 && `(min 4)`}
            </span>
          </div>

          <div className="mb-4 flex gap-3">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Player name"
              className="flex-1 rounded-2xl border border-border bg-card px-5 py-4 text-sm text-card-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all"
            />
            <button
              onClick={addPlayer}
              disabled={!playerName.trim()}
              className="flex h-[54px] items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Add player"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>

          {players.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Add your first player above
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {players.map((name, idx) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-2xl bg-card border border-border px-5 py-3.5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {name}
                    </span>
                  </div>
                  <button
                    onClick={() => removePlayer(name)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Remove ${name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {isOdd && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Odd number of players -- one player will rest each round (bye).
            </p>
          )}
        </section>

        {/* Generate Button */}
        <div className="pt-2">
          <button
            onClick={() => onGenerate(players, courts, matchDuration)}
            disabled={!canGenerate}
            className="w-full rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {canGenerate ? "Generate Schedule" : `Add ${4 - players.length} more player${4 - players.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </main>
    </div>
  )
}
