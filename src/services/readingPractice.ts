import { ref } from 'vue'
import readingStandardData from '@/static/data/reading_standard.json'
import clozeGrammarData from '@/static/data/cloze_grammar.json'
import readingQAData from '@/static/data/reading_qa.json'
import readingMultimodalData from '@/static/data/reading_multimodal.json'
import writingEssayData from '@/static/data/writing_essay.json'

export interface ReadingPassage {
  id: string
  title: string
  year: number
  difficulty: string
  passage: string
  questions: ReadingQuestion[]
  wordCount: number
  readingTime: string
}

export interface ReadingQuestion {
  id: string
  content: string
  options: Record<string, string>
  answer: string
  analysis: string
}

export interface ClozePassage {
  id: string
  title: string
  year: number
  difficulty: string
  passage: string
  questions: ClozeQuestion[]
  wordCount: number
  readingTime: string
}

export interface ClozeQuestion {
  id: string
  position: number
  options: Record<string, string>
  answer: string
  analysis: string
}

export interface ReadingQAPassage {
  id: string
  title: string
  year: number
  difficulty: string
  passage: string
  questions: ReadingQAQuestion[]
  wordCount: number
  readingTime: string
}

export interface ReadingQAQuestion {
  id: string
  number: number
  content: string
  sampleAnswer: string
  analysis: string
}

export interface MultimodalPassage {
  id: string
  title: string
  year: number
  difficulty: string
  description: string
  media: Record<string, any> | null
  passage: string | null
  questions: MultimodalQuestion[]
  wordCount: number
  readingTime: string
}

export interface MultimodalQuestion {
  id: string
  content: string
  options: Record<string, string>
  answer: string
  analysis: string
}

export interface WritingScene {
  scene: string
  title: string
  requirements: string
  essays: WritingEssay[]
}

export interface WritingEssay {
  level: string
  score: number
  content: string
  analysis: string
}

class ReadingPracticeService {
  private cachedReading: ReadingPassage[] = []
  private cachedCloze: ClozePassage[] = []
  private cachedReadingQA: ReadingQAPassage[] = []
  private cachedMultimodal: MultimodalPassage[] = []
  private cachedWriting: WritingScene[] = []
  private loading = ref(false)

  async loadReadingData(): Promise<ReadingPassage[]> {
    if (this.cachedReading.length > 0) {
      return this.cachedReading
    }

    try {
      console.log('Loading reading data from import...')
      const data = readingStandardData as any[]
      
      if (Array.isArray(data)) {
        this.cachedReading = data.map((item, index) => ({
          id: item.id || `reading_${index}`,
          title: item.title || '',
          year: item.year || 2024,
          difficulty: item.difficulty || 'medium',
          passage: item.passage || item.content || item.article || '',
          questions: (item.questions || []).map((q: any, qIndex: number) => ({
            id: q.id || `q_${qIndex}`,
            content: q.content || q.question || '',
            options: q.options || {},
            answer: q.answer || 'A',
            analysis: q.analysis || ''
          })),
          wordCount: item.totalWordCount || Math.floor((item.passage?.length || 0) / 6),
          readingTime: item.readingTime || ''
        }))
        console.log('Loaded', this.cachedReading.length, 'reading passages')
      }
    } catch (e) {
      console.error('Error loading reading data:', e)
    }

    return this.cachedReading
  }

  async loadClozeData(): Promise<ClozePassage[]> {
    if (this.cachedCloze.length > 0) {
      return this.cachedCloze
    }

    try {
      console.log('Loading cloze data from import...')
      const data = clozeGrammarData as any[]
      
      if (Array.isArray(data)) {
        this.cachedCloze = data.map((item, index) => ({
          id: item.id || `cloze_${index}`,
          title: item.title || '',
          year: item.year || 2024,
          difficulty: item.difficulty || 'medium',
          passage: item.passage || item.content || item.article || '',
          questions: (item.exercises || item.questions || []).map((q: any, qIndex: number) => ({
            id: q.id || `q_${qIndex}`,
            position: q.position || q.position || `${qIndex + 1})`,
            options: q.options || {},
            answer: q.answer || 'A',
            analysis: q.analysis || ''
          })),
          wordCount: item.totalWordCount || Math.floor((item.passage?.length || 0) / 6),
          readingTime: item.readingTime || ''
        }))
        console.log('Loaded', this.cachedCloze.length, 'cloze passages')
      }
    } catch (e) {
      console.error('Error loading cloze data:', e)
    }

    return this.cachedCloze
  }

  async loadReadingQAData(): Promise<ReadingQAPassage[]> {
    if (this.cachedReadingQA.length > 0) {
      return this.cachedReadingQA
    }

    try {
      console.log('Loading reading QA data from import...')
      const data = readingQAData as any[]
      
      if (Array.isArray(data)) {
        this.cachedReadingQA = data.map((item, index) => ({
          id: item.id || `qa_${index}`,
          title: item.title || '',
          year: item.year || 2024,
          difficulty: item.difficulty || 'medium',
          passage: item.passage || item.content || item.article || '',
          questions: (item.questions || []).map((q: any, qIndex: number) => ({
            id: q.id || `q_${qIndex}`,
            number: q.number || qIndex + 1,
            content: q.content || q.question || '',
            sampleAnswer: q.answer || '',
            analysis: q.analysis || ''
          })),
          wordCount: item.totalWordCount || Math.floor((item.passage?.length || 0) / 6),
          readingTime: item.readingTime || ''
        }))
        console.log('Loaded', this.cachedReadingQA.length, 'reading QA passages')
      }
    } catch (e) {
      console.error('Error loading reading QA data:', e)
    }

    return this.cachedReadingQA
  }

  async loadMultimodalData(): Promise<MultimodalPassage[]> {
    if (this.cachedMultimodal.length > 0) {
      return this.cachedMultimodal
    }

    try {
      console.log('Loading multimodal data from import...')
      const data = readingMultimodalData as any
      
      if (data && data.questionsList && Array.isArray(data.questionsList)) {
        this.cachedMultimodal = data.questionsList.map((item: any, index: number) => ({
          id: item.id || `multimodal_${index}`,
          title: item.title || '',
          year: item.year || 2024,
          difficulty: item.difficulty || 'medium',
          description: item.description || '',
          media: item.media || null,
          passage: item.passage || null,
          questions: (item.questions || []).map((q: any, qIndex: number) => ({
            id: q.id || `q_${qIndex}`,
            content: q.question || '',
            options: q.options || {},
            answer: q.answer || 'A',
            analysis: q.analysis || ''
          })),
          wordCount: item.wordCount || 0,
          readingTime: item.readingTime || ''
        }))
        console.log('Loaded', this.cachedMultimodal.length, 'multimodal passages')
      }
    } catch (e) {
      console.error('Error loading multimodal data:', e)
    }

    return this.cachedMultimodal
  }

  async loadWritingData(): Promise<WritingScene[]> {
    if (this.cachedWriting.length > 0) {
      return this.cachedWriting
    }

    try {
      console.log('Loading writing data from import...')
      const data = writingEssayData as any
      
      if (data && data.sampleEssays && Array.isArray(data.sampleEssays)) {
        this.cachedWriting = data.sampleEssays.map((scene: any) => ({
          scene: scene.scene || '',
          title: scene.title || '',
          requirements: scene.requirements || '',
          essays: (scene.essays || []).map((essay: any) => ({
            level: essay.level || '',
            score: essay.score || 0,
            content: essay.content || '',
            analysis: essay.analysis || ''
          }))
        }))
        console.log('Loaded', this.cachedWriting.length, 'writing scenes')
      }
    } catch (e) {
      console.error('Error loading writing data:', e)
    }

    return this.cachedWriting
  }

  async getCounts(): Promise<Record<string, number>> {
    const [reading, cloze, readingQA, multimodal, writing] = await Promise.all([
      this.loadReadingData(),
      this.loadClozeData(),
      this.loadReadingQAData(),
      this.loadMultimodalData(),
      this.loadWritingData()
    ])

    return {
      reading: reading.length,
      cloze: cloze.length,
      reading_qa: readingQA.length,
      multimodal: multimodal.length,
      writing: writing.length
    }
  }

  clearCache() {
    this.cachedReading = []
    this.cachedCloze = []
    this.cachedReadingQA = []
    this.cachedMultimodal = []
    this.cachedWriting = []
  }
}

export const readingPracticeService = new ReadingPracticeService()
