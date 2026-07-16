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
