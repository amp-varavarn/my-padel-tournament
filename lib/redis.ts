import { Redis } from "@upstash/redis"

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

const TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days

export function tournamentKey(id: string) {
  return `tournament:${id}`
}

export async function saveTournament(data: Record<string, unknown>) {
  await redis.set(tournamentKey(data.id as string), JSON.stringify(data), {
    ex: TTL_SECONDS,
  })
}

export async function loadTournament(id: string) {
  const raw = await redis.get<string>(tournamentKey(id))
  if (!raw) return null
  return typeof raw === "string" ? JSON.parse(raw) : raw
}
