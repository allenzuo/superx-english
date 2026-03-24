import type { Question } from './types'

export interface WrongQuestion {
  id: string
  questionId: string
  question: string
  options: string[]
  yourAnswer: string
  correctAnswer: string
  explanation: string
  type: string
  date: string
  reviewed: boolean
  mastery: 'unmastered' | 'mastering' | 'mastered'
  reviewCount: number
  lastReviewTime: string | null
  nextReviewDate: string | null
  tags: string[]
}

const STORAGE_KEY = 'wrong_questions'
const REVIEW_INTERVALS = [1, 3, 7, 14, 30]

class WrongQuestionService {
  private questions: WrongQuestion[] = []
  private isLoaded = false

  loadQuestions(): void {
    if (this.isLoaded) return
    try {
      const saved = uni.getStorageSync(STORAGE_KEY)
      if (saved && Array.isArray(saved)) {
        this.questions = saved
      }
      this.isLoaded = true
    } catch (e) {
      console.error('Load wrong questions error:', e)
      this.questions = []
    }
  }

  private save(): void {
    uni.setStorageSync(STORAGE_KEY, this.questions)
  }

  getQuestions(): WrongQuestion[] {
    this.loadQuestions()
    return this.questions
  }

  getCount(filter?: { mastery?: string }): number {
    this.loadQuestions()
    if (!filter) return this.questions.length
    if (filter.mastery) {
      return this.questions.filter(q => q.mastery === filter.mastery).length
    }
    return this.questions.length
  }

  getQuestionsByMastery(mastery: 'unmastered' | 'mastering' | 'mastered'): WrongQuestion[] {
    this.loadQuestions()
    return this.questions
      .filter(q => q.mastery === mastery)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  addWrongQuestion(question: Question, userAnswer: string): void {
    this.loadQuestions()
    const existingIndex = this.questions.findIndex(q => q.questionId === question.id)
    const now = new Date().toISOString()
    
    if (existingIndex >= 0) {
      const existing = this.questions[existingIndex]
      existing.reviewCount += 1
      existing.lastReviewTime = now
      existing.yourAnswer = userAnswer
      const intervalIndex = Math.min(existing.reviewCount - 1, REVIEW_INTERVALS.length - 1)
      const nextDate = new Date()
      nextDate.setDate(nextDate.getDate() + REVIEW_INTERVALS[intervalIndex])
      existing.nextReviewDate = nextDate.toISOString()
      this.questions[existingIndex] = existing
    } else {
      const wrongQuestion: WrongQuestion = {
        id: this.generateId(),
        questionId: question.id,
        question: question.question,
        options: question.options as any,
        yourAnswer: userAnswer,
        correctAnswer: question.options[question.correctIndex || 0] || '',
        explanation: question.analysis || '',
        type: question.type,
        date: now,
        reviewed: false,
        mastery: 'unmastered',
        reviewCount: 1,
        lastReviewTime: now,
        nextReviewDate: null,
        tags: question.tags || []
      }
      this.questions.push(wrongQuestion)
    }
    this.save()
  }

  deleteWrongQuestion(questionId: string): void {
    this.loadQuestions()
    this.questions = this.questions.filter(q => q.questionId !== questionId)
    this.save()
  }

  updateMastery(questionId: string, mastery: 'unmastered' | 'mastering' | 'mastered'): void {
    this.loadQuestions()
    const question = this.questions.find(q => q.questionId === questionId)
    if (question) {
      question.mastery = mastery
      question.reviewed = mastery === 'mastered'
      question.lastReviewTime = new Date().toISOString()
      this.save()
    }
  }

  markAsMastered(questionId: string): void {
    this.updateMastery(questionId, 'mastered')
  }

  getUnmasteredCount(): number {
    return this.getQuestionsByMastery('unmastered').length
  }

  getMasteredCount(): number {
    return this.getQuestionsByMastery('mastered').length
  }

  markAllMastered(questionIds: string[]): void {
    this.loadQuestions()
    questionIds.forEach(id => {
      const question = this.questions.find(q => q.questionId === id)
      if (question) {
        question.mastery = 'mastered'
        question.reviewed = true
      }
    })
    this.save()
  }

  removeWrongQuestion(questionId: string): void {
    this.loadQuestions()
    this.questions = this.questions.filter(q => q.questionId !== questionId)
    this.save()
  }

  getReviewableQuestions(): WrongQuestion[] {
    this.loadQuestions()
    const now = new Date()
    return this.questions
      .filter(q => {
        if (q.mastery === 'mastered') return false
        if (!q.nextReviewDate) return true
        return new Date(q.nextReviewDate) <= now
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  clearAll(): void {
    this.questions = []
    this.save()
  }

  private generateId(): string {
    return 'wrong_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }
}

export const wrongQuestionService = new WrongQuestionService()
