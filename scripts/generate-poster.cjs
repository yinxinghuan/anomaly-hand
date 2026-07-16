#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')
const sharp = require('sharp')

const ROOT = path.resolve(__dirname, '..')
const WORK = path.join(ROOT, '_artifacts', 'poster')
const OUTPUT = path.join(ROOT, 'public', 'poster.png')
const RECORD = path.join(ROOT, 'doc', 'poster-generation.json')
const API = 'https://chat.aiwaves.tech/aigram/api/gen-image'
const REF_URL = 'https://cdn.aiwaves.tech/prod/telegram/avatar/0/1784228461881220.webp'

const prompt = [
  'Square 1024x1024 professional narrative key art poster for the mobile card battler ANOMALY HAND.',
  'Use the attached heroine only as identity reference: the same adult blonde field operative Isabel in an olive archive uniform,',
  'clear expressive eyes, confident focused face, three-quarter chest-up action pose.',
  'She stands at a black classified operations table and slams one luminous tactical card down toward a terrifying Signal Leech:',
  'an elongated ivory parasite mask with one red circular feeding eye, black segmented mantle and corrupted cyan transmission rings.',
  'The card impact tears the scene into fluorescent signal vermilion and acid cyan screenprint layers.',
  'Visual style: premium underground anomaly dossier, charcoal recycled paper, dense coarse halftone, distressed dry-ink gaps,',
  'asymmetric stencil cuts, clipped evidence photographs, bone-white technical circles, restrained brass micro-details,',
  'hard graphic shadows, authored editorial composition, dramatic conflict readable at 160x160 thumbnail size.',
  'Keep Isabel face and both eyes fully visible in the upper-middle area. Keep the enemy mask clearly visible opposite her.',
  'Place the exact large readable English title ANOMALY HAND fully inside a dark charcoal title band between 7 and 21 percent from the top.',
  'Leave at least 60 pixels of empty black margin above every letter and 45 pixels at both left and right; no letter may touch or cross an image edge.',
  'Use one centered line if it fits, otherwise two centered lines, heavy condensed bone-white block lettering with subtle vermilion and cyan registration offset.',
  'No other readable words, no logo, no watermark, no phone UI, no game screenshot, no card-grid interface,',
  'Strict four-color palette only: charcoal black, bone white, signal vermilion red and acid cyan, with tiny muted brass accents.',
  'Absolutely no purple, magenta, violet or blue-violet anywhere. No glassmorphism, no glossy 3D, no photorealism, no anime gacha framing.',
  'Keep the bottom 20 percent free of faces and essential objects because platform controls may cover it.',
].join(' ')

async function generate() {
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
        body: JSON.stringify({ prompt, ref_url: REF_URL }),
      })
      const text = await response.text()
      if (!response.ok) throw new Error(`Generate ${response.status}: ${text.slice(0, 300)}`)
      const body = JSON.parse(text)
      if (!body.url) throw new Error(`Generate missing URL: ${text.slice(0, 300)}`)
      return { url: body.url, attempt }
    } catch (error) {
      lastError = error
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, [3000, 8000][attempt - 1]))
    }
  }
  throw lastError
}

async function main() {
  fs.mkdirSync(WORK, { recursive: true })
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
  const { url, attempt } = await generate()
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download ${response.status}: ${url}`)
  const source = Buffer.from(await response.arrayBuffer())
  const candidate = path.join(WORK, `poster-${Date.now()}.png`)
  await sharp(source).resize(1024, 1024, { fit: 'cover', position: 'attention' }).png({ compressionLevel: 9 }).toFile(candidate)
  await fs.promises.copyFile(candidate, OUTPUT)

  const record = {
    endpoint: API,
    origin: 'https://aigram.app',
    generated_at: new Date().toISOString(),
    file: path.relative(ROOT, OUTPUT),
    candidate: path.relative(ROOT, candidate),
    result_url: url,
    ref_url: REF_URL,
    attempt,
    prompt,
    source_type: 'Aigram transit raster generation',
  }
  fs.writeFileSync(RECORD, `${JSON.stringify(record, null, 2)}\n`)
  process.stdout.write(`${JSON.stringify(record, null, 2)}\n`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
