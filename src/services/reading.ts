import readingStandardData from '@/static/data/reading_standard.json'
import readingQAData from '@/static/data/reading_qa.json'
import readingMultimodalData from '@/static/data/reading_multimodal.json'
import clozeGrammarData from '@/static/data/cloze_grammar.json'

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
  private readingMultimodal: any = null
  private clozeGrammar: any[] = []
  private isLoaded = false

  async loadData(): Promise<void> {
    if (this.isLoaded) return
    
    console.log('Loading reading data from import...')
    
    try {
      this.readingStandard = (readingStandardData as any) || []
      this.readingQA = (readingQAData as any) || []
      this.readingMultimodal = readingMultimodalData as any
      this.clozeGrammar = (clozeGrammarData as any) || []
      this.isLoaded = true
      console.log('Loaded reading data successfully')
    } catch (e) {
      console.error('Failed to load reading data:', e)
    }
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
