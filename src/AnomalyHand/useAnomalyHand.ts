import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BASE_CARDS, createRivalEncounterRoster, HEROES, REWARDS } from './data'
import { sound } from './audio'
import { t } from './i18n'
import type { ActionCard, CardKind, CombatFeedback, Enemy, Hero, HeroId, Intent, Phase, Rating, RewardId, Upgrades } from './types'
import type { MutationEffect } from './usePlayerArchiveCard'

const MAX_HP = 30
const CHAPTER_DURATION = {
  intro: 1650,
  turn: 1250,
  hostile: 1350,
  archive: 1650,
  result: 1850,
} as const
const CHAPTER_EXIT_MS = 260
const COMBAT_FEEDBACK_EFFECT_HOLD = 680
const COMBAT_FEEDBACK_DURATION = 2020
const ENEMY_CHAPTER_DELAY = 2420
const PLAYER_RESULT_HOLD = 2120
const ENCOUNTER_HEAL = 4
const CYCLE_SEAL_DURATION = 2400
const ENCOUNTER_ENTRY = {
  enemyDeploy: CHAPTER_DURATION.intro + 80,
  heroDeploy: CHAPTER_DURATION.intro + 900,
  controlBrief: CHAPTER_DURATION.intro + 1800,
  unlock: CHAPTER_DURATION.intro + 1800 + CHAPTER_DURATION.turn,
} as const
const DEFAULT_UPGRADES: Upgrades = {
  breach: 0,
  guard: 0,
  startSequence: 0,
  extraHeal: 0,
  exposeBonus: 4,
}

function sample<T>(items: T[], count: number) {
  return [...items].sort(() => Math.random() - 0.5).slice(0, count)
}

function makeSignature(heroId: HeroId): ActionCard {
  const hero = HEROES.find(item => item.id === heroId)!
  return {
    id: `signature-${heroId}`,
    kind: 'signature',
    nameKey: hero.signatureNameKey,
    descriptionKey: hero.signatureDescriptionKey,
  }
}

function makeHand(sequence: number, heroId: HeroId) {
  const cards = sample(BASE_CARDS, 3)
  if (sequence >= 3) cards[2] = makeSignature(heroId)
  return cards
}

type AnomalyHandOptions = {
  mutationEffects?: MutationEffect[]
  onRunStart?: () => void
  onEnemyDefeated?: (rivalId: string) => void
}

export function useAnomalyHand({ mutationEffects = [], onRunStart, onEnemyDefeated }: AnomalyHandOptions = {}) {
  const [phase, setPhase] = useState<Phase>('select')
  const [draftHeroes, setDraftHeroes] = useState<Hero[]>(() => sample(HEROES, HEROES.length))
  const [heroId, setHeroId] = useState<HeroId>(() => draftHeroes[0].id)
  const [encounters, setEncounters] = useState<Enemy[]>(() => createRivalEncounterRoster('las'))
  const [encounterIndex, setEncounterIndex] = useState(0)
  const [round, setRound] = useState(1)
  const [totalEncounters, setTotalEncounters] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [runId, setRunId] = useState(0)
  const [playerHp, setPlayerHp] = useState(MAX_HP)
  const [playerBlock, setPlayerBlock] = useState(0)
  const [enemyHp, setEnemyHp] = useState(() => encounters[0].maxHp)
  const [enemyBlock, setEnemyBlock] = useState(0)
  const [intentStep, setIntentStep] = useState(0)
  const [charged, setCharged] = useState(false)
  const [exposed, setExposed] = useState(0)
  const [calibrated, setCalibrated] = useState(false)
  const [sequence, setSequence] = useState(0)
  const [lastKind, setLastKind] = useState<CardKind | null>(null)
  const [firstTechUsed, setFirstTechUsed] = useState(false)
  const [smithFury, setSmithFury] = useState(false)
  const [isabelRecoveryUsed, setIsabelRecoveryUsed] = useState(false)
  const [getuMomentum, setGetuMomentum] = useState(false)
  const [mutationTechUsed, setMutationTechUsed] = useState(false)
  const [mutationRecoveryUsed, setMutationRecoveryUsed] = useState(false)
  const [activeMutationEffects, setActiveMutationEffects] = useState<MutationEffect[]>([])
  const [hand, setHand] = useState<ActionCard[]>(makeHand(0, 'las'))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(t('message.select'))
  const [impact, setImpact] = useState<'enemy' | 'player' | 'signature' | null>(null)
  const [playerState, setPlayerState] = useState<'ready' | 'hurt'>('ready')
  const [playedCardId, setPlayedCardId] = useState<string | null>(null)
  const [turnMotion, setTurnMotion] = useState<'idle' | 'commit' | 'impact' | 'discard'>('idle')
  const [turnOwner, setTurnOwner] = useState<'player' | 'enemy' | 'handoff'>('player')
  const [battleEntry, setBattleEntry] = useState<'briefing' | 'enemy' | 'hero' | 'ready'>('briefing')
  const [enemyActing, setEnemyActing] = useState(false)
  const [handDealId, setHandDealId] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [feedback, setFeedback] = useState<CombatFeedback | null>(null)
  const [chapter, setChapter] = useState<{ id: number; kicker: string; title: string; detail: string; tone: 'cyan' | 'red' | 'brass'; closing: boolean } | null>(null)
  const [upgrades, setUpgrades] = useState<Upgrades>(DEFAULT_UPGRADES)
  const [rewardOptions, setRewardOptions] = useState(() => sample(REWARDS, 3))
  const [selectedRewardId, setSelectedRewardId] = useState<RewardId | null>(null)
  const [totalTurns, setTotalTurns] = useState(0)
  const [signatureUses, setSignatureUses] = useState(0)
  const timers = useRef<number[]>([])
  const feedbackId = useRef(0)
  const chapterId = useRef(0)

  const hero = useMemo(() => HEROES.find(item => item.id === heroId)!, [heroId])
  const enemy = encounters[encounterIndex] ?? encounters[0]
  const intent = useMemo<Intent>(() => {
    const kind = enemy.pattern[intentStep % enemy.pattern.length]
    return {
      kind,
      value: kind === 'attack' ? enemy.attack + (charged ? 5 : 0) : kind === 'guard' ? enemy.attack - 1 : 5,
    }
  }, [charged, enemy, intentStep])

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms)
    timers.current.push(id)
  }, [])

  const showFeedback = useCallback((next: Omit<CombatFeedback, 'id' | 'stage'>, duration = COMBAT_FEEDBACK_DURATION) => {
    const id = feedbackId.current + 1
    feedbackId.current = id
    setFeedback({ ...next, id, stage: 'effect' })
    later(() => setFeedback(current => current?.id === id ? { ...current, stage: 'value' } : current), Math.min(COMBAT_FEEDBACK_EFFECT_HOLD, duration - 180))
    later(() => setFeedback(current => current?.id === id ? null : current), duration)
  }, [later])

  const showChapter = useCallback((next: Omit<NonNullable<typeof chapter>, 'id' | 'closing'>, duration: number = CHAPTER_DURATION.turn) => {
    const id = chapterId.current + 1
    chapterId.current = id
    setChapter({ ...next, id, closing: false })
    later(() => setChapter(current => current?.id === id ? { ...current, closing: true } : current), Math.max(0, duration - CHAPTER_EXIT_MS))
    later(() => setChapter(current => current?.id === id ? null : current), duration)
  }, [later])

  const dealHand = useCallback((nextSequence: number, id: HeroId) => {
    setHand(makeHand(nextSequence, id))
    setHandDealId(value => value + 1)
    sound.deal()
  }, [])

  const beginEncounter = useCallback((nextEnemy: Enemy, encounterNumber: number) => {
    setBattleEntry('briefing')
    setBusy(true)
    setTurnOwner('handoff')
    setEnemyActing(false)
    setFeedback(null)
    setImpact(null)
    setTurnMotion('idle')
    setPlayedCardId(null)
    setMessage(t('message.enemyIdentified', { name: t(nextEnemy.nameKey) }))
    showChapter({
      kicker: t('game.encounter', { n: encounterNumber }),
      title: t('chapter.hostileIdentified'),
      detail: t('chapter.hostileIdentifiedDetail', { name: t(nextEnemy.nameKey), subtitle: t(nextEnemy.subtitleKey) }),
      tone: 'red',
    }, CHAPTER_DURATION.intro)
    later(() => {
      setBattleEntry('enemy')
      sound.deal()
    }, ENCOUNTER_ENTRY.enemyDeploy)
    later(() => {
      setBattleEntry('hero')
      setMessage(t('message.operativeDeployed', { name: hero.name }))
      sound.deal()
    }, ENCOUNTER_ENTRY.heroDeploy)
    later(() => {
      setBattleEntry('ready')
      setHandDealId(value => value + 1)
      setMessage(t('message.readIntent'))
      showChapter({
        kicker: t('game.encounter', { n: encounterNumber }),
        title: t('chapter.yourTurn'),
        detail: t('chapter.yourTurnDetail'),
        tone: 'cyan',
      }, CHAPTER_DURATION.turn)
    }, ENCOUNTER_ENTRY.controlBrief)
    later(() => {
      setTurnOwner('player')
      setBusy(false)
    }, ENCOUNTER_ENTRY.unlock)
  }, [hero.name, later, showChapter])

  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  const selectHero = useCallback((id: HeroId) => {
    setHeroId(id)
    sound.select()
  }, [])

  const startRun = useCallback(() => {
    const startSequence = 0
    const nextEncounters = createRivalEncounterRoster(heroId, 1)
    const firstEnemy = nextEncounters[0]
    setPhase('evolution')
    setEncounters(nextEncounters)
    setEncounterIndex(0)
    setRound(1)
    setTotalEncounters(0)
    setMaxStreak(0)
    setRunId(value => value + 1)
    setPlayerHp(MAX_HP)
    setPlayerBlock(0)
    setEnemyHp(firstEnemy.maxHp)
    setEnemyBlock(0)
    setIntentStep(0)
    setCharged(false)
    setExposed(0)
    setCalibrated(false)
    setSequence(startSequence)
    setLastKind(null)
    setFirstTechUsed(false)
    setSmithFury(false)
    setIsabelRecoveryUsed(false)
    setGetuMomentum(false)
    setMutationTechUsed(false)
    setMutationRecoveryUsed(false)
    setActiveMutationEffects(mutationEffects)
    dealHand(startSequence, heroId)
    setUpgrades(DEFAULT_UPGRADES)
    setTotalTurns(0)
    setSignatureUses(0)
    setScore(0)
    setStreak(0)
    setPlayerState('ready')
    setPlayedCardId(null)
    setTurnMotion('idle')
    setSelectedRewardId(null)
    sound.select()
    onRunStart?.()
  }, [dealHand, heroId, mutationEffects, onRunStart])

  const continueRun = useCallback(() => {
    const firstEnemy = encounters[0]
    if (!firstEnemy || phase !== 'evolution') return
    setPhase('battle')
    beginEncounter(firstEnemy, 1)
  }, [beginEncounter, encounters, phase])

  const prepareEncounter = useCallback((nextIndex: number, startSequence: number) => {
    const nextEnemy = encounters[nextIndex]
    if (!nextEnemy) return
    setEncounterIndex(nextIndex)
    setEnemyHp(nextEnemy.maxHp)
    setEnemyBlock(0)
    setPlayerBlock(0)
    setIntentStep(0)
    setCharged(false)
    setExposed(0)
    setCalibrated(false)
    setSequence(startSequence)
    setLastKind(null)
    setFirstTechUsed(false)
    setSmithFury(false)
    setIsabelRecoveryUsed(false)
    setGetuMomentum(false)
    setMutationTechUsed(false)
    setMutationRecoveryUsed(false)
    dealHand(startSequence, heroId)
    setPhase('battle')
    beginEncounter(nextEnemy, nextIndex + 1)
  }, [beginEncounter, dealHand, encounters, heroId])

  const resolveEnemy = useCallback((
    nextPlayerBlock: number,
    nextEnemyHp: number,
    nextSequence: number,
    currentPlayerHp: number,
  ) => {
    if (nextEnemyHp <= 0) return

    later(() => {
      setBusy(true)
      setTurnMotion('discard')
      setTurnOwner('enemy')
      showChapter({
        kicker: t('chapter.hostileTurn'),
        title: `${t(`intent.${intent.kind}`)} ${intent.value}`,
        detail: t('chapter.hostileDetail', { name: t(enemy.nameKey), intent: t(`intent.${intent.kind}`), n: intent.value }),
        tone: 'red',
      }, CHAPTER_DURATION.hostile)
      sound.select()
    }, ENEMY_CHAPTER_DELAY)

    later(() => {
      setEnemyActing(true)
    }, ENEMY_CHAPTER_DELAY + CHAPTER_DURATION.hostile + 60)

    later(() => {
      let resultingHp = currentPlayerHp
      if (intent.kind === 'attack') {
        const damage = Math.max(0, intent.value - nextPlayerBlock)
        resultingHp = Math.max(0, currentPlayerHp - damage)
        if (damage > 0 && activeMutationEffects.includes('recoveryProtocol') && !mutationRecoveryUsed) {
          resultingHp = Math.min(MAX_HP, resultingHp + 3)
          setMutationRecoveryUsed(true)
        }
        setPlayerHp(resultingHp)
        setPlayerBlock(0)
        setCharged(false)
        if (damage > 0) {
          setImpact('player')
          setPlayerState('hurt')
          setMessage(t('message.hurt', { n: damage }))
          sound.hurt()
          showFeedback({ target: 'hero', kind: 'hurt', value: damage, amountKey: 'feedback.playerHealth', amountPolarity: 'loss', effectKey: 'feedback.effect.hurt', labelKey: 'rating.breached' })
          if (heroId === 'smith') setSmithFury(true)
        } else {
          setMessage(t('message.blocked'))
          sound.guard(true)
          setStreak(value => {
            const next = value + 1
            setMaxStreak(current => Math.max(current, next))
            return next
          })
          setScore(value => value + 90)
          showFeedback({ target: 'hero', kind: 'perfect', value: 0, rating: 'A', scoreDelta: 90, effectKey: 'feedback.effect.perfect', labelKey: 'rating.held' })
        }
      } else if (intent.kind === 'guard') {
        setEnemyBlock(value => value + intent.value)
        setPlayerBlock(0)
        setMessage(t('message.enemyGuard', { n: intent.value }))
        sound.guard()
        showFeedback({ target: 'enemy', kind: 'block', value: intent.value, amountKey: 'feedback.enemyBlock', amountPolarity: 'gain', effectKey: 'feedback.effect.enemyGuard', labelKey: 'rating.enemyGuard' })
      } else {
        setCharged(true)
        setPlayerBlock(Math.max(heroId === 'goat' ? 3 : 0, activeMutationEffects.includes('chargeShield') ? 4 : 0))
        if (heroId === 'kibo') {
          nextSequence = Math.min(3, nextSequence + 1)
          setSequence(nextSequence)
          if (nextSequence === 3) sound.ready()
        }
        setMessage(
          heroId === 'goat'
            ? t('message.goatCharge')
            : heroId === 'kibo'
              ? t('message.kiboCharge')
              : t('message.enemyCharge'),
        )
        sound.ready()
        showFeedback({ target: 'enemy', kind: 'signature', value: 5, amountKey: 'feedback.enemyCharge', amountPolarity: 'gain', effectKey: 'feedback.effect.enemyCharge', labelKey: 'rating.enemyCharge' })
      }

      if (resultingHp <= 0) {
        sound.lose()
        showChapter({
          kicker: t('game.caseStatus'),
          title: t('chapter.defeat'),
          detail: t('chapter.defeatDetail'),
          tone: 'red',
        }, CHAPTER_DURATION.result)
        later(() => {
          setPhase('defeat')
          setBusy(false)
        }, CHAPTER_DURATION.result)
        return
      }

      later(() => {
        setImpact(null)
        setEnemyActing(false)
        setIntentStep(value => value + 1)
        dealHand(nextSequence, heroId)
        setPlayedCardId(null)
        setTurnMotion('idle')
        setTurnOwner('handoff')
        setMessage(t('message.nextIntent'))
        showChapter({
          kicker: t('game.encounter', { n: encounterIndex + 1 }),
          title: t('chapter.yourTurn'),
          detail: t('chapter.yourTurnDetail'),
          tone: 'cyan',
        }, CHAPTER_DURATION.turn)
        later(() => {
          setTurnOwner('player')
          setBusy(false)
        }, CHAPTER_DURATION.turn)
      }, PLAYER_RESULT_HOLD)
    }, ENEMY_CHAPTER_DELAY + CHAPTER_DURATION.hostile + 220)
  }, [activeMutationEffects, dealHand, encounterIndex, enemy.nameKey, heroId, intent, later, mutationRecoveryUsed, showChapter, showFeedback])

  const finishEncounter = useCallback(() => {
    setImpact(null)
    setTurnMotion('discard')
    setTotalEncounters(value => value + 1)
    onEnemyDefeated?.(`${round}-${encounterIndex + 1}-${enemy.heroId}`)
    if (encounterIndex === encounters.length - 1) {
      const nextRound = round + 1
      const nextEncounters = createRivalEncounterRoster(heroId, nextRound)
      const nextEnemy = nextEncounters[0]
      sound.win()
      showChapter({
        kicker: t('game.round', { n: round }),
        title: t('chapter.cycleSealed'),
        detail: t('chapter.cycleSealedDetail', { n: nextRound }),
        tone: 'brass',
      }, CYCLE_SEAL_DURATION)
      later(() => {
        setRound(nextRound)
        setEncounters(nextEncounters)
        setEncounterIndex(0)
        setEnemyHp(nextEnemy.maxHp)
        setEnemyBlock(0)
        setPlayerBlock(0)
        setIntentStep(0)
        setCharged(false)
        setExposed(0)
        setCalibrated(false)
        setSequence(upgrades.startSequence)
        setLastKind(null)
        setFirstTechUsed(false)
        setSmithFury(false)
        setIsabelRecoveryUsed(false)
        setGetuMomentum(false)
        setMutationTechUsed(false)
        setMutationRecoveryUsed(false)
        dealHand(upgrades.startSequence, heroId)
        beginEncounter(nextEnemy, 1)
      }, CYCLE_SEAL_DURATION)
      return
    }
    setPlayerHp(value => Math.min(MAX_HP, value + ENCOUNTER_HEAL + upgrades.extraHeal))
    setPlayerState('ready')
    const shouldOfferReward = encounterIndex < encounters.length - 1 && encounterIndex % 2 === 0
    if (!shouldOfferReward) {
      showChapter({
        kicker: t('game.caseStatus'),
        title: t('chapter.fileSealed'),
        detail: t('chapter.fileSealedDetail'),
        tone: 'brass',
      }, CHAPTER_DURATION.archive)
      later(() => {
        prepareEncounter(encounterIndex + 1, upgrades.startSequence)
      }, CHAPTER_DURATION.archive)
      return
    }
    setRewardOptions(sample(REWARDS, 3))
    setSelectedRewardId(null)
    showChapter({
      kicker: t('game.rewardKicker'),
      title: t('chapter.fileSealed'),
      detail: t('chapter.fileSealedDetail'),
      tone: 'brass',
    }, CHAPTER_DURATION.archive)
    later(() => {
      setPhase('reward')
      setBusy(false)
    }, CHAPTER_DURATION.archive)
  }, [beginEncounter, dealHand, encounterIndex, encounters.length, enemy.heroId, heroId, later, onEnemyDefeated, prepareEncounter, round, showChapter, upgrades.extraHeal, upgrades.startSequence])

  const playCard = useCallback((cardId: string) => {
    if (busy || battleEntry !== 'ready' || phase !== 'battle') return
    const card = hand.find(item => item.id === cardId)
    if (!card) return

    setBusy(true)
    setTotalTurns(value => value + 1)
    setPlayedCardId(card.id)
    setTurnMotion('commit')
    sound.card(card.kind)

    let damage = 0
    let block = playerBlock
    let selfDamage = 0
    let nextExposed = exposed
    let nextCalibrated = calibrated
    let nextEnemyBlock = enemyBlock
    let nextPlayerHp = playerHp

    if (card.id === 'breach') damage = 6 + upgrades.breach
    if (card.id === 'brace') block += 6 + upgrades.guard
    if (card.id === 'probe') {
      damage = 3
      nextExposed += 1
    }
    if (card.id === 'overload') {
      damage = 10 + upgrades.breach
      selfDamage = 2
    }
    if (card.id === 'counter') {
      block += 3 + upgrades.guard
      if (intent.kind === 'attack') damage = 5
      if (heroId === 'john') {
        block += 2
        damage += 2
      }
    }
    if (card.id === 'calibrate') {
      nextPlayerHp = Math.min(MAX_HP, nextPlayerHp + 3)
      nextCalibrated = true
    }

    if (card.kind === 'signature') {
      setSignatureUses(value => value + 1)
      setImpact('signature')
      sound.signature()
      if (heroId === 'las') {
        damage = 8
        block += 6
      }
      if (heroId === 'isabel') {
        nextPlayerHp = Math.min(MAX_HP, nextPlayerHp + 6)
        block += 8
      }
      if (heroId === 'smith') damage = 14
      if (heroId === 'goat') {
        damage = 9
        nextExposed += 2
      }
      if (heroId === 'chill') {
        damage = 6
        block += 11
      }
      if (heroId === 'getu') {
        damage = 10 + (getuMomentum ? 6 : 0)
        setGetuMomentum(false)
      }
      if (heroId === 'kibo') {
        damage = 7
        block += 7
      }
      if (heroId === 'john') {
        damage = 11 + (intent.kind === 'attack' ? 5 : 0)
      }
    }

    if (card.kind === 'guard' && heroId === 'chill') {
      nextPlayerHp = Math.min(MAX_HP, nextPlayerHp + 1)
    }
    if (card.kind === 'guard' && heroId === 'getu') setGetuMomentum(true)
    if (card.kind === 'breach' && heroId === 'getu' && getuMomentum) {
      damage += 4
      setGetuMomentum(false)
    }
    if (card.kind === 'breach' && smithFury) {
      damage += 3
      setSmithFury(false)
    }
    if (nextCalibrated && card.id !== 'calibrate') {
      if (damage > 0) damage += 2
      else block += 2
      nextCalibrated = false
    }
    if (damage > 0 && exposed > 0) {
      damage += upgrades.exposeBonus
      nextExposed = Math.max(0, nextExposed - 1)
    }
    if (heroId === 'isabel' && !isabelRecoveryUsed && nextPlayerHp > playerHp) {
      block += 4
      setIsabelRecoveryUsed(true)
    }
    if (card.kind === 'breach' && activeMutationEffects.includes('breachBoost')) damage += 2
    if (card.kind === 'guard' && activeMutationEffects.includes('guardBoost')) block += 2

    const absorbed = Math.min(nextEnemyBlock, damage)
    const dealt = Math.max(0, damage - absorbed)
    nextEnemyBlock -= absorbed
    const nextEnemyHp = Math.max(0, enemyHp - dealt)
    nextPlayerHp = Math.max(0, nextPlayerHp - selfDamage)

    setEnemyBlock(nextEnemyBlock)
    setEnemyHp(nextEnemyHp)
    setPlayerHp(nextPlayerHp)
    if (nextPlayerHp > playerHp) setPlayerState('ready')
    setPlayerBlock(block)
    setExposed(nextExposed)
    setCalibrated(nextCalibrated)

    let nextSequence = sequence
    if (card.kind === 'signature') {
      nextSequence = heroId === 'kibo' ? 1 : 0
      setLastKind(null)
    } else {
      if (lastKind && lastKind !== card.kind) nextSequence = Math.min(3, nextSequence + 1)
      if (heroId === 'las' && card.kind === 'tech' && !firstTechUsed) {
        nextSequence = Math.min(3, nextSequence + 1)
        setFirstTechUsed(true)
      }
      if (card.kind === 'tech' && activeMutationEffects.includes('techSequence') && !mutationTechUsed) {
        nextSequence = Math.min(3, nextSequence + 1)
        setMutationTechUsed(true)
      }
      setLastKind(card.kind)
    }
    if (nextSequence === 3 && sequence < 3) sound.ready()
    setSequence(nextSequence)

    const usedExposure = damage > 0 && exposed > 0
    let rating: Rating = 'B'
    let labelKey = 'rating.clean'
    let baseScore = 100
    if (card.kind === 'signature') {
      rating = 'S'
      labelKey = 'rating.signature'
      baseScore = 360
    } else if (nextEnemyHp <= 0) {
      rating = 'S'
      labelKey = 'rating.finished'
      baseScore = 320
    } else if (card.id === 'counter' && intent.kind === 'attack') {
      rating = 'A'
      labelKey = 'rating.read'
      baseScore = 220
    } else if (usedExposure) {
      rating = 'A'
      labelKey = 'rating.exploit'
      baseScore = 200
    } else if (damage >= 10) {
      rating = 'A'
      labelKey = 'rating.heavy'
      baseScore = 170
    } else if (nextSequence > sequence) {
      rating = 'A'
      labelKey = 'rating.flow'
      baseScore = 150
    } else if (nextPlayerHp > playerHp) {
      rating = 'B'
      labelKey = 'rating.recovery'
      baseScore = 110
    } else if (damage === 0 && block === playerBlock) {
      rating = 'C'
      baseScore = 60
    }
    const nextStreak = rating === 'A' || rating === 'S' ? streak + 1 : rating === 'C' ? 0 : streak
    const scoreDelta = Math.round(baseScore * (1 + Math.min(streak, 4) * 0.15))
    setStreak(nextStreak)
    setMaxStreak(current => Math.max(current, nextStreak))
    setScore(value => value + scoreDelta)

    later(() => {
      setTurnMotion('impact')
      if (damage > 0) setImpact(card.kind === 'signature' ? 'signature' : 'enemy')
      const feedbackKind = card.kind === 'signature' ? 'signature' : damage > 0 ? 'damage' : nextPlayerHp > playerHp ? 'heal' : 'block'
      const amountKey = damage > 0
        ? 'feedback.enemyHealth'
        : nextPlayerHp > playerHp
          ? 'feedback.playerHealth'
          : 'feedback.playerBlock'
      showFeedback({
        target: damage > 0 ? 'enemy' : 'hero',
        kind: feedbackKind,
        value: damage > 0 ? dealt : Math.max(0, block - playerBlock),
        amountKey,
        amountPolarity: damage > 0 ? 'loss' : 'gain',
        rating,
        scoreDelta,
        effectKey: card.kind === 'signature'
          ? 'feedback.effect.signature'
          : damage > 0
            ? 'feedback.effect.damage'
            : nextPlayerHp > playerHp
              ? 'feedback.effect.heal'
              : 'feedback.effect.block',
        labelKey,
      })
      if (damage > 0 && card.kind !== 'signature') sound.hit(rating)
      if (damage === 0 && block > playerBlock) sound.guard(rating === 'A')
      sound.score(rating)
    }, 210)

    if (damage > 0) {
      setMessage(t('message.damage', { card: t(card.nameKey), n: dealt }))
    } else if (block > playerBlock) {
      setMessage(t('message.block', { card: t(card.nameKey), n: block - playerBlock }))
    } else {
      setMessage(t('message.executed', { card: t(card.nameKey) }))
    }

    if (nextPlayerHp <= 0) {
      later(() => {
        sound.lose()
        showChapter({
          kicker: t('game.caseStatus'),
          title: t('chapter.defeat'),
          detail: t('chapter.defeatDetail'),
          tone: 'red',
        }, CHAPTER_DURATION.result)
        later(() => {
          setPhase('defeat')
          setBusy(false)
        }, CHAPTER_DURATION.result)
      }, PLAYER_RESULT_HOLD)
      return
    }

    if (nextEnemyHp <= 0) {
      later(finishEncounter, Math.max(PLAYER_RESULT_HOLD, card.kind === 'signature' ? 1180 : 0))
      return
    }

    later(() => {
      setImpact(null)
      setTurnMotion('discard')
    }, card.kind === 'signature' ? 1650 : 1450)
    resolveEnemy(block, nextEnemyHp, nextSequence, nextPlayerHp)
  }, [
    activeMutationEffects,
    battleEntry,
    busy,
    calibrated,
    enemyBlock,
    enemyHp,
    exposed,
    finishEncounter,
    firstTechUsed,
    getuMomentum,
    hand,
    heroId,
    intent.kind,
    isabelRecoveryUsed,
    lastKind,
    later,
    mutationTechUsed,
    phase,
    playerBlock,
    playerHp,
    resolveEnemy,
    sequence,
    showFeedback,
    showChapter,
    smithFury,
    streak,
    upgrades,
  ])

  const chooseReward = useCallback((id: RewardId) => {
    if (busy) return
    setBusy(true)
    setSelectedRewardId(id)
    sound.select()
    setUpgrades(current => ({
      ...current,
      [id]: id === 'exposeBonus'
        ? 6
        : current[id] + (id === 'breach' || id === 'guard' ? 2 : id === 'extraHeal' ? 2 : 1),
    }))
    later(() => {
      const nextIndex = encounterIndex + 1
      const startSequence = id === 'startSequence'
        ? Math.min(3, upgrades.startSequence + 1)
        : upgrades.startSequence
      prepareEncounter(nextIndex, startSequence)
      later(() => {
        setSelectedRewardId(null)
      }, ENCOUNTER_ENTRY.unlock)
    }, 620)
  }, [busy, encounterIndex, later, prepareEncounter, upgrades.startSequence])

  const changeHero = useCallback(() => {
    timers.current.forEach(window.clearTimeout)
    timers.current = []
    setPhase('select')
    setBusy(false)
    setImpact(null)
    setPlayerState('ready')
    setPlayedCardId(null)
    setTurnMotion('idle')
    setTurnOwner('player')
    setBattleEntry('briefing')
    setEnemyActing(false)
    setFeedback(null)
    setChapter(null)
    setMessage(t('message.select'))
    const nextDraft = sample(HEROES, HEROES.length)
    setDraftHeroes(nextDraft)
    setHeroId(nextDraft[0].id)
  }, [])

  const restart = useCallback(() => {
    setUpgrades(DEFAULT_UPGRADES)
    startRun()
  }, [startRun])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (phase !== 'battle' || busy || battleEntry !== 'ready') return
      const index = Number(event.key) - 1
      if (index >= 0 && index < hand.length) playCard(hand[index].id)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [battleEntry, busy, hand, phase, playCard])

  return {
    phase,
    hero,
    heroId,
    heroes: HEROES,
    draftHeroes,
    enemy,
    encounterIndex,
    encounterCount: encounters.length,
    round,
    totalEncounters,
    maxStreak,
    runId,
    playerHp,
    playerBlock,
    enemyHp,
    enemyBlock,
    intent,
    charged,
    exposed,
    sequence,
    hand,
    busy,
    message,
    impact,
    playerState,
    playedCardId,
    turnMotion,
    turnOwner,
    battleEntry,
    enemyActing,
    handDealId,
    score,
    streak,
    feedback,
    chapter,
    rewardOptions,
    selectedRewardId,
    totalTurns,
    signatureUses,
    upgrades,
    selectHero,
    startRun,
    continueRun,
    playCard,
    chooseReward,
    restart,
    changeHero,
  }
}
