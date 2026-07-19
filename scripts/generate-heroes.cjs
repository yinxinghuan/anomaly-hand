#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')
const { webcrypto } = require('node:crypto')
let sharp
try {
  sharp = require('sharp')
} catch {
  sharp = null
}

const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'src', 'AnomalyHand', 'img', 'heroes')
const CUTOUT_DIR = path.join(OUT, 'cutouts')
const FULL_DIR = path.join(OUT, 'full')
const WORK = path.join(ROOT, '_artifacts', 'heroes')
const SOURCE_DIR = path.join(WORK, 'sources')
const REF_DIR = path.join(WORK, 'references')
const LOG_PATH = path.join(WORK, 'generation-log.json')
const CONTACT_PATH = path.join(WORK, 'hero-contact-sheet.png')
const API = 'https://chat.aiwaves.tech/aigram/api/gen-image'
const UPLOAD_API = 'https://chat.aiwaves.tech/aigram/api/upload'
const mode = process.argv[2] || 'all'
const force = process.argv.includes('--force')
const selectedId = process.argv.find(arg => arg.startsWith('--id='))?.slice(5)
const selectedStyleId = process.argv.find(arg => arg.startsWith('--style='))?.slice(8)
const referenceOverride = process.argv.find(arg => arg.startsWith('--ref='))?.slice(6)
const styleReferenceId = process.argv.find(arg => arg.startsWith('--style-ref='))?.slice(12) || 'style-c'
const uploadReferenceFile = process.argv.find(arg => arg.startsWith('--file='))?.slice(7)

const ATTACHMENTS = '/tmp/codex-remote-attachments/019f6c0d-3b6d-7d33-9c19-021a3a35d876/EC848189-2D31-4A27-90C9-DE376604A1A5'

const HEROES = [
  {
    id: 'las',
    name: 'Las isas',
    source: path.join(ATTACHMENTS, '1-照片-1.jpg'),
    avatar: { left: 442, top: 187, width: 126, height: 126 },
    identity: [
      'adult young woman with a pale softly oval face, clear cool-toned skin, large calm dark eyes,',
      'long saturated blue hair gathered high with loose side strands, slim poised build,',
      'quiet lunar composure; keep her unmistakably adult and do not turn her into a child',
    ].join(' '),
    role: 'recon and refraction operative, fitted midnight tactical coat with subtle circular signal hardware',
  },
  {
    id: 'isabel',
    name: 'Isabel',
    source: path.join(ATTACHMENTS, '2-照片-2.jpg'),
    avatar: { left: 442, top: 188, width: 126, height: 126 },
    post: { left: 85, top: 595, width: 490, height: 490 },
    identity: [
      'adult woman with a soft oval face, warm brown eyes, shoulder-length loose wavy light-brown hair,',
      'distinct golden-blonde face-framing highlights, center part, warm composed expression',
    ].join(' '),
    role: 'field quartermaster and recovery specialist, tailored umber utility coat with brass indexing clips',
  },
  {
    id: 'smith',
    name: 'Smith black',
    source: path.join(ATTACHMENTS, '3-照片-3.jpg'),
    avatar: { left: 442, top: 188, width: 126, height: 126 },
    post: { left: 85, top: 650, width: 490, height: 490 },
    identity: [
      'very muscular adult man with tan skin, swept-back short black hair, extremely full black beard,',
      'heavy brows, broad shoulders, large black geometric tattoos over shoulders and upper arms, fierce focused stare',
    ].join(' '),
    role: 'hardline breach operative, sleeveless black armored harness that leaves the signature tattoos visible',
  },
  {
    id: 'goat',
    name: 'Goat McFisty',
    source: path.join(ATTACHMENTS, '4-照片-4.jpg'),
    avatar: { left: 442, top: 188, width: 126, height: 126 },
    post: { left: 85, top: 595, width: 490, height: 490 },
    identity: [
      'anthropomorphic male goat demon with blue-grey skin and fur, long pointed ears,',
      'two large backward-curving black ram horns, narrow red-orange eyes, white-grey goatee, severe angular face',
    ].join(' '),
    role: 'red-pact anomaly operative, structured dark crimson field robe over black tactical layers',
  },
  {
    id: 'getu',
    name: 'G€tü',
    source: path.join(ATTACHMENTS, '5-照片-5.jpg'),
    avatar: { left: 442, top: 188, width: 126, height: 126 },
    post: { left: 85, top: 650, width: 490, height: 490 },
    identity: [
      'athletic muscular adult Black man with very dark brown skin, close-cropped short natural curls,',
      'clean-shaven face, long strong neck and shoulders, calm serious gaze',
    ].join(' '),
    role: 'kinetic control operative, sleeveless graphite compression armor with restrained cyan measuring seams',
  },
  {
    id: 'chill',
    name: 'Chill guy',
    source: path.join(ATTACHMENTS, '6-照片-6.jpg'),
    avatar: { left: 442, top: 188, width: 126, height: 126 },
    post: { left: 85, top: 595, width: 490, height: 490 },
    identity: [
      'anthropomorphic adult brown bear with dense warm brown fur, rounded ears, broad black nose,',
      'distinct swept wavy brown forelock, steady slightly stern eyes, wearing a light blue denim jacket',
    ].join(' '),
    role: 'cool-head defensive operative, preserve the recognizable light denim jacket over subtle field armor',
  },
  {
    id: 'kibo',
    name: 'KI_Bo',
    source: path.join(ATTACHMENTS, '7-照片-7.jpg'),
    avatar: { left: 442, top: 188, width: 126, height: 126 },
    identity: [
      'elderly dark-skinned man with a bald crown, short silver hair at the sides, full neatly shaped white beard,',
      'deep intelligent eyes, weathered dignified face, luminous turquoise circular neural halo behind his head',
    ].join(' '),
    role: 'signal oracle operative, minimal ochre and charcoal field robes with copper diagnostic nodes',
  },
  {
    id: 'john',
    name: 'JohnCheung',
    source: path.join(ATTACHMENTS, '8-照片-8.jpg'),
    avatar: { left: 442, top: 188, width: 126, height: 126 },
    identity: [
      'friendly athletic adult man with light skin, short styled medium-brown hair, trimmed brown beard,',
      'warm confident expression, blue field-service uniform; his German shepherd partner is a required identity anchor',
    ].join(' '),
    role: 'tracker operative in a blue field-service uniform, one alert German shepherd companion beside his shoulder, no other people',
  },
]

const STYLE = [
  'ONE complete premium vertical 4:5 collectible hero card artwork for the same mobile game.',
  'Chest-up three-quarter portrait facing slightly toward the center, head and identity anchors large and readable at thumbnail size.',
  'Anomaly Field File visual system: charcoal recycled board, fluorescent signal vermilion and acid cyan spot inks,',
  'bold screenprint halftone, dry ink gaps, controlled two-color registration offset, stencil-cut asymmetric geometric card frame,',
  'restrained bone-white linework, subtle oxidized brass rarity marker, one fixed abstract ability-icon strip along the bottom.',
  'Single main light from upper left and restrained cyan edge light from the right.',
  'Contemporary underground tactical archive, premium and authored, controlled roughness, strong silhouette.',
  'The frame, camera, icon strip location, light direction, edge treatment and detail density must match the other cards in one coherent set.',
  'No readable text, no letters, no numbers, no username, no logo, no watermark, no phone UI, no social media interface.',
  'No generic fantasy filigree, no glossy anime gacha look, no photorealism, no 3D render, no soft glass panels, no excessive neon glow.',
].join(' ')

const headers = {
  'Content-Type': 'application/json',
  Origin: 'https://aigram.app',
  Referer: 'https://aigram.app/',
}

function ensureDirs() {
  for (const dir of [OUT, CUTOUT_DIR, FULL_DIR, WORK, SOURCE_DIR, REF_DIR]) fs.mkdirSync(dir, { recursive: true })
}

function loadLog() {
  if (!fs.existsSync(LOG_PATH)) return { created_at: new Date().toISOString(), heroes: {}, requests: [] }
  return JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'))
}

function saveLog(log) {
  fs.writeFileSync(LOG_PATH, `${JSON.stringify(log, null, 2)}\n`)
}

async function prepareReference(hero) {
  const sourceCopy = path.join(SOURCE_DIR, `${hero.id}.jpg`)
  fs.copyFileSync(hero.source, sourceCopy)
  const avatar = await sharp(hero.source)
    .extract(hero.avatar)
    .resize(420, 420, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer()

  const composites = [{ input: avatar, left: 174, top: 40 }]
  if (hero.post) {
    const post = await sharp(hero.source)
      .extract(hero.post)
      .resize(650, 430, { fit: 'cover', position: 'attention' })
      .modulate({ saturation: 0.92 })
      .png()
      .toBuffer()
    composites.push({ input: post, left: 59, top: 490 })
  } else {
    const echo = await sharp(avatar)
      .resize(520, 520)
      .modulate({ saturation: 0.72, brightness: 0.72 })
      .blur(0.6)
      .png()
      .toBuffer()
    composites.push({ input: echo, left: 124, top: 430, blend: 'screen', opacity: 0.32 })
  }

  const referencePath = path.join(REF_DIR, `${hero.id}.png`)
  await sharp({
    create: { width: 768, height: 960, channels: 4, background: '#151719' },
  })
    .composite(composites)
    .png()
    .toFile(referencePath)
  return referencePath
}

async function uploadImage(filePath, filename) {
  const form = new FormData()
  form.append('file', new Blob([fs.readFileSync(filePath)], { type: 'image/png' }), filename)
  const response = await fetch(UPLOAD_API, {
    method: 'POST',
    headers: { Origin: 'https://aigram.app', Referer: 'https://aigram.app/' },
    body: form,
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`Upload HTTP ${response.status}: ${text.slice(0, 300)}`)
  const body = JSON.parse(text)
  if (!body.url) throw new Error(`Upload response did not contain url: ${text.slice(0, 300)}`)
  return body.url
}

async function generateImage(prompt, refUrl, label, log) {
  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(API, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt, ref_url: refUrl }),
      })
      const text = await response.text()
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${text.slice(0, 300)}`)
      const body = JSON.parse(text)
      if (!body.url) throw new Error(`Response did not contain url: ${text.slice(0, 300)}`)
      log.requests.push({
        timestamp: new Date().toISOString(),
        label,
        attempt,
        prompt,
        ref_url: refUrl,
        result_url: body.url,
      })
      saveLog(log)
      return body.url
    } catch (error) {
      lastError = error
      process.stderr.write(`[${label}] attempt ${attempt} failed: ${error.message}\n`)
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, [3000, 8000][attempt - 1]))
    }
  }
  throw lastError
}

async function downloadAsPng(url, outputPath) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download HTTP ${response.status}: ${url}`)
  const input = Buffer.from(await response.arrayBuffer())
  await sharp(input)
    .resize(1024, 1280, { fit: 'cover', position: 'attention' })
    .png({ compressionLevel: 9, palette: false })
    .toFile(outputPath)
}

async function downloadAsWebp(url, outputPath) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download HTTP ${response.status}: ${url}`)
  const input = Buffer.from(await response.arrayBuffer())
  if (!sharp) {
    const contentType = response.headers.get('content-type') || ''
    const isWebp = input.subarray(0, 4).toString('ascii') === 'RIFF' && input.subarray(8, 12).toString('ascii') === 'WEBP'
    if (!/image\/webp/i.test(contentType) && !isWebp) throw new Error(`Full-card fallback requires WebP output, received ${contentType || 'unknown type'}`)
    fs.writeFileSync(outputPath, input)
    return
  }
  await sharp(input)
    .resize(1024, 1280, { fit: 'cover', position: 'attention' })
    .webp({ quality: 88, effort: 6 })
    .toFile(outputPath)
}

const FULL_CARD_STYLES = [
  ['lacquer-war-chronicle', 'Style A, Lacquer War Chronicle. The finished picture itself is a premium 4:5 collectible card: matte obsidian lacquer and deep oxblood surface, a thin weathered antique-gold border with clipped 45-degree corners, restrained gold cracks and one dark bottom band. The character is in an epic active confrontation with a fractured weapon-like anomaly, smoke and torn gilt atmosphere. The frame occupies less than 9 percent of the picture and is physically part of the illustration, not an overlay.'],
  ['astral-reliquary', 'Style B, Astral Reliquary. The finished picture itself is a premium 4:5 collectible card: midnight navy paper, thin bone-white and old-gold structural rules, sparse orbital diagrams and small celestial geometry, with a calm dark bottom band. The character relates to relic fragments, an open ruin or an anomaly in a composed scene with depth and silence. The card architecture is drawn into the image and occupies less than 10 percent; do not make a passport portrait, religion, or readable star-map labels.'],
  ['anomaly-dossier', 'Style C, Anomaly Dossier. The finished picture itself is a premium 4:5 collectible card: charcoal stock, signal vermilion and acid cyan screenprint, coarse halftone, dry ink gaps, broken diagonal registration blocks, an irregular cut-paper edge and a narrow black bottom band. The character is inside an urgent anomalous field operation at the moment control fails. The card architecture is built into the printed illustration, not a front-end overlay.'],
  ['midnight-operation', 'Midnight Operation: noir action-film side light, wet pavement, corridor or laboratory depth, cold teal, sodium yellow and one dangerous vermilion accent; the operative is pursuing, forcing entry, resisting or revealing an anomaly.'],
  ['mineral-mural', 'Mineral Mural: mineral-pigment gouache, lithographic grain, geological strata, crystalline energy and large irregular color fields; the operative and anomaly are integrated into one bold mural-like scene.'],
  ['signal-field-guide', 'Signal Field Guide: anomalous ecology expedition, weathered paper, dry-brush terrain, strange signal life and practical field instruments; the operative interacts with a living landscape or impossible creature.'],
]

const CLEAN_IDENTITY_REFS = Object.fromEntries(HEROES.map(hero => [
  hero.id,
  `https://raw.githubusercontent.com/yinxinghuan/anomaly-hand/main/src/AnomalyHand/img/heroes/cutouts/${hero.id}.webp`,
]))

function chooseFullCardStyle() {
  return FULL_CARD_STYLES[webcrypto.getRandomValues(new Uint32Array(1))[0] % FULL_CARD_STYLES.length]
}

function findFullCardStyle(id) {
  return FULL_CARD_STYLES.find(([styleId]) => styleId === id)
}

async function generateFullCards(log) {
  const targets = selectedId ? HEROES.filter(hero => hero.id === selectedId) : HEROES
  if (targets.length === 0) throw new Error(`Unknown hero id: ${selectedId}`)
  for (const hero of targets) {
    const entry = log.heroes[hero.id]
    const outputPath = path.join(FULL_DIR, `${hero.id}.webp`)
    if (!force && entry.full_card_url && fs.existsSync(outputPath)) {
      process.stdout.write(`skip full ${hero.id}\n`)
      continue
    }
    const referenceUrl = referenceOverride || CLEAN_IDENTITY_REFS[hero.id] || entry.reference_url
    if (!referenceUrl) throw new Error(`Missing reference_url for ${hero.id}`)
    const [styleId, stylePrompt] = selectedStyleId
      ? findFullCardStyle(selectedStyleId) || (() => { throw new Error(`Unknown full-card style: ${selectedStyleId}`) })()
      : entry.full_card_style
      ? FULL_CARD_STYLES.find(([id]) => id === entry.full_card_style) || chooseFullCardStyle()
      : chooseFullCardStyle()
    const cleanup = {
      las: 'No Chinese calligraphy, no Asian characters, no runes, no labels, no floating writing and no glyph-like decorative marks. Keep the red field clear apart from non-linguistic cracks and smoke.',
      goat: 'Do not include flags, slogans, national symbols, political imagery, propaganda, fire writing or any readable writing anywhere in the image.',
      getu: 'Show exactly one adult Black male operative. No child, no minor, no secondary person, no childlike figure and no person beside him.',
      isabel: 'No circular portrait window, no medallion portrait, no duplicate person, no inset avatar and no readable glyphs. Show Isabel only once as the continuous full-scene figure.',
      smith: 'No keyboard, desk, computer, hologram bedroom, screen, room miniature, white paper margin, neon signage, rune-like tattoo marks, pseudo-Chinese characters or readable glyphs. Keep the scene as a physical field confrontation, not a computer setup.',
      john: 'No uniform badge, shoulder patch, insignia, name tape, writing, label, emblem with letters, or pseudo-text anywhere on his uniform. Keep exactly one German shepherd companion.',
    }[hero.id] || 'Do not include any secondary human subject unless the identity lock explicitly requires one.'
    const prompt = !force && entry.full_card_prompt ? entry.full_card_prompt : [
      'Create one original, collectible FULL-CARD ILLUSTRATION for a premium mobile anomaly battler.',
      `Identity lock: preserve this exact primary character: ${hero.identity}.`,
      `Role and costume: ${hero.role}.`,
      referenceOverride ? 'The supplied image is the approved visual target for the named card direction: reproduce its material, edge treatment, palette, graphic density and card architecture while redrawing a new complete scene.' : '',
      'The image itself is one cohesive full-bleed 4:5 story scene: character, action, environment, anomaly and symbolic objects belong together in the same composition.',
      'Keep face, eyes and key identity anchors clearly readable, but do not force a chest-up or three-quarter portrait; use a natural cinematic or mural composition.',
      stylePrompt,
      cleanup,
      'Absolutely no transparent, white, plain or gradient background; no cutout; no passport pose; no generic profile portrait; no UI; no phone screen; no readable text; no letters; no numbers; no logo; no watermark; no runes; no glyphs; no character-like marks.',
      'The direction-specific card edge is required as a painted/printed part of the one image. Its bottom band may contain only four separated, simple non-linguistic geometric marks: a solid dot, a hollow circle, a diamond, and an eight-point star. No collage of separately framed portrait and background. The scene must feel like one authored finished card illustration.',
    ].join(' ')
    const resultUrl = !force && entry.full_card_url ? entry.full_card_url : await generateImage(prompt, referenceUrl, `hero_${hero.id}_full`, log)
    if (force || !entry.full_card_url) {
      entry.full_card_style = styleId
      entry.full_card_prompt = prompt
      entry.full_card_url = resultUrl
      entry.full_card_at = new Date().toISOString()
      saveLog(log)
    }
    await downloadAsWebp(resultUrl, outputPath)
    process.stdout.write(`full ${hero.id} ${styleId} ${resultUrl}\n`)
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
}

const STYLE_REFERENCE_FILES = {
  'style-a': 'style-a-las-reference.png',
  'style-b': 'style-b-las-reference.png',
  'style-c': 'style-c-smith-reference.png',
}

async function uploadStyleReference(log) {
  const filename = STYLE_REFERENCE_FILES[styleReferenceId]
  if (!filename) throw new Error(`Unknown style reference: ${styleReferenceId}`)
  const styleRefPath = path.join(WORK, filename)
  if (!fs.existsSync(styleRefPath)) throw new Error(`Missing style reference ${styleRefPath}`)
  const url = await uploadImage(styleRefPath, `anomaly-hand-${styleReferenceId}-reference.png`)
  log.style_references ||= {}
  log.style_references[styleReferenceId] = url
  saveLog(log)
  process.stdout.write(`${url}\n`)
}

async function uploadCombinedReference(log) {
  if (!uploadReferenceFile) throw new Error('Missing --file=relative-path')
  const inputPath = path.resolve(ROOT, uploadReferenceFile)
  if (!inputPath.startsWith(ROOT) || !fs.existsSync(inputPath)) throw new Error(`Missing combined reference ${inputPath}`)
  const key = path.basename(inputPath, path.extname(inputPath))
  const url = await uploadImage(inputPath, `anomaly-hand-${key}.png`)
  log.combined_reference_urls ||= {}
  log.combined_reference_urls[key] = url
  saveLog(log)
  process.stdout.write(`${url}\n`)
}

async function removeGreen(inputPath, outputPath) {
  const image = sharp(inputPath).ensureAlpha()
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
  for (let index = 0; index < data.length; index += info.channels) {
    const r = data[index]
    const g = data[index + 1]
    const b = data[index + 2]
    const greenLead = g - Math.max(r, b)
    if (g > 155 && greenLead > 16) {
      const alpha = greenLead >= 58 ? 0 : 255 - ((greenLead - 16) / 42) * 255
      data[index + 3] = Math.min(data[index + 3], Math.max(0, Math.min(255, alpha)))
      data[index + 1] = Math.min(g, Math.max(r, b) + 14)
    }
  }
  const transparent = await sharp(data, { raw: info }).png().toBuffer()
  await sharp(transparent)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 10 })
    .extend({
      top: 32,
      right: 32,
      bottom: 16,
      left: 32,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize(900, 1125, { fit: 'contain', position: 'south', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(outputPath)
}

async function reprocessCutouts() {
  for (const hero of HEROES) {
    const sourcePath = path.join(WORK, `${hero.id}-cutout-source.png`)
    const outputPath = path.join(CUTOUT_DIR, `${hero.id}.png`)
    if (!fs.existsSync(sourcePath)) throw new Error(`Missing ${sourcePath}`)
    await removeGreen(sourcePath, outputPath)
    await sharp(outputPath)
      .webp({ quality: 88, alphaQuality: 92, effort: 6 })
      .toFile(path.join(CUTOUT_DIR, `${hero.id}.webp`))
    process.stdout.write(`reprocessed ${hero.id}\n`)
  }
}

async function prepareAll(log) {
  for (const hero of HEROES) {
    const referencePath = await prepareReference(hero)
    log.heroes[hero.id] ||= { name: hero.name }
    log.heroes[hero.id].source_file = path.relative(ROOT, hero.source)
    log.heroes[hero.id].reference_file = path.relative(ROOT, referencePath)
  }
  saveLog(log)
}

async function uploadAll(log) {
  for (const hero of HEROES) {
    const entry = log.heroes[hero.id]
    if (!force && entry.reference_url) {
      process.stdout.write(`skip upload ${hero.id}\n`)
      continue
    }
    const referencePath = path.join(ROOT, entry.reference_file)
    entry.reference_url = await uploadImage(referencePath, `anomaly-hand-${hero.id}-identity-reference.png`)
    entry.uploaded_at = new Date().toISOString()
    saveLog(log)
    process.stdout.write(`uploaded ${hero.id} ${entry.reference_url}\n`)
  }
}

async function generateAll(log) {
  for (const hero of HEROES) {
    const entry = log.heroes[hero.id]
    const outputPath = path.join(OUT, `${hero.id}.png`)
    if (!force && entry.result_url && fs.existsSync(outputPath)) {
      process.stdout.write(`skip generate ${hero.id}\n`)
      continue
    }
    if (!entry.reference_url) throw new Error(`Missing reference_url for ${hero.id}`)
    const prompt = [
      STYLE,
      `Identity lock: preserve the same primary character shown in the enlarged circular profile avatar: ${hero.identity}.`,
      `Game role: ${hero.role}.`,
      'The small avatar is the identity source. A lower reference panel, when present, is only supplementary visual evidence;',
      'do not reproduce its scene, text, other people, props or composition unless explicitly required by the identity lock.',
      'Keep the face/species, hair/fur, horns, beard, skin tone and required companion consistent.',
      'Fill the 4:5 frame edge to edge with the finished card. Keep the face and head in the upper 65 percent and the abstract icon strip in the bottom 13 percent.',
    ].join(' ')
    const resultUrl = await generateImage(prompt, entry.reference_url, `hero_${hero.id}`, log)
    entry.prompt = prompt
    entry.result_url = resultUrl
    entry.generated_at = new Date().toISOString()
    saveLog(log)
    await downloadAsPng(resultUrl, outputPath)
    process.stdout.write(`generated ${hero.id} ${resultUrl}\n`)
  }
}

async function refineAll(log) {
  const targets = selectedId ? HEROES.filter(hero => hero.id === selectedId) : HEROES
  if (targets.length === 0) throw new Error(`Unknown hero id: ${selectedId}`)
  for (const hero of targets) {
    const entry = log.heroes[hero.id]
    if (!entry?.result_url) throw new Error(`Missing first-pass result_url for ${hero.id}`)
    const outputPath = path.join(OUT, `${hero.id}-v2.png`)
    if (!force && entry.refined_url && fs.existsSync(outputPath)) {
      process.stdout.write(`skip refine ${hero.id}\n`)
      continue
    }
    const cleanup = {
      smith: 'Remove the miniature hologram room, desk, keyboard and all prior scene props.',
      getu: 'Remove the child, street lamp, street scene and every secondary person.',
      john: 'Keep exactly one German shepherd companion beside the man; no other people or animals.',
    }[hero.id] || 'Remove all prior scene props and secondary subjects.'
    const prompt = [
      'Create a decisive art-direction revision of this exact hero card while preserving the same primary character identity.',
      `Identity lock: ${hero.identity}.`,
      cleanup,
      'Change the visual system completely from slick white sci-fi trading card to a contemporary underground screenprinted anomaly dossier.',
      'The character must be a chest-up three-quarter portrait filling 68 to 76 percent of the card, facing slightly inward, with the face and identity anchors large at mobile thumbnail size.',
      'Use a matte charcoal-black recycled board background, coarse screenprint halftone, dry ink gaps, torn registration blocks, hard cut-paper edges,',
      'a mostly black asymmetric stencil-cut frame, signal vermilion and acid cyan spot inks, deliberate small red/cyan registration offset,',
      'and only very thin restrained bone-white structural rules covering less than ten percent of the frame.',
      'No circular portrait window, no pale medallion, no thick white border, no silver frame, no magenta, no purple, no rainbow accents, no glossy neon.',
      'Keep one narrow fixed abstract ability-icon strip along the bottom using only cyan, vermilion and bone-white geometric symbols.',
      'No readable text, no letters, no numbers, no username, no logo, no watermark, no phone UI.',
      'Premium authored 2D screenprint illustration, not photorealistic, not 3D, not anime gacha, not generic futuristic card UI.',
      'Fill the complete vertical 4:5 frame edge to edge.',
    ].join(' ')
    const refinedUrl = await generateImage(prompt, entry.result_url, `hero_${hero.id}_refine`, log)
    entry.refine_prompt = prompt
    entry.refined_url = refinedUrl
    entry.refined_at = new Date().toISOString()
    saveLog(log)
    await downloadAsPng(refinedUrl, outputPath)
    process.stdout.write(`refined ${hero.id} ${refinedUrl}\n`)
  }
}

async function generateCutouts(log) {
  const targets = selectedId ? HEROES.filter(hero => hero.id === selectedId) : HEROES
  if (targets.length === 0) throw new Error(`Unknown hero id: ${selectedId}`)
  for (const hero of targets) {
    const entry = log.heroes[hero.id]
    if (!entry?.result_url) throw new Error(`Missing first-pass result_url for ${hero.id}`)
    const outputPath = path.join(CUTOUT_DIR, `${hero.id}.png`)
    const sourcePath = path.join(WORK, `${hero.id}-cutout-source.png`)
    if (!force && entry.cutout_url && fs.existsSync(outputPath)) {
      process.stdout.write(`skip cutout ${hero.id}\n`)
      continue
    }
    const cleanup = {
      las: 'She is an ordinary human woman: normal rounded human ears, no horns, no pointed ears, no fangs and no supernatural anatomy.',
      isabel: 'She is an ordinary human woman: normal rounded human ears, no horns, no pointed ears and no supernatural anatomy.',
      smith: 'He is an ordinary human man. No horns, no pointed ears, no miniature room, no desk, no keyboard, no hologram and no props.',
      goat: 'He is an anthropomorphic goat humanoid. Preserve exactly two large ram horns, goat ears, blue-grey goat features and one goatee.',
      getu: 'He is an ordinary human man. Exactly one adult man, normal rounded human ears, no child, no secondary person, no street scene and no lamp.',
      chill: 'He is one anthropomorphic brown bear. Preserve rounded bear ears, bear muzzle, dense fur and the denim jacket; no human face.',
      kibo: 'He is an ordinary elderly human man. Normal rounded human ears, no horns, no pointed ears; the turquoise halo is an energy graphic, not anatomy.',
      john: 'He is an ordinary human man with normal rounded human ears, plus exactly one German shepherd companion beside his shoulder. No other people or animals.',
    }[hero.id]
    const prompt = [
      'Create a clean isolated production character portrait asset based on this same primary character.',
      `Identity lock: ${hero.identity}.`,
      `Role and costume: ${hero.role}.`,
      cleanup,
      'Chest-up to mid-torso three-quarter portrait, facing slightly toward camera center, entire head, hair, horns, ears, shoulders and required companion visible.',
      'Premium authored 2D screenprint character illustration with charcoal shadow shapes, signal vermilion accents, acid cyan edge accents,',
      'coarse controlled halftone, dry ink texture and hard graphic edges. Keep the face and identity anchors detailed and readable.',
      'Perfectly flat uniform pure chroma green background RGB 0 255 0 from edge to edge.',
      'No card frame, no circle, no medallion, no border, no icon strip, no text, no letters, no numbers, no logo, no watermark, no UI.',
      'No scene, no floor, no cast shadow, no glow behind the subject, no decorative shapes in the background.',
      'The subject must be fully separated from the green background with generous padding.',
    ].join(' ')
    const cutoutUrl = await generateImage(prompt, entry.result_url, `hero_${hero.id}_cutout`, log)
    entry.cutout_prompt = prompt
    entry.cutout_url = cutoutUrl
    entry.cutout_at = new Date().toISOString()
    saveLog(log)
    await downloadAsPng(cutoutUrl, sourcePath)
    await removeGreen(sourcePath, outputPath)
    process.stdout.write(`cutout ${hero.id} ${cutoutUrl}\n`)
  }
}

async function createContactSheet(useRefined = false) {
  const cardWidth = 256
  const cardHeight = 320
  const gap = 18
  const margin = 30
  const width = margin * 2 + cardWidth * 4 + gap * 3
  const height = margin * 2 + cardHeight * 2 + gap
  const composites = []
  for (let index = 0; index < HEROES.length; index += 1) {
    const hero = HEROES[index]
    const refinedPath = path.join(OUT, `${hero.id}-v2.png`)
    const inputPath = useRefined && fs.existsSync(refinedPath)
      ? refinedPath
      : path.join(OUT, `${hero.id}.png`)
    if (!fs.existsSync(inputPath)) continue
    const input = await sharp(inputPath).resize(cardWidth, cardHeight, { fit: 'cover' }).png().toBuffer()
    composites.push({
      input,
      left: margin + (index % 4) * (cardWidth + gap),
      top: margin + Math.floor(index / 4) * (cardHeight + gap),
    })
  }
  const outputPath = useRefined
    ? path.join(WORK, 'hero-contact-sheet-v2.png')
    : CONTACT_PATH
  await sharp({
    create: { width, height, channels: 4, background: '#111315' },
  })
    .composite(composites)
    .png()
    .toFile(outputPath)
  process.stdout.write(`contact ${outputPath}\n`)
}

async function createCutoutContactSheet() {
  const cellWidth = 300
  const cellHeight = 375
  const gap = 18
  const margin = 24
  const width = margin * 2 + cellWidth * 4 + gap * 3
  const height = margin * 2 + cellHeight * 2 + gap
  const composites = []
  for (let index = 0; index < HEROES.length; index += 1) {
    const inputPath = path.join(CUTOUT_DIR, `${HEROES[index].id}.png`)
    if (!fs.existsSync(inputPath)) continue
    const input = await sharp(inputPath)
      .resize(cellWidth, cellHeight, { fit: 'contain', position: 'south' })
      .png()
      .toBuffer()
    composites.push({
      input,
      left: margin + (index % 4) * (cellWidth + gap),
      top: margin + Math.floor(index / 4) * (cellHeight + gap),
    })
  }
  const outputPath = path.join(WORK, 'hero-cutout-contact-sheet.png')
  await sharp({
    create: { width, height, channels: 4, background: '#202326' },
  })
    .composite(composites)
    .png()
    .toFile(outputPath)
  process.stdout.write(`contact ${outputPath}\n`)
}

async function main() {
  ensureDirs()
  const log = loadLog()
  if (mode === 'prepare') await prepareAll(log)
  else if (mode === 'upload') await uploadAll(log)
  else if (mode === 'generate') await generateAll(log)
  else if (mode === 'contact') await createContactSheet()
  else if (mode === 'refine') await refineAll(log)
  else if (mode === 'cutouts') await generateCutouts(log)
  else if (mode === 'contact-v2') await createContactSheet(true)
  else if (mode === 'contact-cutouts') await createCutoutContactSheet()
  else if (mode === 'reprocess-cutouts') await reprocessCutouts()
  else if (mode === 'full') await generateFullCards(log)
  else if (mode === 'upload-style') await uploadStyleReference(log)
  else if (mode === 'upload-ref') await uploadCombinedReference(log)
  else if (mode === 'all') {
    await prepareAll(log)
    await uploadAll(log)
    await generateAll(log)
    await createContactSheet()
  } else {
    throw new Error('Usage: node scripts/generate-heroes.cjs [prepare|upload|generate|refine|cutouts|reprocess-cutouts|full|upload-style|upload-ref|contact|contact-v2|contact-cutouts|all] [--id=hero] [--style=style-id] [--style-ref=style-a|style-b|style-c] [--file=relative-path] [--ref=https-url] [--force]')
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
