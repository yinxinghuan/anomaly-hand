import { useCallback, useEffect, useRef, useState } from 'react'
import { callAigramAPI, isInAigram, telegramId, type AigramResponse, useChat, useGenImage } from '@shared/runtime'
import { useGameSave } from '@shared/save'

const IN_FLIGHT_WINDOW_MS = 4 * 60 * 1000
const FAILURE_COOLDOWN_MS = 3 * 60 * 1000
const GENERATION_TIMEOUT_MS = 210 * 1000
const SERIAL_GAP_MS = 3 * 1000

type PlatformProfile = {
  name?: string
  user_name?: string
  head_url?: string
}

export type PlayerArchiveCard = {
  id: string
  portraitUrl: string
  source: 'avatar' | 'anonymous'
  displayName: string
  createdAt: number
}

export type MutationEffect = 'breachBoost' | 'guardBoost' | 'techSequence' | 'recoveryProtocol' | 'chargeShield'

export type ArchiveMutation = {
  id: string
  title: string
  flavor: string
  effect: MutationEffect
  triggerAt: number
  createdAt: number
}

type PlayerArchiveSave = {
  version: 1
  card?: PlayerArchiveCard
  generation: 'idle' | 'generating' | 'failed' | 'complete'
  requestedAt?: number
  retryAfter?: number
  rivalIds: string[]
  mutations: ArchiveMutation[]
  pendingMutationAt?: number
}

const EMPTY_SAVE: PlayerArchiveSave = { version: 1, generation: 'idle', rivalIds: [], mutations: [] }
const MAX_MUTATIONS = 3
const MUTATION_EFFECTS: MutationEffect[] = ['breachBoost', 'guardBoost', 'techSequence', 'recoveryProtocol', 'chargeShield']
const FALLBACK_MUTATION: Omit<ArchiveMutation, 'id' | 'triggerAt' | 'createdAt'> = {
  title: '档案余辉',
  flavor: '首张技术牌额外校准一格序列。',
  effect: 'techSequence',
}

function isPublicHttps(value: unknown): value is string {
  return typeof value === 'string' && /^https:\/\//i.test(value)
}

function parseMutation(raw: string): Omit<ArchiveMutation, 'id' | 'triggerAt' | 'createdAt'> {
  try {
    const cleaned = raw.replace(/```json|```/gi, '').trim()
    const parsed = JSON.parse(cleaned) as { title?: unknown; flavor?: unknown; effect?: unknown }
    if (typeof parsed.title !== 'string' || typeof parsed.flavor !== 'string' || !MUTATION_EFFECTS.includes(parsed.effect as MutationEffect)) {
      return FALLBACK_MUTATION
    }
    return {
      title: parsed.title.slice(0, 28),
      flavor: parsed.flavor.slice(0, 72),
      effect: parsed.effect as MutationEffect,
    }
  } catch {
    return FALLBACK_MUTATION
  }
}

export function usePlayerArchiveCard() {
  const { savedData, persist } = useGameSave<PlayerArchiveSave>('anomaly-hand-player-archive')
  const { generate } = useGenImage()
  const { send: generateMutation, sending: mutating } = useChat({
    system: 'You design balanced tactical mutations for a compact card battler. Return only one JSON object with title, flavor, effect. effect must be exactly one of: breachBoost, guardBoost, techSequence, recoveryProtocol, chargeShield. Do not invent numbers or extra fields.',
    maxHistory: 2,
  })
  const [mirror, setMirror] = useState<PlayerArchiveSave | undefined>(undefined)
  const [generating, setGenerating] = useState(false)
  const [armed, setArmed] = useState(false)
  const operationRef = useRef<'portrait' | 'mutation' | null>(null)
  const lastOperationAtRef = useRef(0)
  const mountedRef = useRef(true)

  useEffect(() => () => {
    mountedRef.current = false
  }, [])

  useEffect(() => {
    if (mirror === undefined && savedData !== undefined) {
      setMirror({
        ...EMPTY_SAVE,
        ...(savedData ?? {}),
        rivalIds: savedData?.rivalIds ?? [],
        mutations: savedData?.mutations ?? [],
      })
    }
  }, [mirror, savedData])

  useEffect(() => {
    if (!armed || !mirror || mirror.card || operationRef.current) return
    const now = Date.now()
    if (mirror.generation === 'generating' && now - (mirror.requestedAt ?? 0) < IN_FLIGHT_WINDOW_MS) return
    if (mirror.generation === 'failed' && now < (mirror.retryAfter ?? 0)) return

    let cancelled = false
    operationRef.current = 'portrait'
    lastOperationAtRef.current = now
    setGenerating(true)
    const queued: PlayerArchiveSave = {
      ...mirror,
      generation: 'generating',
      requestedAt: now,
      retryAfter: undefined,
    }
    setMirror(queued)
    persist(queued)

    void (async () => {
      let profile: PlatformProfile | null = null
      if (isInAigram && telegramId) {
        try {
          const response = await callAigramAPI<AigramResponse<PlatformProfile>>(
            `/note/telegram/user/get/info/by/telegram_id?telegram_id=${encodeURIComponent(telegramId)}`,
            'GET',
          )
          profile = response?.data ?? null
        } catch {
          profile = null
        }
      }

      const refUrl = isPublicHttps(profile?.head_url) ? profile.head_url : undefined
      const displayName = profile?.name || profile?.user_name || (isInAigram ? 'AIGRAM OPERATIVE' : 'UNKNOWN OPERATIVE')
      const prompt = refUrl
        ? 'Transform the supplied public profile portrait into one original collectible anomaly-operative character card portrait: chest-up three-quarter view, alert visible eyes, charcoal archival paper, crimson and cyan screen-print inks, cinematic rim light, no text, no logo, no UI, no watermark.'
        : 'Create one original anonymous anomaly-operative character card portrait: chest-up three-quarter view, alert visible eyes, distinctive but non-celebrity face, charcoal archival paper, crimson and cyan screen-print inks, cinematic rim light, no text, no logo, no UI, no watermark.'

      try {
        const portraitUrl = await Promise.race([
          generate(refUrl ? { prompt, ref_url: refUrl } : { prompt }),
          new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('generation timeout')), GENERATION_TIMEOUT_MS)),
        ])
        if (cancelled || !mountedRef.current) return
        const completed: PlayerArchiveSave = {
          ...queued,
          generation: 'complete',
          pendingMutationAt: (() => {
            const threshold = Math.min(MAX_MUTATIONS * 4, Math.floor((queued.rivalIds.length + 1) / 4) * 4)
            return threshold > 0 && !queued.mutations.some(mutation => mutation.triggerAt === threshold)
              ? threshold
              : queued.pendingMutationAt
          })(),
          card: {
            id: `player-archive-${telegramId ?? 'browser'}-${now}`,
            portraitUrl,
            source: refUrl ? 'avatar' : 'anonymous',
            displayName,
            createdAt: Date.now(),
          },
        }
        setMirror(completed)
        persist(completed)
      } catch {
        if (cancelled || !mountedRef.current) return
        const failed: PlayerArchiveSave = {
          ...queued,
          generation: 'failed',
          retryAfter: Date.now() + FAILURE_COOLDOWN_MS,
        }
        setMirror(failed)
        persist(failed)
      } finally {
        operationRef.current = null
        if (!cancelled && mountedRef.current) setGenerating(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [armed, generate, mirror, persist])

  useEffect(() => {
    if (!armed || !mirror?.pendingMutationAt || operationRef.current || mirror.mutations.length >= MAX_MUTATIONS) return
    if (mirror.mutations.some(mutation => mutation.triggerAt === mirror.pendingMutationAt)) return
    const gap = Math.max(0, SERIAL_GAP_MS - (Date.now() - lastOperationAtRef.current))
    let cancelled = false
    operationRef.current = 'mutation'
    const triggerAt = mirror.pendingMutationAt
    const rosterDigest = mirror.rivalIds.join(', ') || 'no rival files yet'
    const wait = gap > 0 ? new Promise<void>(resolve => window.setTimeout(resolve, gap)) : Promise.resolve()
    void wait.then(() => generateMutation(`Archive threshold ${triggerAt} reached. Collected rival files: ${rosterDigest}. Create one evocative but mechanically bounded anomaly directive.`))
      .then(raw => parseMutation(raw))
      .catch(() => FALLBACK_MUTATION)
      .then(mutation => {
        if (cancelled || !mountedRef.current) return
        const next: PlayerArchiveSave = {
          ...mirror,
          pendingMutationAt: undefined,
          mutations: [
            ...mirror.mutations,
            { ...mutation, id: `mutation-${triggerAt}-${Date.now()}`, triggerAt, createdAt: Date.now() },
          ],
        }
        setMirror(next)
        persist(next)
      })
      .finally(() => {
        operationRef.current = null
        lastOperationAtRef.current = Date.now()
      })
    return () => {
      cancelled = true
    }
  }, [armed, generateMutation, mirror, persist])

  const archiveRival = useCallback((rivalId: string) => {
    if (!mirror || mirror.rivalIds.includes(rivalId)) return
    const rivalIds = [...mirror.rivalIds, rivalId]
    const totalCards = rivalIds.length + (mirror.card ? 1 : 0)
    const threshold = Math.min(MAX_MUTATIONS * 4, Math.floor(totalCards / 4) * 4)
    const alreadyGenerated = mirror.mutations.some(mutation => mutation.triggerAt === threshold)
    const next: PlayerArchiveSave = {
      ...mirror,
      rivalIds,
      pendingMutationAt: threshold > 0 && !alreadyGenerated ? threshold : mirror.pendingMutationAt,
    }
    setMirror(next)
    persist(next)
  }, [mirror, persist])

  return {
    card: mirror?.card ?? null,
    generating,
    mutations: mirror?.mutations ?? [],
    mutationGenerating: mutating || operationRef.current === 'mutation',
    archiveRival,
    arm: useCallback(() => setArmed(true), []),
    loaded: mirror !== undefined,
  }
}
