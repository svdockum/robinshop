let audio: AudioContext | null = null

function tone(frequency: number, durationMs: number, delayMs = 0) {
  try {
    audio ??= new AudioContext()
    const start = audio.currentTime + delayMs / 1000
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = 'sine'
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000)
    osc.connect(gain).connect(audio.destination)
    osc.start(start)
    osc.stop(start + durationMs / 1000 + 0.02)
  }
  catch {
    // Geen geluid mogelijk; trillen en beeld blijven over.
  }
}

/** Korte piep en tik bij een gelukte scan. */
export function feedbackSuccess() {
  navigator.vibrate?.(60)
  tone(1046, 90)
}

/** Twee lage tonen bij een probleem. */
export function feedbackError() {
  navigator.vibrate?.([80, 60, 80])
  tone(330, 120)
  tone(262, 160, 150)
}
