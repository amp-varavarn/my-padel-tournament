"use client"

import { useState, useCallback } from "react"
import { Link2, Check } from "lucide-react"

interface TournamentIdBadgeProps {
  tournamentId: string
  isAdmin: boolean
}

export function TournamentIdBadge({
  tournamentId,
  isAdmin,
}: TournamentIdBadgeProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    const url = `${window.location.origin}/tournament/${tournamentId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [tournamentId])

  return (
    <div className="flex items-center gap-2">
      <span className="rounded-lg bg-secondary px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
        ID: {tournamentId}
      </span>
      {isAdmin && (
        <button
          onClick={handleCopy}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Copy view-only link"
          title="Copy view-only link"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Link2 className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  )
}
