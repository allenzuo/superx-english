import { ref, onMounted } from 'vue'
import { questionService } from '@/services/question'

interface QuestionType {
  id: string
  name: string
  icon: string
  color: string
  description: string
  count: string
}

interface ReadingQuestion {
  id: string
  title: string
  type: string
  year?: number
  difficulty?: string
  article?: string
  questions?: any[]
  topics?: string[]
  images?: string[]
}

class ReadingService {
  private readingStandard: any[] = []
  private readingQA: any[] = []
  private readingMultimodal: any[] = []
  private clozeGrammar: any[] = []
  private isLoaded = false

  async loadData(): Promise<void> {
    if (this.isLoaded) return
    
    try {
      const [standard, qa, multimodal, cloze] = await Promise.all([
        this.loadJSON('/static/data/reading_standard.json'),
        this.loadJSON('/static/data/reading_qa.json'),
        this.loadJSON('/static/data/reading_multimodal.json'),
        this.loadJSON('/static/data/cloze_grammar.json')
      ])
      
      this.readingStandard = standard || []
      this.readingQA = qa || []
      this.readingMultimodal = multimodal || []
      this.clozeGrammar = cloze || []
      this.isLoaded = true
    } catch (e) {
      console.error('Failed to load reading data:', e)
    }
  }

  private loadJSON(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      uni.request({
        url,
        success: (res) => resolve(res.data),
        fail: reject
      })
    })
  }

  getReadingStandard() {
    return this.readingStandard
  }

  getReadingQA() {
    return this.readingQA
  }

  getReadingMultimodal() {
    return this.readingMultimodal
  }

  getClozeGrammar() {
    return this.clozeGrammar
  }

  getReadingStandardCount(): number {
    return Array.isArray(this.readingStandard) ? this.readingStandard.length : 0
  }

  getReadingQACount(): number {
    return Array.isArray(this.readingQA) ? this.readingQA.length : 0
  }

  getReadingMultimodalCount(): number {
    const data = this.readingMultimodal as any
    if (Array.isArray(data)) {
      return data.length
    }
    if (data && typeof data === 'object' && (data as any).questionsList) {
      return (data as any).questionsList.length
    }
    return 0
  }

  getClozeGrammarCount(): number {
    return Array.isArray(this.clozeGrammar) ? this.clozeGrammar.length : 0
  }
}

export const readingService = new ReadingService()
