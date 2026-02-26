"use client"

import { ArrowLeft, Coffee, RefreshCw } from "lucide-react"
import { TournamentIdBadge } from "@/components/tournament-id-badge"
import type { Round } from "@/lib/tournament"

interface SchedulePreviewProps {
  rounds: Round[]
  isAdmin: boolean
  tournamentId?: string
  onStart: () => void
  onBack: () => void
  onRefresh?: () => void
}

export function SchedulePreview({
  rounds,
  isAdmin,
  tournamentId,
  onStart,
  onBack,
  onRefresh,
}: SchedulePreviewProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 pt-10 pb-6">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all hover:bg-secondary"
          aria-label="Back to setup"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Schedule
          </p>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            {rounds.length} Rounds
          </h1>
          {tournamentId && (
            <div className="mt-1.5">
              <TournamentIdBadge tournamentId={tournamentId} isAdmin={isAdmin} />
            </div>
          )}
        </div>
        {!isAdmin && onRefresh && (
          <button
            onClick={onRefresh}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all hover:bg-secondary"
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </header>

      <main className="flex flex-1 flex-col gap-6 px-6 pb-10">
        {rounds.map((round) => (
          <section key={round.roundNumber}>
            {/* Round header */}
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {round.roundNumber}
              </span>
              <h2 className="text-sm font-semibold text-foreground">
                Round {round.roundNumber}
              </h2>
              {round.bye && (
                <span className="ml-auto flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                  <Coffee className="h-3 w-3" />
                  {round.bye} rests
                </span>
              )}
            </div>

            {/* Matches */}
            <div className="flex flex-col gap-2">
              {round.matches.map((match) => (
                <div
                  key={`${round.roundNumber}-${match.court}`}
                  className="flex items-center rounded-2xl bg-card border border-border px-5 py-4"
                >
                  {/* Court badge */}
                  <span className="mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-semibold text-muted-foreground">
                    C{match.court}
                  </span>

                  {/* Team 1 */}
                  <div className="flex-1 text-right">
                    <p className="text-sm font-medium text-foreground leading-snug">
                      {match.team1[0]}
                    </p>
                    <p className="text-sm text-muted-foreground leading-snug">
                      {match.team1[1]}
                    </p>
                  </div>

                  {/* VS divider */}
                  <span className="mx-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold uppercase text-muted-foreground">
                    vs
                  </span>

                  {/* Team 2 */}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground leading-snug">
                      {match.team2[0]}
                    </p>
                    <p className="text-sm text-muted-foreground leading-snug">
                      {match.team2[1]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Start Button -- Admin only */}
        {isAdmin && (
          <div className="mt-auto pt-4">
            <button
              onClick={onStart}
              className="w-full rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground transition-all hover:opacity-90"
            >
              Start Tournament
            </button>
          </div>
        )}

        {!isAdmin && (
          <div className="mt-auto pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Waiting for the tournament admin to start...
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
