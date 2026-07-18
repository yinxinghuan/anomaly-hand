import { useEffect, useState, type CSSProperties } from 'react'
import { Icon } from './icons'
import { useAnomalyHand } from './useAnomalyHand'
import { setSoundMuted } from './audio'
import { t } from './i18n'
import type { ActionCard, Hero, Intent, RewardId } from './types'
import enemyLeech from './img/interface/enemy-leech.webp'
import enemyHound from './img/interface/enemy-hound.webp'
import enemyWarden from './img/interface/enemy-warden.webp'
import './AnomalyHand.less'

const ENEMY_ART: Record<string, string> = {
  leech: enemyLeech,
  hound: enemyHound,
  warden: enemyWarden,
}

const REWARD_ICON: Record<RewardId, 'breach' | 'guard' | 'sequence' | 'health' | 'tech'> = {
  breach: 'breach',
  guard: 'guard',
  startSequence: 'sequence',
  extraHeal: 'health',
  exposeBonus: 'tech',
}

function HeroArt({ hero, compact = false, hurt = false }: { hero: Hero; compact?: boolean; hurt?: boolean }) {
  return (
    <div className={`ah-hero-art ah-hero-art--${compact ? 'compact' : 'full'} ${hurt ? 'is-hurt' : ''}`} role="img" aria-label={t('game.heroAlt', { name: hero.name })}>
      <span className="ah-hero-art__print" aria-hidden="true" />
      <span className="ah-hero-art__orbit" aria-hidden="true" />
      <img src={hurt ? hero.hurtImage : hero.image} alt="" draggable={false} />
      <span className="ah-hero-art__frame" aria-hidden="true" />
      <span className="ah-hero-art__icons" aria-hidden="true" />
      <span className="ah-hero-art__catalog" aria-hidden="true" />
    </div>
  )
}

function VitalBar({
  value,
  max,
  block,
  enemy = false,
}: {
  value: number
  max: number
  block: number
  enemy?: boolean
}) {
  const width = `${Math.max(0, Math.min(100, (value / max) * 100))}%`
  return (
    <div className={`ah-vital ${enemy ? 'ah-vital--enemy' : ''}`}>
      <div className="ah-vital__meta">
        <span><Icon name="health" size={15} /> {value}/{max}</span>
        {block > 0 && <span className="ah-vital__block"><Icon name="guard" size={14} /> {block}</span>}
      </div>
      <div className="ah-vital__track"><span style={{ width }} /></div>
    </div>
  )
}

function IntentBadge({ intent }: { intent: Intent }) {
  return (
    <div className={`ah-intent ah-intent--${intent.kind}`}>
      <span className="ah-intent__icon"><Icon name={intent.kind} size={22} /></span>
      <span>
        <small>{t('game.nextIntent')}</small>
        <strong>{t(`intent.${intent.kind}`)} {intent.value}</strong>
      </span>
    </div>
  )
}

function Card({ card, disabled, motion, onPlay }: { card: ActionCard; disabled: boolean; motion: 'idle' | 'commit' | 'impact' | 'discard'; onPlay: () => void }) {
  return (
    <button
      type="button"
      className={`ah-card ah-card--${card.kind} ${motion !== 'idle' ? `is-${motion}` : ''}`}
      disabled={disabled}
      onPointerDown={onPlay}
    >
      <span className="ah-card__registration" />
      <span className="ah-card__kind"><Icon name={card.kind} size={18} /></span>
      <strong>{t(card.nameKey)}</strong>
      {card.value != null && <b>{card.value}</b>}
      <span className="ah-card__desc">{t(card.descriptionKey)}</span>
      <span className="ah-card__key" aria-hidden="true" />
    </button>
  )
}

function EnemyArt({ id, impact }: { id: string; impact: string | null }) {
  return (
    <div className={`ah-enemy-art ah-enemy-art--${id} ${impact === 'enemy' || impact === 'signature' ? 'is-hit' : ''}`}>
      <img src={ENEMY_ART[id]} alt="" draggable={false} />
      <span className="ah-enemy-art__screen" aria-hidden="true" />
      <div className="ah-enemy-art__halo" />
      <div className="ah-enemy-art__mark" />
    </div>
  )
}

export default function AnomalyHand() {
  const game = useAnomalyHand()
  const [rulesOpen, setRulesOpen] = useState(false)
  const [muted, setMuted] = useState(false)

  const toggleMuted = () => {
    setMuted(value => {
      const next = !value
      setSoundMuted(next)
      return next
    })
  }

  useEffect(() => {
    if (!rulesOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setRulesOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [rulesOpen])

  return (
    <main className="ah-shell">
      <div className={`ah ah--${game.phase} ${game.impact ? `is-impact-${game.impact}` : ''} ${muted ? 'is-muted' : ''}`}>
        <div className="ah__grain" aria-hidden="true" />

        {game.chapter && (
          <div className={`ah-chapter ah-chapter--${game.chapter.tone} ${game.chapter.closing ? 'is-closing' : ''}`} key={game.chapter.id} role="status" aria-live="assertive">
            <div className="ah-chapter__rail" aria-hidden="true"><i /><i /><i /></div>
            <p>{game.chapter.kicker}</p>
            <h2>{game.chapter.title}</h2>
            <span>{game.chapter.detail}</span>
            <b>{t(game.chapter.tone === 'red' ? 'chapter.hostileFile' : game.chapter.tone === 'brass' ? 'chapter.archiveTransition' : 'chapter.operationalControl')}</b>
          </div>
        )}

        {game.phase === 'select' && (
          <section className="ah-select">
            <header className="ah-select__header">
              <div className="ah-select__eyebrow">
                <p className="ah-kicker">{t('game.fieldFile')}</p>
                <small>01—08 / ALTERU ARCHIVE</small>
              </div>
              <h1>{t('game.title')}</h1>
              <p>{t('game.selectSubtitle')}</p>
            </header>

            <div className="ah-select__showcase">
              <div className="ah-feature-card">
                <div className="ah-feature-card__art"><HeroArt hero={game.hero} /></div>
                <div className="ah-feature-card__serial">
                  <span>{String(game.heroes.findIndex(hero => hero.id === game.heroId) + 1).padStart(2, '0')}</span>
                  <i>/ 08</i>
                </div>
                <div className="ah-feature-card__copy">
                  <small>{game.hero.code}</small>
                  <h2>{game.hero.name}</h2>
                  <div className="ah-feature-card__abilities">
                    <p><b>{t('game.passiveLabel')}</b><span>{t(game.hero.passiveKey)}</span></p>
                    <p><b>{t('game.signatureLabel')}</b><span>{t(game.hero.signatureNameKey)} — {t(game.hero.signatureDescriptionKey)}</span></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="ah-select__archive-label">
              <span>{t('game.archiveIndex')}</span>
              <small>{t('game.rosterHint')}</small>
            </div>

            <div className="ah-roster" aria-label={t('game.roster')}>
              {game.heroes.map((hero, index) => (
                <button
                  className={`ah-roster-card ${hero.id === game.heroId ? 'is-selected' : ''}`}
                  type="button"
                  key={hero.id}
                  onClick={() => game.selectHero(hero.id)}
                  aria-label={hero.name}
                >
                  <HeroArt hero={hero} compact />
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{hero.name}</strong>
                </button>
              ))}
            </div>

            <footer className="ah-select__footer">
              <button className="ah-button ah-button--secondary" type="button" onClick={() => setRulesOpen(true)}>
                <Icon name="rules" size={19} /> {t('game.rules')}
              </button>
              <button className="ah-button ah-button--primary" type="button" onPointerDown={game.startRun}>
                {t('game.connect')}
              </button>
            </footer>
          </section>
        )}

        {game.phase === 'battle' && (
          <section className="ah-battle ah-screen-enter">
            <header className="ah-battle__header">
              <div>
                <p className="ah-kicker">{t('game.encounter', { n: game.encounterIndex + 1 })}</p>
                <strong>{t(game.enemy.nameKey)}</strong>
                <small>{t(game.enemy.subtitleKey)}</small>
              </div>
              <div className={`ah-turn-state ah-turn-state--${game.turnOwner}`} role="status" aria-live="polite">
                <small>{t('game.turnState')}</small>
                <strong>{t(game.turnOwner === 'enemy' ? 'game.enemyControl' : game.turnOwner === 'handoff' ? 'game.handoffControl' : 'game.playerControl')}</strong>
              </div>
              <div className="ah-battle__tools">
                <button type="button" aria-label={t('game.viewRules')} onClick={() => setRulesOpen(true)}><Icon name="rules" /></button>
                <button type="button" aria-label={t(muted ? 'game.unmute' : 'game.mute')} onClick={toggleMuted}><Icon name="sound" /></button>
              </div>
            </header>

              <div className={`ah-stage ah-stage--${game.turnMotion} ah-stage--entry-${game.battleEntry} ${game.enemyActing ? 'ah-stage--enemy-action' : ''}`}>
              <div className="ah-stage__atmosphere" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
              <div className="ah-stage__registration" aria-hidden="true"><i /><i /><i /></div>
              <div className="ah-performance" aria-live="polite">
                <small>{t('game.score')}</small>
                <strong>{game.score}</strong>
                {game.streak > 1 && <b>{t('game.streak', { n: game.streak })}</b>}
              </div>
              {game.feedback && (
                <div className={`ah-combat-callout ah-combat-callout--${game.feedback.target} ah-combat-callout--${game.feedback.kind}`} key={game.feedback.id}>
                  {game.feedback.rating && <strong>{game.feedback.rating}</strong>}
                  <b>{t(game.feedback.labelKey)}</b>
                  {game.feedback.scoreDelta != null && <small className="ah-combat-callout__score">{t('feedback.tacticalScore')} +{game.feedback.scoreDelta}</small>}
                  {game.feedback.value > 0 && game.feedback.amountKey && (
                    <span className={`ah-combat-callout__amount ah-combat-callout__amount--${game.feedback.amountPolarity ?? 'gain'}`}>
                      <small>{t(game.feedback.amountKey)}</small>
                      <b>{game.feedback.amountPolarity === 'loss' ? '−' : '+'}{game.feedback.value}</b>
                    </span>
                  )}
                </div>
              )}
              {game.impact && (
                <div className={`ah-stage__burst ah-stage__burst--${game.impact}`} aria-hidden="true">
                  <i /><i /><i /><i /><i /><i /><i /><i />
                </div>
              )}
              <div className="ah-stage__impact-lines" aria-hidden="true"><i /><i /><i /><i /><i /></div>
              {game.enemyActing && (
                <div className="ah-stage__enemy-turn" role="status">
                  <Icon name={game.intent.kind} size={15} />
                  <span>{t('game.hostileExecution')}</span>
                </div>
              )}
              <div className="ah-stage__enemy">
                <IntentBadge intent={game.intent} />
                <span className="ah-stage__file-label"><b>{t('game.enemyRole')}</b>{t('game.enemyFile')}</span>
                <div className="ah-stage__enemy-card">
                  <EnemyArt id={game.enemy.id} impact={game.impact} />
                  <div className="ah-stage__enemy-label">
                    <small>{t(game.enemy.subtitleKey)}</small>
                    <strong>{t(game.enemy.nameKey)}</strong>
                  </div>
                </div>
                <VitalBar value={game.enemyHp} max={game.enemy.maxHp} block={game.enemyBlock} enemy />
                {(game.exposed > 0 || game.charged) && (
                  <div className="ah-stage__enemy-statuses">
                    {game.exposed > 0 && <span className="ah-status">{t('game.exposed', { n: game.exposed })}</span>}
                    {game.charged && <span className="ah-status ah-status--charged">{t('game.chargeLocked', { n: 5 })}</span>}
                  </div>
                )}
              </div>

              <div className={`ah-stage__hero ${game.impact === 'player' ? 'is-hit' : ''}`}>
                <span className="ah-stage__file-label"><b>{t('game.playerRole')}</b>{t('game.yourFile')}</span>
                <div className="ah-stage__hero-card"><HeroArt hero={game.hero} hurt={game.playerState === 'hurt'} /></div>
                <div className="ah-stage__hero-label">
                  <small>{game.hero.code}</small>
                  <strong>{game.hero.name}</strong>
                </div>
                <VitalBar value={game.playerHp} max={30} block={game.playerBlock} />
                <div className="ah-sequence" aria-label={t('game.sequence', { n: game.sequence })}>
                  <span><Icon name="sequence" size={18} /></span>
                  {[0, 1, 2].map(index => <i className={index < game.sequence ? 'is-on' : ''} key={index} />)}
                </div>
              </div>
            </div>

            <div className="ah-message" role="status">{game.message}</div>

            <div className={`ah-hand__label ${game.battleEntry !== 'ready' ? 'is-locked' : ''}`}>
              <span>{game.battleEntry === 'briefing' ? t('game.entryBriefing') : game.battleEntry === 'enemy' ? t('game.entryEnemy') : game.battleEntry === 'hero' ? t('game.entryHero') : t('game.handLabel')}</span><i aria-hidden="true" />
            </div>
            <div className={`ah-hand ${game.battleEntry !== 'ready' ? 'is-locked' : ''}`} aria-busy={game.battleEntry !== 'ready'}>
              {game.hand.map((card, index) => (
                <div className={`ah-hand__slot ${game.playedCardId === card.id ? 'is-played' : game.playedCardId ? 'is-dismissed' : ''}`} style={{ '--ah-deal-index': index } as CSSProperties} key={`${game.handDealId}-${card.id}-${index}`}>
                  <Card card={card} disabled={game.busy || game.battleEntry !== 'ready'} motion={game.playedCardId === card.id ? game.turnMotion : 'idle'} onPlay={() => game.playCard(card.id)} />
                  <span>{index + 1}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {game.phase === 'reward' && (
          <section className="ah-reward">
            <div className="ah-reward__hero" aria-hidden="true"><HeroArt hero={game.hero} /></div>
            <header>
              <p className="ah-kicker">{t('game.rewardKicker')}</p>
              <h2>{t('game.rewardTitle')}</h2>
              <p>{t('game.rewardSubtitle')}</p>
            </header>
            <div className="ah-reward__list">
              {game.rewardOptions.map((reward, index) => (
                <button
                  type="button"
                  key={reward.id}
                  className={`ah-reward-card ah-reward-card--${reward.id} ${game.selectedRewardId === reward.id ? 'is-selected' : ''}`}
                  disabled={game.busy}
                  onPointerDown={() => game.chooseReward(reward.id)}
                >
                  <span className="ah-reward-card__top">
                    <small>{t('game.mod', { n: index + 1 })}</small>
                    <i>{String(index + 1).padStart(2, '0')}</i>
                  </span>
                  <span className="ah-reward-card__sigil"><Icon name={REWARD_ICON[reward.id]} size={32} /></span>
                  <span className="ah-reward-card__type">{t(`reward.${reward.id}.type`)}</span>
                  <b>{t(`reward.${reward.id}.value`)}</b>
                  <strong>{t(reward.nameKey)}</strong>
                  <span className="ah-reward-card__desc">{t(reward.descriptionKey)}</span>
                  <span className="ah-reward-card__stamp">{t('game.rewardInstall')}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {(game.phase === 'victory' || game.phase === 'defeat') && (
          <section className={`ah-result ah-result--${game.phase}`}>
            <p className="ah-kicker">{t('game.caseStatus')}</p>
            <div className="ah-result__hero"><HeroArt hero={game.hero} /></div>
            <div className="ah-result__stamp">
              {t(game.phase === 'victory' ? 'game.victoryStamp' : 'game.defeatStamp')}
            </div>
            <h2>{t(game.phase === 'victory' ? 'game.victoryTitle' : 'game.defeatTitle')}</h2>
            <p>{t('game.resultSummary', { name: game.hero.name, turns: game.totalTurns, signatures: game.signatureUses })}</p>
            <dl>
              <div><dt>{t('game.encounterReached')}</dt><dd>{game.encounterIndex + 1}/3</dd></div>
              <div><dt>{t('game.remainingHp')}</dt><dd>{game.playerHp}/30</dd></div>
            </dl>
            <div className="ah-result__actions">
              <button className="ah-button ah-button--primary" type="button" onPointerDown={game.restart}>{t('game.restart')}</button>
              <button className="ah-button ah-button--secondary" type="button" onPointerDown={game.changeHero}>{t('game.changeHero')}</button>
            </div>
          </section>
        )}

        {rulesOpen && (
          <div className="ah-modal" role="dialog" aria-modal="true" aria-labelledby="rules-title" onClick={() => setRulesOpen(false)}>
            <div className="ah-modal__panel" onClick={event => event.stopPropagation()}>
              <button className="ah-modal__close" type="button" aria-label={t('game.closeRules')} onClick={() => setRulesOpen(false)}>
                <Icon name="close" />
              </button>
              <p className="ah-kicker">{t('game.quickProtocol')}</p>
              <h2 id="rules-title">{t('game.rulesTitle')}</h2>
              <ol>
                {[1, 2, 3, 4].map(n => (
                  <li key={n}><b>{t(`rule.${n}.title`)}</b><span>{t(`rule.${n}.body`)}</span></li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
