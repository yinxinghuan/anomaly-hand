#!/usr/bin/env node

/* Generate the non-textual picture layer for skills and upgrade cards.
 * These assets are complete printed tiles, not front-end SVG illustrations.
 */
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'src/AnomalyHand/img/card-art')
const LOG_DIR = path.join(ROOT, '_artifacts/card-art')
const LOG_PATH = path.join(LOG_DIR, 'generation-log.json')
const API = 'https://chat.aiwaves.tech/aigram/api/gen-image'
const STYLE_REFERENCE = 'https://images.aiwaves.tech/uploads/1784442802957-67987r05cyd.png'
const requestedId = process.argv.find(arg => arg.startsWith('--id='))?.slice(5)
const force = process.argv.includes('--force')

const CARDS = [
  ['breach', 'skill', 'A heavy vermilion breach wedge tears through a black armored barrier, sharp fractured diagonal, debris and impact lines, immediate forward violence.'],
  ['overload', 'skill', 'A sealed anomaly core cracks open under a single jagged vermilion lightning strike, cyan containment rings splitting apart, extreme pressure and heat.'],
  ['brace', 'skill', 'Three overlapping mint-green defensive plates lock together around a tiny warm core, compact protective geometry, calm resilient posture.'],
  ['counter', 'skill', 'A cyan deflection arc folds an incoming vermilion strike back toward its source, clean looping counterforce, balanced tension.'],
  ['probe', 'skill', 'A cyan diagnostic lens with concentric apertures scans an impossible signal fragment, precise radial focus with small red registration sparks.'],
  ['calibrate', 'skill', 'A mint recovery pulse aligns a broken cyan crosshair and a small warm heartbeat core, careful repair and a restrained upward energy trace.'],
  ['reward-breach', 'upgrade', 'A vermilion breach wedge becomes larger and sharper, splitting a black plate into decisive clean fragments: permanent offensive amplification.'],
  ['reward-guard', 'upgrade', 'A pair of mint defense plates grows a second inner layer and locks into a stable shield lattice: permanent protection amplification.'],
  ['reward-start-sequence', 'upgrade', 'Three oxidized brass sequence rings ignite one after another around a cyan spark, a clear beginning-of-combo ritual with forward momentum.'],
  ['reward-extra-heal', 'upgrade', 'A small mint restoration vessel releases one concentrated recovery pulse into a cracked dark field, gentle but precise repair.'],
  ['reward-expose-bonus', 'upgrade', 'A cyan target lattice catches a vermilion fault line and forces it wide open, pressure point revealed for greater exploitation.'],
]

function loadLog() {
  if (!fs.existsSync(LOG_PATH)) return { createdAt: new Date().toISOString(), cards: {}, requests: [] }
  return JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'))
}

function saveLog(log) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
  fs.writeFileSync(LOG_PATH, `${JSON.stringify(log, null, 2)}\n`)
}

async function generate(prompt, label, log) {
  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: 'https://aigram.app', Referer: 'https://aigram.app/' },
        body: JSON.stringify({ prompt, ref_url: STYLE_REFERENCE }),
      })
      const body = await response.json()
      if (!response.ok || !body.url) throw new Error(`HTTP ${response.status}: ${JSON.stringify(body).slice(0, 260)}`)
      log.requests.push({ timestamp: new Date().toISOString(), label, attempt, prompt, resultUrl: body.url })
      saveLog(log)
      return body.url
    } catch (error) {
      lastError = error
      process.stderr.write(`${label}: attempt ${attempt} failed: ${error.message}\n`)
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt === 1 ? 3000 : 8000))
    }
  }
  throw lastError
}

async function download(url, outputPath) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`download failed: ${response.status}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  const isWebp = bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  if (!isWebp) throw new Error(`expected WebP, got ${response.headers.get('content-type') || 'unknown'}`)
  fs.writeFileSync(outputPath, bytes)
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const log = loadLog()
  const targets = requestedId ? CARDS.filter(([id]) => id === requestedId) : CARDS
  if (!targets.length) throw new Error(`unknown card id: ${requestedId}`)
  for (const [id, type, subject] of targets) {
    const outputPath = path.join(OUT, `${id}.webp`)
    if (!force && fs.existsSync(outputPath)) {
      process.stdout.write(`skip ${id}\n`)
      continue
    }
    const prompt = [
      'Create one original, finished collectible ABILITY TILE for a premium mobile anomaly card battler.',
      'Use the supplied style reference only for the approved C Anomaly Dossier visual language: charcoal-black stock, signal vermilion and acid cyan screenprint, dry ink gaps, coarse halftone, controlled registration offsets, angular red/cyan field blocks and a narrow black bottom band with four simple geometric marks only: dot, ring, diamond, eight-point star.',
      `Tile purpose: ${type}. Central symbolic event: ${subject}`,
      'The central symbol must fill the upper two-thirds and remain unmistakable at a 90 px mobile thumbnail. This is an object/action illustration, not a character portrait, not a UI screenshot, and not a blank icon on a flat background.',
      'Make one coherent printed picture with material, depth and decisive visual hierarchy. No readable text, letters, numbers, logo, watermark, rune, glyph, flag, human face, or phone interface. Do not add a front-end card frame; the printed edge language is part of the image itself.',
    ].join(' ')
    const resultUrl = await generate(prompt, id, log)
    await download(resultUrl, outputPath)
    log.cards[id] = { type, resultUrl, generatedAt: new Date().toISOString(), prompt }
    saveLog(log)
    process.stdout.write(`generated ${id} ${resultUrl}\n`)
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
}

main().catch(error => {
  process.stderr.write(`${error.stack || error.message}\n`)
  process.exitCode = 1
})
