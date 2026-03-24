import listeningData from '@/static/data/listening_questions.json'

interface ListeningQuestion {
  id: string
  year: number
  type: string
  difficulty: number
  topic: string
  audio_text: string
  question: string
  options: string[]
  correct_answer: number
  analysis: string
  tags: string[]
  source: string
}

class ListeningService {
  private questions: ListeningQuestion[] = []
  private isLoaded = false

  async loadQuestions(): Promise<void> {
    if (this.isLoaded) return
    
    console.log('Loading listening questions from import...')
    
    if (listeningData && Array.isArray(listeningData)) {
      this.questions = listeningData
      this.isLoaded = true
      console.log(`Loaded ${this.questions.length} listening questions`)
    } else {
      console.error('Failed to load listening data')
    }
  }

  getQuestions(filter?: { type?: string; topic?: string; limit?: number }): ListeningQuestion[] {
    let result = this.questions
    
    if (filter?.type) {
      result = result.filter(q => q.type === filter.type)
    }
    
    if (filter?.topic) {
      result = result.filter(q => q.topic === filter.topic)
    }
    
    if (filter?.limit && filter.limit > 0) {
      result = result.slice(0, filter.limit)
    }
    
    return result
  }

  getQuestionsByType(type: string): ListeningQuestion[] {
    return this.questions.filter(q => q.type === type)
  }

  getQuestionsByTopic(topic: string): ListeningQuestion[] {
    return this.questions.filter(q => q.topic === topic)
  }

  getQuestionsByYear(year: number): ListeningQuestion[] {
    return this.questions.filter(q => q.year === year)
  }

  getTopics(): string[] {
    const topics = new Set(this.questions.map(q => q.topic))
    return Array.from(topics).sort()
  }

  getRandomQuestions(count: number = 10): ListeningQuestion[] {
    const shuffled = [...this.questions].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }
}

export const listeningService = new ListeningService()
