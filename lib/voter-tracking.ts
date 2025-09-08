// Enhanced voter tracking system using browser fingerprinting
export class VoterTracker {
  private static instance: VoterTracker
  private fingerprint: string | null = null

  private constructor() {}

  static getInstance(): VoterTracker {
    if (!VoterTracker.instance) {
      VoterTracker.instance = new VoterTracker()
    }
    return VoterTracker.instance
  }

  // Generate a unique browser fingerprint
  async generateFingerprint(): Promise<string> {
    if (this.fingerprint) {
      return this.fingerprint
    }

    const components = []

    try {
      // Screen characteristics
      components.push(`screen:${screen.width}x${screen.height}x${screen.colorDepth}`)
      components.push(`avail:${screen.availWidth}x${screen.availHeight}`)

      // Timezone and language
      components.push(`tz:${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
      components.push(`lang:${navigator.language}`)
      components.push(`langs:${navigator.languages?.join(",")}`)

      // Platform and user agent (partial for privacy)
      components.push(`platform:${navigator.platform}`)
      components.push(`ua:${this.hashString(navigator.userAgent)}`)

      // Hardware concurrency
      components.push(`cores:${navigator.hardwareConcurrency || "unknown"}`)

      // Memory (if available)
      if ("deviceMemory" in navigator) {
        components.push(`memory:${(navigator as any).deviceMemory}`)
      }

      // Connection type (if available)
      if ("connection" in navigator) {
        const conn = (navigator as any).connection
        components.push(`conn:${conn?.effectiveType || "unknown"}`)
      }

      // Canvas fingerprinting (lightweight)
      try {
        const canvasFingerprint = this.getCanvasFingerprint()
        components.push(`canvas:${canvasFingerprint}`)
      } catch (error) {
        console.warn("Canvas fingerprinting failed:", error)
        components.push(`canvas:error`)
      }

      // WebGL fingerprinting (basic)
      try {
        const webglFingerprint = this.getWebGLFingerprint()
        components.push(`webgl:${webglFingerprint}`)
      } catch (error) {
        console.warn("WebGL fingerprinting failed:", error)
        components.push(`webgl:error`)
      }

      // Audio context fingerprinting (basic) - with timeout protection
      try {
        const audioFingerprint = await Promise.race([
          this.getAudioFingerprint(),
          new Promise<string>((resolve) => setTimeout(() => resolve("audio-timeout"), 2000)),
        ])
        components.push(`audio:${audioFingerprint}`)
      } catch (error) {
        console.warn("Audio fingerprinting failed:", error)
        components.push(`audio:error`)
      }

      // Add timestamp component for additional uniqueness (but not too specific)
      const dayTimestamp = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) // Days since epoch
      components.push(`day:${dayTimestamp}`)
    } catch (error) {
      console.warn("Error generating fingerprint component:", error)
    }

    // Ensure we have at least some components
    if (components.length === 0) {
      components.push(`fallback:${Date.now()}`)
    }

    // Combine all components and hash
    const combined = components.join("|")
    this.fingerprint = this.hashString(combined)

    console.log("Generated voter fingerprint:", this.fingerprint, "from", components.length, "components")
    return this.fingerprint
  }

  // Simple canvas fingerprinting
  private getCanvasFingerprint(): string {
    try {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return "no-canvas"

      canvas.width = 200
      canvas.height = 50

      ctx.textBaseline = "top"
      ctx.font = "14px Arial"
      ctx.fillStyle = "#f60"
      ctx.fillRect(125, 1, 62, 20)
      ctx.fillStyle = "#069"
      ctx.fillText("CRUISERFEST 2025", 2, 15)
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)"
      ctx.fillText("Vote Tracking", 4, 35)

      return this.hashString(canvas.toDataURL())
    } catch (error) {
      return "canvas-error"
    }
  }

  // Basic WebGL fingerprinting
  private getWebGLFingerprint(): string {
    try {
      const canvas = document.createElement("canvas")
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
      if (!gl) return "no-webgl"

      const renderer = gl.getParameter(gl.RENDERER)
      const vendor = gl.getParameter(gl.VENDOR)

      return this.hashString(`${vendor}|${renderer}`)
    } catch (error) {
      return "webgl-error"
    }
  }

  // Basic audio context fingerprinting with proper cleanup
  private async getAudioFingerprint(): Promise<string> {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      let isContextClosed = false

      const closeContext = () => {
        if (!isContextClosed && audioContext.state !== "closed") {
          isContextClosed = true
          audioContext.close().catch(() => {
            // Ignore close errors
          })
        }
      }

      const oscillator = audioContext.createOscillator()
      const analyser = audioContext.createAnalyser()
      const gainNode = audioContext.createGain()
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1)

      oscillator.type = "triangle"
      oscillator.frequency.setValueAtTime(10000, audioContext.currentTime)

      gainNode.gain.setValueAtTime(0, audioContext.currentTime)

      oscillator.connect(analyser)
      analyser.connect(scriptProcessor)
      scriptProcessor.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.start(0)

      return new Promise((resolve) => {
        const samples: number[] = []
        let resolved = false

        const resolveOnce = (value: string) => {
          if (!resolved) {
            resolved = true
            try {
              oscillator.stop()
            } catch (e) {
              // Oscillator might already be stopped
            }
            closeContext()
            resolve(value)
          }
        }

        scriptProcessor.onaudioprocess = (event) => {
          if (resolved) return

          const buffer = event.inputBuffer.getChannelData(0)
          for (let i = 0; i < buffer.length; i++) {
            samples.push(buffer[i])
          }

          if (samples.length >= 1000) {
            const hash = this.hashString(samples.slice(0, 100).join(","))
            resolveOnce(hash)
          }
        }

        // Fallback timeout
        setTimeout(() => {
          resolveOnce("audio-timeout")
        }, 1000)

        // Handle context state changes
        audioContext.onstatechange = () => {
          if (audioContext.state === "closed" && !resolved) {
            resolveOnce("audio-closed")
          }
        }
      })
    } catch (error) {
      console.warn("Audio fingerprinting error:", error)
      return "audio-error"
    }
  }

  // Simple hash function
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  // Store voter ID with multiple methods for persistence
  async storeVoterSession(categoryId: number): Promise<void> {
    const fingerprint = await this.generateFingerprint()
    const timestamp = Date.now()
    const voteData = {
      fingerprint,
      categoryId,
      timestamp,
      userAgent: navigator.userAgent,
    }

    try {
      // Method 1: localStorage
      localStorage.setItem(`vote_${categoryId}`, JSON.stringify(voteData))

      // Method 2: sessionStorage
      sessionStorage.setItem(`vote_${categoryId}`, JSON.stringify(voteData))

      // Method 3: IndexedDB (more persistent)
      await this.storeInIndexedDB(`vote_${categoryId}`, voteData)

      // Method 4: Store in a cookie (with expiration)
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      document.cookie = `vote_${categoryId}=${fingerprint}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`
    } catch (error) {
      console.warn("Error storing voter session:", error)
    }
  }

  // Check if user has already voted in category
  async hasVotedInCategory(categoryId: number): Promise<boolean> {
    const fingerprint = await this.generateFingerprint()

    try {
      // Check multiple storage methods
      const checks = await Promise.all([
        this.checkLocalStorage(categoryId, fingerprint),
        this.checkSessionStorage(categoryId, fingerprint),
        this.checkIndexedDB(categoryId, fingerprint),
        this.checkCookie(categoryId, fingerprint),
      ])

      // If any method indicates they've voted, return true
      return checks.some((hasVoted) => hasVoted)
    } catch (error) {
      console.warn("Error checking vote status:", error)
      return false
    }
  }

  private checkLocalStorage(categoryId: number, fingerprint: string): boolean {
    try {
      const stored = localStorage.getItem(`vote_${categoryId}`)
      if (!stored) return false

      const data = JSON.parse(stored)
      return data.fingerprint === fingerprint
    } catch {
      return false
    }
  }

  private checkSessionStorage(categoryId: number, fingerprint: string): boolean {
    try {
      const stored = sessionStorage.getItem(`vote_${categoryId}`)
      if (!stored) return false

      const data = JSON.parse(stored)
      return data.fingerprint === fingerprint
    } catch {
      return false
    }
  }

  private async checkIndexedDB(categoryId: number, fingerprint: string): Promise<boolean> {
    try {
      const data = await this.getFromIndexedDB(`vote_${categoryId}`)
      return data?.fingerprint === fingerprint
    } catch {
      return false
    }
  }

  private checkCookie(categoryId: number, fingerprint: string): boolean {
    try {
      const cookies = document.cookie.split(";")
      const voteCookie = cookies.find((cookie) => cookie.trim().startsWith(`vote_${categoryId}=`))

      if (!voteCookie) return false

      const cookieValue = voteCookie.split("=")[1]
      return cookieValue === fingerprint
    } catch {
      return false
    }
  }

  // IndexedDB helper methods
  private async storeInIndexedDB(key: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("CruiserfestVotes", 1)

      request.onerror = () => reject(request.error)

      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(["votes"], "readwrite")
        const store = transaction.objectStore("votes")

        store.put({ key, data })

        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      }

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains("votes")) {
          db.createObjectStore("votes", { keyPath: "key" })
        }
      }
    })
  }

  private async getFromIndexedDB(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("CruiserfestVotes", 1)

      request.onerror = () => reject(request.error)

      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(["votes"], "readonly")
        const store = transaction.objectStore("votes")
        const getRequest = store.get(key)

        getRequest.onsuccess = () => {
          resolve(getRequest.result?.data)
        }

        getRequest.onerror = () => reject(getRequest.error)
      }

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains("votes")) {
          db.createObjectStore("votes", { keyPath: "key" })
        }
      }
    })
  }

  // Get the current voter fingerprint for server-side storage
  async getVoterFingerprint(): Promise<string> {
    return await this.generateFingerprint()
  }

  // Clear all voting data (for testing)
  async clearVotingData(): Promise<void> {
    try {
      // Clear localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("vote_")) {
          localStorage.removeItem(key)
        }
      })

      // Clear sessionStorage
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("vote_")) {
          sessionStorage.removeItem(key)
        }
      })

      // Clear cookies
      document.cookie.split(";").forEach((cookie) => {
        const key = cookie.split("=")[0].trim()
        if (key.startsWith("vote_")) {
          document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        }
      })

      // Clear IndexedDB
      const request = indexedDB.deleteDatabase("CruiserfestVotes")
      await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(undefined)
        request.onerror = () => reject(request.error)
      })

      this.fingerprint = null
    } catch (error) {
      console.warn("Error clearing voting data:", error)
    }
  }
}

// Export singleton instance
export const voterTracker = VoterTracker.getInstance()
