import type { ActionCard, Enemy, Hero, Reward } from './types'
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

export const ENEMIES: Enemy[] = [
  {
    id: 'leech',
    nameKey: 'enemy.leech.name',
    subtitleKey: 'enemy.leech.subtitle',
    maxHp: 18,
    attack: 4,
    pattern: ['attack', 'guard', 'attack', 'charge'],
  },
  {
    id: 'hound',
    nameKey: 'enemy.hound.name',
    subtitleKey: 'enemy.hound.subtitle',
    maxHp: 24,
    attack: 6,
    pattern: ['guard', 'attack', 'charge', 'attack'],
  },
  {
    id: 'warden',
    nameKey: 'enemy.warden.name',
    subtitleKey: 'enemy.warden.subtitle',
    maxHp: 34,
    attack: 7,
    pattern: ['charge', 'attack', 'guard', 'attack'],
  },
]

export const REWARDS: Reward[] = [
  { id: 'breach', nameKey: 'reward.breach.name', descriptionKey: 'reward.breach.desc' },
  { id: 'guard', nameKey: 'reward.guard.name', descriptionKey: 'reward.guard.desc' },
  { id: 'startSequence', nameKey: 'reward.startSequence.name', descriptionKey: 'reward.startSequence.desc' },
  { id: 'extraHeal', nameKey: 'reward.extraHeal.name', descriptionKey: 'reward.extraHeal.desc' },
  { id: 'exposeBonus', nameKey: 'reward.exposeBonus.name', descriptionKey: 'reward.exposeBonus.desc' },
]
