import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BASE_CARDS, ENEMIES, HEROES, REWARDS } from './data'
import { sound } from './audio'
import { t } from './i18n'
import type { ActionCard, CardKind, HeroId, Intent, Phase, RewardId, Upgrades } from './types'

const MAX_HP = 30
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

export function useAnomalyHand() {
  const [phase, setPhase] = useState<Phase>('select')
  const [heroId, setHeroId] = useState<HeroId>('las')
  const [encounterIndex, setEncounterIndex] = useState(0)
  const [playerHp, setPlayerHp] = useState(MAX_HP)
  const [playerBlock, setPlayerBlock] = useState(0)
  const [enemyHp, setEnemyHp] = useState(ENEMIES[0].maxHp)
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
  const [hand, setHand] = useState<ActionCard[]>(makeHand(0, 'las'))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(t('message.select'))
  const [impact, setImpact] = useState<'enemy' | 'player' | 'signature' | null>(null)
  const [upgrades, setUpgrades] = useState<Upgrades>(DEFAULT_UPGRADES)
  const [rewardOptions, setRewardOptions] = useState(() => sample(REWARDS, 3))
  const [selectedRewardId, setSelectedRewardId] = useState<RewardId | null>(null)
  const [totalTurns, setTotalTurns] = useState(0)
  const [signatureUses, setSignatureUses] = useState(0)
  const timers = useRef<number[]>([])

  const hero = useMemo(() => HEROES.find(item => item.id === heroId)!, [heroId])
  const enemy = ENEMIES[encounterIndex]
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

  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  const selectHero = useCallback((id: HeroId) => {
    setHeroId(id)
    sound.select()
  }, [])

  const startRun = useCallback(() => {
    const startSequence = 0
    setPhase('battle')
    setEncounterIndex(0)
    setPlayerHp(MAX_HP)
    setPlayerBlock(0)
    setEnemyHp(ENEMIES[0].maxHp)
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
    setHand(makeHand(startSequence, heroId))
    setBusy(false)
    setUpgrades(DEFAULT_UPGRADES)
    setTotalTurns(0)
    setSignatureUses(0)
    setSelectedRewardId(null)
    setMessage(t('message.readIntent'))
    sound.select()
  }, [heroId])

  const resolveEnemy = useCallback((
    nextPlayerBlock: number,
    nextEnemyHp: number,
    nextSequence: number,
    currentPlayerHp: number,
  ) => {
    if (nextEnemyHp <= 0) return

    later(() => {
      let resultingHp = currentPlayerHp
      if (intent.kind === 'attack') {
        const damage = Math.max(0, intent.value - nextPlayerBlock)
        resultingHp = Math.max(0, currentPlayerHp - damage)
        setPlayerHp(resultingHp)
        setPlayerBlock(0)
        setCharged(false)
        if (damage > 0) {
          setImpact('player')
          setMessage(t('message.hurt', { n: damage }))
          sound.hurt()
          if (heroId === 'smith') setSmithFury(true)
        } else {
          setMessage(t('message.blocked'))
          sound.guard()
        }
      } else if (intent.kind === 'guard') {
        setEnemyBlock(value => value + intent.value)
        setPlayerBlock(0)
        setMessage(t('message.enemyGuard', { n: intent.value }))
        sound.guard()
      } else {
        setCharged(true)
        setPlayerBlock(heroId === 'goat' ? 3 : 0)
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
      }

      if (resultingHp <= 0) {
        setPhase('defeat')
        setBusy(false)
        sound.lose()
        return
      }

      later(() => {
        setImpact(null)
        setIntentStep(value => value + 1)
        setHand(makeHand(nextSequence, heroId))
        setBusy(false)
        setMessage(t('message.nextIntent'))
      }, 360)
    }, 430)
  }, [heroId, intent, later])

  const finishEncounter = useCallback(() => {
    setImpact(null)
    if (encounterIndex === ENEMIES.length - 1) {
      setPhase('victory')
      setBusy(false)
      sound.win()
      return
    }
    setPlayerHp(value => Math.min(MAX_HP, value + 6 + upgrades.extraHeal))
    setRewardOptions(sample(REWARDS, 3))
    setSelectedRewardId(null)
    setPhase('reward')
    setBusy(false)
  }, [encounterIndex, upgrades.extraHeal])

  const playCard = useCallback((cardId: string) => {
    if (busy || phase !== 'battle') return
    const card = hand.find(item => item.id === cardId)
    if (!card) return

    setBusy(true)
    setTotalTurns(value => value + 1)
    sound.card()

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

    const absorbed = Math.min(nextEnemyBlock, damage)
    const dealt = Math.max(0, damage - absorbed)
    nextEnemyBlock -= absorbed
    const nextEnemyHp = Math.max(0, enemyHp - dealt)
    nextPlayerHp = Math.max(0, nextPlayerHp - selfDamage)

    setEnemyBlock(nextEnemyBlock)
    setEnemyHp(nextEnemyHp)
    setPlayerHp(nextPlayerHp)
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
      setLastKind(card.kind)
    }
    if (nextSequence === 3 && sequence < 3) sound.ready()
    setSequence(nextSequence)

    if (damage > 0) {
      setImpact(card.kind === 'signature' ? 'signature' : 'enemy')
      setMessage(t('message.damage', { card: t(card.nameKey), n: dealt }))
      if (card.kind !== 'signature') sound.hit()
    } else if (block > playerBlock) {
      setMessage(t('message.block', { card: t(card.nameKey), n: block - playerBlock }))
      sound.guard()
    } else {
      setMessage(t('message.executed', { card: t(card.nameKey) }))
    }

    if (nextPlayerHp <= 0) {
      later(() => {
        setPhase('defeat')
        setBusy(false)
        sound.lose()
      }, 320)
      return
    }

    if (nextEnemyHp <= 0) {
      later(finishEncounter, card.kind === 'signature' ? 780 : 420)
      return
    }

    later(() => setImpact(null), card.kind === 'signature' ? 680 : 240)
    resolveEnemy(block, nextEnemyHp, nextSequence, nextPlayerHp)
  }, [
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
    phase,
    playerBlock,
    playerHp,
    resolveEnemy,
    sequence,
    smithFury,
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
      const nextEnemy = ENEMIES[nextIndex]
      const startSequence = id === 'startSequence'
        ? Math.min(3, upgrades.startSequence + 1)
        : upgrades.startSequence
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
      setHand(makeHand(startSequence, heroId))
      setMessage(t('message.newEncounter'))
      setPhase('battle')
      setBusy(false)
      setSelectedRewardId(null)
    }, 620)
  }, [busy, encounterIndex, heroId, later, upgrades.startSequence])

  const changeHero = useCallback(() => {
    timers.current.forEach(window.clearTimeout)
    timers.current = []
    setPhase('select')
    setBusy(false)
    setImpact(null)
    setMessage(t('message.select'))
  }, [])

  const restart = useCallback(() => {
    setUpgrades(DEFAULT_UPGRADES)
    startRun()
  }, [startRun])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (phase !== 'battle' || busy) return
      const index = Number(event.key) - 1
      if (index >= 0 && index < hand.length) playCard(hand[index].id)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [busy, hand, phase, playCard])

  return {
    phase,
    hero,
    heroId,
    heroes: HEROES,
    enemy,
    encounterIndex,
    playerHp,
    playerBlock,
    enemyHp,
    enemyBlock,
    intent,
    exposed,
    sequence,
    hand,
    busy,
    message,
    impact,
    rewardOptions,
    selectedRewardId,
    totalTurns,
    signatureUses,
    upgrades,
    selectHero,
    startRun,
    playCard,
    chooseReward,
    restart,
    changeHero,
  }
}
