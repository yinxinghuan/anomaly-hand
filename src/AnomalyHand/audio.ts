let context: AudioContext | null = null
let muted = false
let master: GainNode | null = null
let compressor: DynamicsCompressorNode | null = null
let noiseBuffer: AudioBuffer | null = null

function ctx() {
  if (!context) context = new AudioContext()
  if (context.state === 'suspended') void context.resume()
  return context
}

function bus() {
  const audio = ctx()
  if (!master || !compressor) {
    master = audio.createGain()
    compressor = audio.createDynamicsCompressor()
    master.gain.value = 0.72
    compressor.threshold.value = -18
    compressor.knee.value = 14
    compressor.ratio.value = 5
    compressor.attack.value = 0.003
    compressor.release.value = 0.16
    master.connect(compressor).connect(audio.destination)
  }
  return master
}

type ToneOptions = {
  frequency: number
  endFrequency?: number
  duration: number
  volume: number
  type?: OscillatorType
  delay?: number
  attack?: number
  filter?: number
}

function tone({
  frequency,
  endFrequency = frequency,
  duration,
  volume,
  type = 'triangle',
  delay = 0,
  attack = 0.004,
  filter,
}: ToneOptions) {
  if (muted) return
  try {
    const audio = ctx()
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    const filterNode = filter ? audio.createBiquadFilter() : null
    const now = audio.currentTime + delay
    osc.type = type
    osc.frequency.setValueAtTime(frequency, now)
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration)
    gain.gain.setValueAtTime(0.001, now)
    gain.gain.exponentialRampToValueAtTime(volume, now + attack)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
    if (filterNode) {
      filterNode.type = 'lowpass'
      filterNode.frequency.setValueAtTime(filter!, now)
      osc.connect(filterNode).connect(gain).connect(bus())
    } else {
      osc.connect(gain).connect(bus())
    }
    osc.start(now)
    osc.stop(now + duration)
  } catch {
    // Audio is non-essential.
  }
}

function noise(duration: number, volume: number, filterFrequency: number, delay = 0) {
  if (muted) return
  try {
    const audio = ctx()
    if (!noiseBuffer) {
      noiseBuffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * 0.5), audio.sampleRate)
      const channel = noiseBuffer.getChannelData(0)
      for (let index = 0; index < channel.length; index += 1) {
        channel[index] = Math.random() * 2 - 1
      }
    }
    const source = audio.createBufferSource()
    const filter = audio.createBiquadFilter()
    const gain = audio.createGain()
    const now = audio.currentTime + delay
    source.buffer = noiseBuffer
    filter.type = 'bandpass'
    filter.frequency.value = filterFrequency
    filter.Q.value = 0.72
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
    source.connect(filter).connect(gain).connect(bus())
    source.start(now)
    source.stop(now + duration)
  } catch {
    // Audio is non-essential.
  }
}

export function setSoundMuted(value: boolean) {
  muted = value
}

export const sound = {
  select() {
    tone({ frequency: 390, endFrequency: 520, duration: 0.075, volume: 0.09, type: 'sine' })
    tone({ frequency: 780, endFrequency: 1040, duration: 0.06, volume: 0.05, type: 'sine', delay: 0.035 })
    noise(0.045, 0.025, 2600)
  },
  card(kind: 'breach' | 'guard' | 'tech' | 'signature') {
    noise(0.11, kind === 'signature' ? 0.09 : 0.055, 2100)
    tone({
      frequency: kind === 'guard' ? 440 : kind === 'tech' ? 760 : 620,
      endFrequency: kind === 'signature' ? 1450 : 920,
      duration: kind === 'signature' ? 0.18 : 0.095,
      volume: kind === 'signature' ? 0.11 : 0.055,
      type: 'square',
      filter: 2400,
    })
  },
  deal() {
    ;[0, 0.055, 0.11].forEach((delay, index) => {
      noise(0.045, 0.022, 1800 + index * 320, delay)
      tone({ frequency: 520 + index * 90, endFrequency: 690 + index * 90, duration: 0.045, volume: 0.025, type: 'square', delay })
    })
  },
  hit(rating: 'S' | 'A' | 'B' | 'C' = 'B') {
    const force = rating === 'S' ? 1.35 : rating === 'A' ? 1.15 : rating === 'C' ? 0.72 : 1
    noise(0.12, 0.105 * force, 720)
    tone({ frequency: 118, endFrequency: 54, duration: 0.18, volume: 0.16 * force, type: 'sawtooth', filter: 900 })
    tone({ frequency: 1320, endFrequency: 760, duration: 0.075, volume: 0.035 * force, type: 'square' })
  },
  guard(perfect = false) {
    noise(0.09, perfect ? 0.075 : 0.045, 3300)
    tone({ frequency: 220, endFrequency: 175, duration: 0.2, volume: perfect ? 0.12 : 0.075, type: 'triangle' })
    ;[440, 660, 880].slice(0, perfect ? 3 : 2).forEach((frequency, index) => {
      tone({ frequency, duration: 0.11, volume: 0.035, type: 'sine', delay: index * 0.025 })
    })
  },
  hurt() {
    noise(0.2, 0.09, 460)
    tone({ frequency: 92, endFrequency: 42, duration: 0.28, volume: 0.17, type: 'sawtooth', filter: 720 })
    tone({ frequency: 168, endFrequency: 72, duration: 0.17, volume: 0.08, type: 'square', delay: 0.035 })
  },
  ready() {
    ;[480, 720, 960, 1440].forEach((frequency, index) => {
      tone({ frequency, endFrequency: frequency * 1.08, duration: 0.16, volume: 0.055, type: 'triangle', delay: index * 0.065 })
    })
    noise(0.26, 0.025, 4200, 0.06)
  },
  signature() {
    tone({ frequency: 58, endFrequency: 34, duration: 0.58, volume: 0.2, type: 'sawtooth', filter: 620 })
    tone({ frequency: 116, endFrequency: 232, duration: 0.42, volume: 0.095, type: 'triangle', delay: 0.05 })
    noise(0.36, 0.11, 980, 0.13)
    tone({ frequency: 1840, endFrequency: 780, duration: 0.16, volume: 0.07, type: 'square', delay: 0.18 })
  },
  score(rating: 'S' | 'A' | 'B' | 'C') {
    const notes = rating === 'S' ? [660, 990, 1320] : rating === 'A' ? [590, 885] : rating === 'B' ? [520] : [310]
    notes.forEach((frequency, index) => {
      tone({ frequency, endFrequency: frequency * 1.06, duration: 0.13, volume: 0.042, type: 'sine', delay: 0.08 + index * 0.045 })
    })
  },
  win() {
    ;[294, 349, 440, 587].forEach((frequency, index) => {
      tone({ frequency, endFrequency: frequency * 1.04, duration: 0.28, volume: 0.075, type: 'triangle', delay: index * 0.085 })
    })
    noise(0.5, 0.035, 3600, 0.18)
  },
  lose() {
    ;[147, 131, 110].forEach((frequency, index) => {
      tone({ frequency, endFrequency: frequency * 0.72, duration: 0.36, volume: 0.07, type: 'sine', delay: index * 0.14 })
    })
  },
}
