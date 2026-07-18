import { useCallback, useEffect, useRef, useState } from 'react'
import { callAigramAPI, isInAigram, telegramId, type AigramResponse } from '@shared/runtime'
import { getGameUuid } from '@shared/runtime'

export type ArchiveLeaderboardEntry = {
  userId: string
  name: string
  avatarUrl: string
  score: number
  rank: number
  isMe: boolean
}

type RankRow = {
  user_id: string | number
  user_name?: string
  head_url?: string
  score: string | number
  rank: number
}

export function useArchiveLeaderboard() {
  const sessionId = getGameUuid()
  const canRank = isInAigram && Boolean(sessionId)
  const submittedRunRef = useRef<string | null>(null)
  const [entries, setEntries] = useState<ArchiveLeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!canRank || !sessionId) {
      setEntries([])
      return []
    }
    setLoading(true)
    try {
      const response = await callAigramAPI<AigramResponse<RankRow[]>>(
        `/note/aigram/ai/game/rank/score/list/by/session_id?session_id=${encodeURIComponent(sessionId)}`,
        'GET',
      )
      const next = (Array.isArray(response?.data) ? response.data : []).map(row => ({
        userId: String(row.user_id),
        name: row.user_name || 'UNKNOWN OPERATIVE',
        avatarUrl: row.head_url || '',
        score: Number(row.score) || 0,
        rank: row.rank,
        isMe: telegramId != null && String(row.user_id) === telegramId,
      }))
      setEntries(next)
      return next
    } catch {
      setEntries([])
      return []
    } finally {
      setLoading(false)
    }
  }, [canRank, sessionId])

  const submitRun = useCallback(async (runId: string, score: number) => {
    if (!canRank || !sessionId || score <= 0 || submittedRunRef.current === runId) return
    submittedRunRef.current = runId
    try {
      await callAigramAPI<AigramResponse<null>>('/note/aigram/ai/game/rank/score/save', 'POST', { session_id: sessionId, score })
    } catch {
      submittedRunRef.current = null
      return
    }
    void refresh()
  }, [canRank, refresh, sessionId])

  useEffect(() => {
    if (canRank) void refresh()
  }, [canRank, refresh])

  return { canRank, entries, loading, refresh, submitRun }
}
