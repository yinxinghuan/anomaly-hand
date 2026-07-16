let context: AudioContext | null = null
let muted = false

function ctx() {
  if (!context) context = new AudioContext()
  if (context.state === 'suspended') void context.resume()
  return context
}

function tone(frequency: number, duration: number, volume: number, type: OscillatorType = 'triangle') {
  if (muted) return
  try {
    const audio = ctx()
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    const now = audio.currentTime
    osc.type = type
    osc.frequency.setValueAtTime(frequency, now)
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
    osc.connect(gain).connect(audio.destination)
    osc.start(now)
    osc.stop(now + duration)
  } catch {
    // Audio is non-essential.
  }
}

export function setSoundMuted(value: boolean) {
  muted = value
}

export const sound = {
  select() {
    tone(420, 0.09, 0.12, 'sine')
    window.setTimeout(() => tone(840, 0.06, 0.07, 'sine'), 28)
  },
  card() {
    tone(1320, 0.045, 0.045, 'square')
  },
  hit() {
    tone(95, 0.11, 0.16, 'triangle')
  },
  guard() {
    tone(260, 0.08, 0.08, 'square')
    tone(390, 0.07, 0.045, 'square')
  },
  hurt() {
    tone(72, 0.16, 0.14, 'sawtooth')
  },
  ready() {
    ;[520, 780, 1040].forEach((frequency, index) => {
      window.setTimeout(() => tone(frequency, 0.11, 0.075, 'triangle'), index * 72)
    })
  },
  signature() {
    tone(80, 0.36, 0.2, 'sawtooth')
    tone(1600, 0.08, 0.055, 'square')
  },
  win() {
    ;[294, 349, 440, 587].forEach((frequency, index) => {
      window.setTimeout(() => tone(frequency, 0.18, 0.085, 'triangle'), index * 85)
    })
  },
  lose() {
    ;[147, 131, 110].forEach((frequency, index) => {
      window.setTimeout(() => tone(frequency, 0.28, 0.075, 'sine'), index * 140)
    })
  },
}
