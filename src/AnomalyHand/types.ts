export type Phase = 'select' | 'battle' | 'reward' | 'victory' | 'defeat'
export type CardKind = 'breach' | 'guard' | 'tech' | 'signature'
export type IntentKind = 'attack' | 'guard' | 'charge'

export type HeroId = 'las' | 'isabel' | 'smith' | 'goat' | 'getu' | 'chill' | 'kibo' | 'john'

export type Hero = {
  id: HeroId
  name: string
  code: string
  passiveKey: string
  signatureNameKey: string
  signatureDescriptionKey: string
  image: string
  hurtImage: string
}

export type ActionCard = {
  id: string
  kind: CardKind
  nameKey: string
  value?: number
  descriptionKey: string
}

export type Intent = {
  kind: IntentKind
  value: number
}

export type Enemy = {
  id: string
  nameKey: string
  subtitleKey: string
  maxHp: number
  attack: number
  pattern: IntentKind[]
}

export type Upgrades = {
  breach: number
  guard: number
  startSequence: number
  extraHeal: number
  exposeBonus: number
}

export type RewardId = keyof Upgrades

export type Reward = {
  id: RewardId
  nameKey: string
  descriptionKey: string
}

export type Rating = 'S' | 'A' | 'B' | 'C'

export type CombatFeedback = {
  id: number
  stage: 'effect' | 'value'
  target: 'enemy' | 'player' | 'hero'
  kind: 'damage' | 'block' | 'heal' | 'hurt' | 'perfect' | 'signature'
  value: number
  amountKey?: string
  amountPolarity?: 'gain' | 'loss'
  rating?: Rating
  scoreDelta?: number
  effectKey: string
  labelKey: string
}
