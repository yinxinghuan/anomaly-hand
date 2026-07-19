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
const requestedId = process.argv.find(arg => arg.startsWith('--id='))?.slice(5)
const force = process.argv.includes('--force')

const CARDS = [
  ['breach', 'skill', 'A single vermilion triangular wedge pierces a matte black rectangular bulkhead; clean broken plates, red/white impact burst and cyan debris radiate from the point of contact.'],
  ['overload', 'skill', 'A sealed black reactor sphere cracks under one vermilion zigzag bolt; three cyan containment rings split apart with controlled shards and heat lines.'],
  ['brace', 'skill', 'Three overlapping mint hexagonal metal plates close around a tiny warm circular core; compact symmetrical protective construction with a calm cyan aura.'],
  ['counter', 'skill', 'A cyan curved deflection ribbon catches one vermilion energy line and curls it into a precise returning spiral; balanced radial geometry only.'],
  ['probe', 'skill', 'A cyan optical aperture with concentric mechanical rings focuses on one tiny fractured red signal crystal; radial diagnostic geometry and red registration sparks.'],
  ['calibrate', 'skill', 'A mint recovery waveform straightens across a broken cyan crosshair and reconnects a small warm circular core; careful geometric repair.'],
  ['reward-breach', 'upgrade', 'A larger vermilion triangular wedge splits one black rectangular plate into crisp expanding fragments; abstract permanent force amplification.'],
  ['reward-guard', 'upgrade', 'A mint hexagonal plate lattice grows a second nested inner layer around a calm cyan dot; abstract permanent protection amplification.'],
  ['reward-start-sequence', 'upgrade', 'Three oxidized brass rings ignite one after another around a cyan spark; clear sequence progression as abstract concentric geometry.'],
  ['reward-extra-heal', 'upgrade', 'A small mint glass recovery vessel releases one bright cyan restorative drop into a cracked black mineral field; abstract careful repair.'],
  ['reward-expose-bonus', 'upgrade', 'A cyan target lattice intersects a vermilion fault line at one exact point, opening the fault into a bright geometric weak spot.'],
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
        body: JSON.stringify({ prompt }),
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
      'Create one square, full-bleed, nonrepresentational geometric screenprint composition.',
      'Use this exact visual language: charcoal-black paper stock, signal vermilion and acid cyan screenprint, dry ink gaps, coarse halftone, controlled registration offsets, angular red/cyan field blocks and a narrow black bottom band with four simple geometric marks only: dot, ring, diamond, eight-point star.',
      `Central geometry: ${subject}`,
      'The central geometry must fill the upper two-thirds and remain unmistakable at a 90 px mobile thumbnail. Fill the rest with only diagonal bars, concentric circles, rectangular grid panels, triangular fragments, halftone texture, dots and contained energy lines.',
      'Make one coherent printed picture with material, depth and decisive visual hierarchy. Use no readable text, letters, numbers, title, logo, watermark, rune, glyph, flag, or phone interface. Do not draw a separate front-end card frame; the printed edge language is part of the image itself.',
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
