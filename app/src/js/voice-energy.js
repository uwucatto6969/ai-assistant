export default class VoiceEnergy {
  constructor() {
    this.voiceEnergyContainerElement = document.querySelector(
      '#voice-energy-container'
    )
    // listening, processing, talking, idle
    this._status = 'idle'
  }

  set status(newStatus) {
    this._status = newStatus

    if (this.voiceEnergyContainerElement) {
      // remove all class and add newStatus
      this.voiceEnergyContainerElement.className = ''
      this.voiceEnergyContainerElement.classList.add(newStatus)
    }
  }

  init() {
    if (this.voiceEnergyContainerElement) {
      const particles = new Set()
      const particleColors = ['blue', 'pink']

      this.status = this._status
      for (let i = 0; i < 32; i += 1) {
        const particle = document.createElement('div')
        const randomColor = Math.floor(Math.random() * 2)
        let random = Math.floor(Math.random() * 32)

        while (particles.has(random)) {
          random = Math.floor(Math.random() * 32)
        }

        particles.add(random)
        particle.setAttribute('data-particle', String(random))
        particle.classList.add('voice-particle', particleColors[randomColor])
        particle.style.transform = `rotate(${
          i * 11.25
        }deg) translate(110px) rotate(-${i * 11.25}deg)`
        this.voiceEnergyContainerElement.appendChild(particle)
      }
    }
  }
}
