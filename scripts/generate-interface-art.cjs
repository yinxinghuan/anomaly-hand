#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')
const sharp = require('sharp')

const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'src', 'AnomalyHand', 'img', 'interface')
const WORK = path.join(ROOT, '_artifacts', 'interface')
const REF = path.join(WORK, 'c-direction-style-reference.png')
const LOG = path.join(WORK, 'generation-log.json')
const BOARD = path.join(ROOT, 'public', 'art', 'style-exploration-board.png')
const API = 'https://chat.aiwaves.tech/aigram/api/gen-image'
const UPLOAD_API = 'https://chat.aiwaves.tech/aigram/api/upload'
const force = process.argv.includes('--force')
const cardsOnly = process.argv.includes('--cards')

const common = [
  'Premium authored raster artwork for a mobile collectible card battler.',
  'Use the attached image only as a visual-style reference: direction C, black recycled card stock,',
  'fluorescent signal vermilion and acid cyan spot inks, dense screenprint halftone, distressed dry-ink gaps,',
  'layered collage, asymmetric stencil cuts, bone-white technical marks, restrained brass details.',
  'High material richness and intricate printmaking detail, dramatic composition, collectible-card finish.',
  'No readable text, no letters, no numbers, no logo, no watermark, no phone UI, no generic sci-fi HUD,',
  'no glassmorphism, no purple neon, no glossy 3D render, no soft gradients, no blank minimal geometry.',
].join(' ')

const assets = [
  {
    id: 'enemy-leech',
    prompt: [
      common,
      'A single hostile anomaly portrait: a predatory signal leech, elongated ivory mask split by a circular red feeding aperture,',
      'black segmented parasite mantle, threadlike antennae and corrupted cyan transmission rings.',
      'Chest-up creature dossier portrait, centered, intimidating, no humans, no card border, richly textured dark background.',
    ].join(' '),
  },
  {
    id: 'enemy-hound',
    prompt: [
      common,
      'A single hostile anomaly portrait: a mirror hound made of angular black muscle, fractured bone-white canine armor,',
      'multiple offset cyan reflections and one vermilion tracking eye, aggressive three-quarter pose.',
      'Chest-up creature dossier portrait, centered, no humans, no card border, richly textured dark background.',
    ].join(' '),
  },
  {
    id: 'enemy-warden',
    prompt: [
      common,
      'A single hostile anomaly portrait: the Null Warden, monumental faceless containment sentinel with a many-sided ivory helm,',
      'heavy charcoal shoulders, red sealing straps, cyan void aperture and ceremonial archive damage.',
      'Chest-up boss dossier portrait, centered, no humans, no card border, richly textured dark background.',
    ].join(' '),
  },
  {
    id: 'battle-table',
    prompt: [
      common,
      'Top-down classified operations table surface, no characters: layered black dossier paper, torn red evidence strips,',
      'cyan registration targets, faded circular containment diagrams, staple shadows, ink smears, clipped photo corners,',
      'dense at the edges and quieter in the center so game cards remain readable. Full-frame environmental texture.',
    ].join(' '),
  },
  {
    id: 'card-breach',
    prompt: [
      common,
      'Textless vertical tactical action card face for an aggressive breach action: diagonal vermilion slash, fractured target ring,',
      'black impact debris and bone-white technical sigil, intricate screenprint texture, empty lower zone reserved for UI text.',
      'No outer card frame and no words.',
    ].join(' '),
  },
  {
    id: 'card-guard',
    prompt: [
      common,
      'Textless vertical tactical action card face for a defensive guard action: layered faded-mint shield plates, cyan registration ring,',
      'bone-white reinforcement stitching and black distressed paper, intricate screenprint texture, empty lower zone reserved for UI text.',
      'No outer card frame and no words.',
    ].join(' '),
  },
  {
    id: 'card-tech',
    prompt: [
      common,
      'Textless vertical tactical action card face for a technical anomaly action: acid-cyan calibration circles, signal probes,',
      'small vermilion registration errors, bone-white diagnostic geometry and black distressed paper, empty lower zone reserved for UI text.',
      'No outer card frame and no words.',
    ].join(' '),
  },
  {
    id: 'card-signature',
    prompt: [
      common,
      'Textless vertical rare signature action card face: dramatic cyan and vermilion overprint collision, broken halo,',
      'sealed archive emblem, bone-white radial engraving, brass micro-details and dense premium screenprint texture.',
      'Leave the lower zone readable for UI text. No outer card frame and no words.',
    ].join(' '),
  },
]

function ensure() {
  fs.mkdirSync(OUT, { recursive: true })
  fs.mkdirSync(WORK, { recursive: true })
}

function readLog() {
  if (!fs.existsSync(LOG)) return { created_at: new Date().toISOString(), style_reference_url: '', requests: [] }
  return JSON.parse(fs.readFileSync(LOG, 'utf8'))
}

function writeLog(log) {
  fs.writeFileSync(LOG, `${JSON.stringify(log, null, 2)}\n`)
}

async function makeReference() {
  if (fs.existsSync(REF) && !force) return
  const cardWidth = 307
  const cardHeight = 337
  const crops = [70, 430, 790, 1150].map(left => (
    sharp(BOARD)
      .extract({ left, top: 675, width: cardWidth, height: cardHeight })
      .resize(500, 500, { fit: 'cover', position: 'center' })
      .png()
      .toBuffer()
  ))
  const [a, b, c, d] = await Promise.all(crops)
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: '#0c0f10' },
  })
    .composite([
      { input: a, left: 8, top: 8 },
      { input: b, left: 516, top: 8 },
      { input: c, left: 8, top: 516 },
      { input: d, left: 516, top: 516 },
    ])
    .png()
    .toFile(REF)
}

async function upload(filePath) {
  const form = new FormData()
  form.append('file', new Blob([fs.readFileSync(filePath)], { type: 'image/png' }), path.basename(filePath))
  const response = await fetch(UPLOAD_API, {
    method: 'POST',
    headers: { Origin: 'https://aigram.app', Referer: 'https://aigram.app/' },
    body: form,
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`Upload ${response.status}: ${text.slice(0, 240)}`)
  const body = JSON.parse(text)
  if (!body.url) throw new Error(`Upload missing URL: ${text.slice(0, 240)}`)
  return body.url
}

async function generate(prompt, refUrl, id, log) {
  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://aigram.app',
          Referer: 'https://aigram.app/',
        },
        body: JSON.stringify(refUrl ? { prompt, ref_url: refUrl } : { prompt }),
      })
      const text = await response.text()
      if (!response.ok) throw new Error(`Generate ${response.status}: ${text.slice(0, 240)}`)
      const body = JSON.parse(text)
      if (!body.url) throw new Error(`Generate missing URL: ${text.slice(0, 240)}`)
      log.requests.push({
        id,
        prompt,
        ref_url: refUrl,
        result_url: body.url,
        attempt,
        generated_at: new Date().toISOString(),
      })
      writeLog(log)
      return body.url
    } catch (error) {
      lastError = error
      process.stderr.write(`${id} attempt ${attempt}: ${error.message}\n`)
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, [3000, 8000][attempt - 1]))
    }
  }
  throw lastError
}

async function download(url, id) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download ${response.status}: ${url}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  const png = path.join(WORK, `${id}.png`)
  await sharp(buffer).resize(1024, 1024, { fit: 'cover' }).png({ compressionLevel: 9 }).toFile(png)

  const isCard = id.startsWith('card-')
  const output = path.join(OUT, `${id}.webp`)
  await sharp(png)
    .resize(isCard ? 768 : 1024, isCard ? 1024 : 1024, {
      fit: 'cover',
      position: isCard ? 'centre' : 'attention',
    })
    .webp({ quality: 88, effort: 6 })
    .toFile(output)
}

async function main() {
  ensure()
  await makeReference()
  const log = readLog()
  if (!log.style_reference_url || force) {
    log.style_reference_url = await upload(REF)
    log.style_reference_file = path.relative(ROOT, REF)
    writeLog(log)
  }

  for (const asset of assets.filter(asset => !cardsOnly || asset.id.startsWith('card-'))) {
    const output = path.join(OUT, `${asset.id}.webp`)
    if (!force && !cardsOnly && fs.existsSync(output)) {
      process.stdout.write(`skip ${asset.id}\n`)
      continue
    }
    const refUrl = asset.id.startsWith('card-') ? '' : log.style_reference_url
    const cardPrompt = asset.id.startsWith('card-')
      ? `${asset.prompt} Absolutely no person, no human, no face, no animal, no creature, no portrait, no checkerboard transparency preview.`
      : asset.prompt
    const url = await generate(cardPrompt, refUrl, asset.id, log)
    await download(url, asset.id)
    process.stdout.write(`generated ${asset.id}: ${url}\n`)
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
