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
  /** `portraitUrl` remains readable only for files saved before the full-card migration. */
  portraitUrl?: string
  artUrl?: string
  source: 'avatar' | 'anonymous'
  displayName: string
  style?: ArchiveCardStyleId
  createdAt: number
}

export type ArchiveCardStyleId =
  | 'lacquer-war-chronicle'
  | 'astral-reliquary'
  | 'anomaly-dossier'
  | 'midnight-operation'
  | 'mineral-mural'
  | 'signal-field-guide'

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
  version: 2
  card?: PlayerArchiveCard
  generation: 'idle' | 'generating' | 'failed' | 'complete'
  requestedAt?: number
  retryAfter?: number
  pendingStyle?: ArchiveCardStyleId
  rivalIds: string[]
  mutations: ArchiveMutation[]
  pendingMutationAt?: number
}

const EMPTY_SAVE: PlayerArchiveSave = { version: 2, generation: 'idle', rivalIds: [], mutations: [] }
const MAX_MUTATIONS = 3
const MUTATION_EFFECTS: MutationEffect[] = ['breachBoost', 'guardBoost', 'techSequence', 'recoveryProtocol', 'chargeShield']
const FALLBACK_MUTATION: Omit<ArchiveMutation, 'id' | 'triggerAt' | 'createdAt'> = {
  title: '档案余辉',
  flavor: '首张技术牌额外校准一格序列。',
  effect: 'techSequence',
}

type ArchiveCardStyle = {
  id: ArchiveCardStyleId
  prompt: string
}

const ARCHIVE_CARD_STYLES: ArchiveCardStyle[] = [
  {
    id: 'lacquer-war-chronicle',
    prompt: 'Style A, Lacquer War Chronicle: deep black lacquer, distressed gilt, oxblood and antique bronze. Place the operative in an epic active confrontation with a fractured weapon-like anomaly, smoke and torn gold-leaf atmosphere. Stately, tactile, dramatic, with no historical lettering and no ornamental card border.',
  },
  {
    id: 'astral-reliquary',
    prompt: 'Style B, Astral Reliquary: midnight indigo, bone white and old gold, with sparse orbital traces, relic fragments and an open ruin or void around the operative. Create a composed, mysterious narrative image with depth and silence. Do not use religious symbols, astrology labels, or a portrait-photo pose.',
  },
  {
    id: 'anomaly-dossier',
    prompt: 'Style C, Anomaly Dossier: charcoal black, signal vermilion and acid cyan screenprint, coarse halftone and purposeful registration shifts. Show an urgent anomalous field operation at the moment control fails, energetic diagonal composition, richly detailed. Do not draw a fixed dossier frame or UI onto the picture.',
  },
  {
    id: 'midnight-operation',
    prompt: 'Style D, Midnight Operation: a noir action-film scene with hard side light, wet pavement, corridor or laboratory depth, cold teal, sodium yellow and one dangerous vermilion accent. The operative is pursuing, forcing entry, resisting, or revealing an anomaly. Make the camera cinematic and spatial, not a posed portrait.',
  },
  {
    id: 'mineral-mural',
    prompt: 'Style E, Mineral Mural: mineral-pigment gouache, lithographic grain, geological strata, crystalline energy and large irregular color fields. Integrate the operative and the anomaly into one bold mural-like scene; retain a recognizable face, visible eyes and identity anchors, but allow the pose and environment to be expansive.',
  },
  {
    id: 'signal-field-guide',
    prompt: 'Style F, Signal Field Guide: an anomalous ecology expedition, weathered paper, dry-brush terrain, strange signal life and practical field instruments. Show the operative interacting with a living landscape or impossible creature in one exploratory scene. It must feel like visual storytelling, not a technical diagram, labelled specimen sheet, or card template.',
  },
]

function isPublicHttps(value: unknown): value is string {
  return typeof value === 'string' && /^https:\/\//i.test(value)
}

function chooseArchiveCardStyle(): ArchiveCardStyle {
  const index = typeof crypto !== 'undefined' && crypto.getRandomValues
    ? crypto.getRandomValues(new Uint32Array(1))[0] % ARCHIVE_CARD_STYLES.length
    : Math.floor(Math.random() * ARCHIVE_CARD_STYLES.length)
  return ARCHIVE_CARD_STYLES[index]
}

function getArchiveCardStyle(id: ArchiveCardStyleId): ArchiveCardStyle {
  return ARCHIVE_CARD_STYLES.find(style => style.id === id) ?? ARCHIVE_CARD_STYLES[0]
}

function createFullCardPrompt(style: ArchiveCardStyle, hasAvatarReference: boolean): string {
  const identity = hasAvatarReference
    ? 'Use the supplied public avatar only as identity reference. Preserve the person’s recognisable facial anchors, hair and overall presence, while redrawing them as an original fictional operative.'
    : 'Invent one distinctive, non-celebrity fictional operative with a recognisable face, visible eyes and a strong silhouette.'
  return `Create one original, collectible FULL-CARD ILLUSTRATION for a premium mobile anomaly battler. ${identity} The image itself must be one cohesive full-bleed story scene: character, action, environment, anomaly and symbolic objects belong together in the same composition. Compose broadly enough to survive a central tall-card crop, with the face and eyes clearly visible but not constrained to a chest-up or three-quarter portrait. ${style.prompt} Absolutely do not isolate the character on a transparent, white, plain or gradient background. Do not make a cutout, a passport photo, a generic profile portrait, a fixed card frame, a UI panel, a phone screen, readable text, logo or watermark. No collage of separately framed portrait and background; generate the whole scene as one illustration.`
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
    if (!armed || !mirror || mirror.card?.artUrl || operationRef.current) return
    const now = Date.now()
    if (mirror.generation === 'generating' && now - (mirror.requestedAt ?? 0) < IN_FLIGHT_WINDOW_MS) return
    if (mirror.generation === 'failed' && now < (mirror.retryAfter ?? 0)) return

    let cancelled = false
    operationRef.current = 'portrait'
    lastOperationAtRef.current = now
    setGenerating(true)
    const selectedStyle = mirror.pendingStyle ? getArchiveCardStyle(mirror.pendingStyle) : chooseArchiveCardStyle()
    const queued: PlayerArchiveSave = {
      ...mirror,
      version: 2,
      generation: 'generating',
      requestedAt: now,
      retryAfter: undefined,
      pendingStyle: selectedStyle.id,
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

      const legacyReference = isPublicHttps(mirror.card?.portraitUrl) ? mirror.card.portraitUrl : undefined
      const refUrl = legacyReference ?? (isPublicHttps(profile?.head_url) ? profile.head_url : undefined)
      const displayName = mirror.card?.displayName || profile?.name || profile?.user_name || (isInAigram ? 'AIGRAM OPERATIVE' : 'UNKNOWN OPERATIVE')
      const prompt = createFullCardPrompt(selectedStyle, Boolean(refUrl))

      try {
        const artUrl = await Promise.race([
          generate(refUrl ? { prompt, ref_url: refUrl } : { prompt }),
          new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('generation timeout')), GENERATION_TIMEOUT_MS)),
        ])
        if (cancelled || !mountedRef.current) return
        const completed: PlayerArchiveSave = {
          ...queued,
          version: 2,
          generation: 'complete',
          pendingStyle: undefined,
          pendingMutationAt: (() => {
            const threshold = Math.min(MAX_MUTATIONS * 4, Math.floor((queued.rivalIds.length + 1) / 4) * 4)
            return threshold > 0 && !queued.mutations.some(mutation => mutation.triggerAt === threshold)
              ? threshold
              : queued.pendingMutationAt
          })(),
          card: {
            id: mirror.card?.id ?? `player-archive-${telegramId ?? 'browser'}-${now}`,
            artUrl,
            source: mirror.card?.source ?? (refUrl ? 'avatar' : 'anonymous'),
            displayName,
            style: selectedStyle.id,
            createdAt: mirror.card?.createdAt ?? Date.now(),
          },
        }
        setMirror(completed)
        persist(completed)
      } catch {
        if (cancelled || !mountedRef.current) return
        const failed: PlayerArchiveSave = {
          ...queued,
          version: 2,
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
