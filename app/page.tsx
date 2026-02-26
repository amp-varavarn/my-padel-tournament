"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const [joinId, setJoinId] = useState("")
  const [error, setError] = useState("")

  const handleJoin = () => {
    const trimmed = joinId.trim()
    if (!trimmed) {
      setError("Please enter a tournament ID")
      return
    }
    setError("")
    router.push(`/tournament/${trimmed}`)
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-10">
        {/* Brand */}
        <header className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Padel Tournament Manager
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-foreground text-balance">
            Espresso Padel
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
            Individual Americano format. Rotating partners, live scoring, and
            shared leaderboards.
          </p>
        </header>

        {/* Create */}
        <button
          onClick={() => router.push("/tournament/new")}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground transition-all hover:opacity-90"
        >
          Create Tournament
          <ArrowRight className="h-4 w-4" />
        </button>

        {/* Divider */}
        <div className="flex w-full items-center gap-4">
          <div className="flex-1 border-t border-border" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            or join
          </span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* Join */}
        <div className="w-full flex flex-col gap-3">
          <input
            type="text"
            value={joinId}
            onChange={(e) => {
              setJoinId(e.target.value)
              setError("")
            }}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="Enter tournament ID"
            className="w-full rounded-2xl border border-border bg-card px-5 py-4 text-sm text-card-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all text-center"
          />
          {error && (
            <p className="text-center text-xs text-destructive">{error}</p>
          )}
          <button
            onClick={handleJoin}
            className="w-full rounded-2xl border border-border bg-card py-4 text-sm font-medium text-foreground transition-all hover:bg-secondary"
          >
            Join as Viewer
          </button>
        </div>
      </div>
    </div>
  )
}
