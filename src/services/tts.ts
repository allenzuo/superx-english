export interface TTSOptions {
  text: string
  lang?: string
  success?: () => void
  fail?: (err: any) => void
}

function getBrowserTTS(): any {
  if (typeof window !== 'undefined' && (window as any).speechSynthesis) {
    return (window as any).speechSynthesis
  }
  return null
}

function detectLanguage(text: string): string {
  const chineseRegex = /[\u4e00-\u9fa5]/
  if (chineseRegex.test(text)) {
    return 'zh-CN'
  }
  return 'en-US'
}

function speakBrowser(text: string, lang?: string, callback?: () => void): void {
  const synthesis = getBrowserTTS()
  if (!synthesis) {
    console.log('浏览器不支持TTS')
    callback?.()
    return
  }
  
  synthesis.cancel()
  
  const detectedLang = lang || detectLanguage(text)
  
  const utterance = new (window as any).SpeechSynthesisUtterance(text)
  utterance.lang = detectedLang
  utterance.rate = 0.85
  utterance.pitch = 1
  
  utterance.onend = () => callback?.()
  utterance.onerror = () => callback?.()
  
  synthesis.speak(utterance)
}

export const ttsService = {
  isAvailable(): boolean {
    const synthesis = getBrowserTTS()
    if (synthesis) return true
    
    const platform = uni.getSystemInfoSync()?.platform
    return platform !== 'h5' && platform !== 'web'
  },

  speak(text: string, options?: Partial<TTSOptions>): void {
    if (!text) return
    
    const synthesis = getBrowserTTS()
    if (synthesis) {
      speakBrowser(text, options?.lang, () => {
        options?.success?.()
      })
      return
    }
    
    const platform = uni.getSystemInfoSync()?.platform
    if (platform === 'h5' || platform === 'web') {
      alert(text)
      options?.success?.()
      return
    }
    
    uni.showModal({
      title: '朗读内容',
      content: text,
      showCancel: false,
      confirmText: '知道了',
      success: () => {
        options?.success?.()
      }
    })
  },

  speakWord(word: string, callback?: () => void): void {
    this.speak(word, { success: callback })
  },

  speakSentence(sentence: string, callback?: () => void): void {
    this.speak(sentence, { success: callback })
  },

  speakChinese(text: string, callback?: () => void): void {
    this.speak(text, { lang: 'zh-CN', success: callback })
  },

  speakEnglish(text: string, callback?: () => void): void {
    this.speak(text, { lang: 'en-US', success: callback })
  },

  stop(): void {
    const synthesis = getBrowserTTS()
    if (synthesis) {
      synthesis.cancel()
    }
  },

  pause(): void {
    const synthesis = getBrowserTTS()
    if (synthesis) {
      synthesis.pause()
    }
  },

  play(): void {
    const synthesis = getBrowserTTS()
    if (synthesis) {
      synthesis.resume()
    }
  },

  destroy(): void {
    this.stop()
  }
}
