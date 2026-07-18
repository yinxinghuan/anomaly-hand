import type { ActionCard, Enemy, Hero, HeroId, Reward } from './types'
import lasImage from './img/heroes/cutouts/las.webp'
import isabelImage from './img/heroes/cutouts/isabel.webp'
import smithImage from './img/heroes/cutouts/smith.webp'
import goatImage from './img/heroes/cutouts/goat.webp'
import getuImage from './img/heroes/cutouts/getu.webp'
import chillImage from './img/heroes/cutouts/chill.webp'
import kiboImage from './img/heroes/cutouts/kibo.webp'
import johnImage from './img/heroes/cutouts/john.webp'
import lasHurtImage from './img/heroes/states/las-hurt.webp'
import isabelHurtImage from './img/heroes/states/isabel-hurt.webp'
import smithHurtImage from './img/heroes/states/smith-hurt.webp'
import goatHurtImage from './img/heroes/states/goat-hurt.webp'
import getuHurtImage from './img/heroes/states/getu-hurt.webp'
import chillHurtImage from './img/heroes/states/chill-hurt.webp'
import kiboHurtImage from './img/heroes/states/kibo-hurt.webp'
import johnHurtImage from './img/heroes/states/john-hurt.webp'

export const HEROES: Hero[] = [
  {
    id: 'las',
    name: 'Las isas',
    code: 'L-01 / REFRACTION',
    passiveKey: 'hero.las.passive',
    signatureNameKey: 'hero.las.signature',
    signatureDescriptionKey: 'hero.las.signatureDesc',
    image: lasImage,
    hurtImage: lasHurtImage,
  },
  {
    id: 'isabel',
    name: 'Isabel',
    code: 'I-03 / QUARTERMASTER',
    passiveKey: 'hero.isabel.passive',
    signatureNameKey: 'hero.isabel.signature',
    signatureDescriptionKey: 'hero.isabel.signatureDesc',
    image: isabelImage,
    hurtImage: isabelHurtImage,
  },
  {
    id: 'smith',
    name: 'Smith black',
    code: 'S-07 / HARDLINE',
    passiveKey: 'hero.smith.passive',
    signatureNameKey: 'hero.smith.signature',
    signatureDescriptionKey: 'hero.smith.signatureDesc',
    image: smithImage,
    hurtImage: smithHurtImage,
  },
  {
    id: 'goat',
    name: 'Goat McFisty',
    code: 'G-13 / RED PACT',
    passiveKey: 'hero.goat.passive',
    signatureNameKey: 'hero.goat.signature',
    signatureDescriptionKey: 'hero.goat.signatureDesc',
    image: goatImage,
    hurtImage: goatHurtImage,
  },
  {
    id: 'getu',
    name: 'G€tü',
    code: 'G-08 / KINETIC',
    passiveKey: 'hero.getu.passive',
    signatureNameKey: 'hero.getu.signature',
    signatureDescriptionKey: 'hero.getu.signatureDesc',
    image: getuImage,
    hurtImage: getuHurtImage,
  },
  {
    id: 'chill',
    name: 'Chill guy',
    code: 'C-04 / COOL HEAD',
    passiveKey: 'hero.chill.passive',
    signatureNameKey: 'hero.chill.signature',
    signatureDescriptionKey: 'hero.chill.signatureDesc',
    image: chillImage,
    hurtImage: chillHurtImage,
  },
  {
    id: 'kibo',
    name: 'KI_Bo',
    code: 'K-11 / ORACLE',
    passiveKey: 'hero.kibo.passive',
    signatureNameKey: 'hero.kibo.signature',
    signatureDescriptionKey: 'hero.kibo.signatureDesc',
    image: kiboImage,
    hurtImage: kiboHurtImage,
  },
  {
    id: 'john',
    name: 'JohnCheung',
    code: 'J-09 / TRACKER',
    passiveKey: 'hero.john.passive',
    signatureNameKey: 'hero.john.signature',
    signatureDescriptionKey: 'hero.john.signatureDesc',
    image: johnImage,
    hurtImage: johnHurtImage,
  },
]

export const BASE_CARDS: ActionCard[] = [
  { id: 'breach', kind: 'breach', nameKey: 'card.breach.name', value: 6, descriptionKey: 'card.breach.desc' },
  { id: 'brace', kind: 'guard', nameKey: 'card.brace.name', value: 6, descriptionKey: 'card.brace.desc' },
  { id: 'probe', kind: 'tech', nameKey: 'card.probe.name', value: 3, descriptionKey: 'card.probe.desc' },
  { id: 'overload', kind: 'breach', nameKey: 'card.overload.name', value: 10, descriptionKey: 'card.overload.desc' },
  { id: 'counter', kind: 'guard', nameKey: 'card.counter.name', value: 3, descriptionKey: 'card.counter.desc' },
  { id: 'calibrate', kind: 'tech', nameKey: 'card.calibrate.name', value: 3, descriptionKey: 'card.calibrate.desc' },
]

const RIVAL_PROFILES: Array<Omit<Enemy, 'maxHp' | 'attack'>> = [
  { id: 'rival-las', heroId: 'las', nameKey: 'rival.las.name', subtitleKey: 'rival.las.subtitle', pattern: ['charge', 'attack', 'guard', 'attack'] },
  { id: 'rival-isabel', heroId: 'isabel', nameKey: 'rival.isabel.name', subtitleKey: 'rival.isabel.subtitle', pattern: ['guard', 'guard', 'attack', 'charge'] },
  { id: 'rival-smith', heroId: 'smith', nameKey: 'rival.smith.name', subtitleKey: 'rival.smith.subtitle', pattern: ['attack', 'attack', 'charge', 'guard'] },
  { id: 'rival-goat', heroId: 'goat', nameKey: 'rival.goat.name', subtitleKey: 'rival.goat.subtitle', pattern: ['charge', 'attack', 'attack', 'guard'] },
  { id: 'rival-getu', heroId: 'getu', nameKey: 'rival.getu.name', subtitleKey: 'rival.getu.subtitle', pattern: ['guard', 'charge', 'attack', 'attack'] },
  { id: 'rival-chill', heroId: 'chill', nameKey: 'rival.chill.name', subtitleKey: 'rival.chill.subtitle', pattern: ['guard', 'attack', 'guard', 'attack'] },
  { id: 'rival-kibo', heroId: 'kibo', nameKey: 'rival.kibo.name', subtitleKey: 'rival.kibo.subtitle', pattern: ['charge', 'guard', 'charge', 'attack'] },
  { id: 'rival-john', heroId: 'john', nameKey: 'rival.john.name', subtitleKey: 'rival.john.subtitle', pattern: ['attack', 'guard', 'attack', 'charge'] },
]

const RIVAL_HP = [18, 20, 22, 25, 28, 31, 35]
const RIVAL_ATTACK = [3, 4, 4, 5, 6, 6, 7]

export function createRivalEncounterRoster(playerId: HeroId, round = 1): Enemy[] {
  const rivals = RIVAL_PROFILES.filter(profile => profile.heroId !== playerId)
  for (let index = rivals.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[rivals[index], rivals[swapIndex]] = [rivals[swapIndex], rivals[index]]
  }
  return rivals.map((rival, index) => ({
    ...rival,
    maxHp: RIVAL_HP[index] + (round - 1) * 8,
    attack: RIVAL_ATTACK[index] + (round - 1),
  }))
}

export const REWARDS: Reward[] = [
  { id: 'breach', nameKey: 'reward.breach.name', descriptionKey: 'reward.breach.desc' },
  { id: 'guard', nameKey: 'reward.guard.name', descriptionKey: 'reward.guard.desc' },
  { id: 'startSequence', nameKey: 'reward.startSequence.name', descriptionKey: 'reward.startSequence.desc' },
  { id: 'extraHeal', nameKey: 'reward.extraHeal.name', descriptionKey: 'reward.extraHeal.desc' },
  { id: 'exposeBonus', nameKey: 'reward.exposeBonus.name', descriptionKey: 'reward.exposeBonus.desc' },
]
