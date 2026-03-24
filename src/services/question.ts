import type { Question, QuestionFilter } from './types'

import questionsData from '@/static/data/questions_shanghai_full.json'
import guanciData from '@/static/data/grammar_lessons_guanci.json'
import mingciData from '@/static/data/grammar_lessons_mingci.json'
import daiciData from '@/static/data/grammar_lessons_daici.json'
import dongciyutaiData from '@/static/data/grammar_lessons_dongciyutai.json'
import dongcishitaiData from '@/static/data/grammar_lessons_dongcishitai.json'
import jiandanjuData from '@/static/data/grammar_lessons_jiandanju.json'
import fuhejuData from '@/static/data/grammar_lessons_fuheju.json'
import bijiaojiData from '@/static/data/grammar_lessons_bijiaoji.json'
import zhuweiyizhiData from '@/static/data/grammar_lessons_zhuweiyizhi.json'
import lianciData from '@/static/data/grammar_lessons_lianci.json'
import shuciData from '@/static/data/grammar_lessons_shuci.json'
import qingtaidongciData from '@/static/data/grammar_lessons_qingtaidongci.json'
import qingjingduihuaData from '@/static/data/grammar_lessons_qingjingduihua.json'
import daozhuangjuData from '@/static/data/grammar_lessons_daozhuangju.json'
import feiweiyudongciData from '@/static/data/grammar_lessons_feiweiyudongci.json'
import changnanjuData from '@/static/data/grammar_lessons_changnanju.json'
import tingliData from '@/static/data/grammar_lessons_tingli.json'
import wanxingtiankongData from '@/static/data/grammar_lessons_wanxingtiankong.json'
import zuowenData from '@/static/data/grammar_lessons_zuowen.json'
import duanyuData from '@/static/data/grammar_lessons_duanyu.json'
import yuedulijieData from '@/static/data/grammar_lessons_yuedulijie.json'

interface RawQuestion {
  id: string
  year: number
  type: string
  difficulty: string
  content: string
  options: { [key: string]: string }
  answer: string
  analysis: string
  tags: string[]
  source: string
}

interface GrammarExercise {
  question: string
  options: { [key: string]: string }
  answer: string
  explanation: string
}

interface GrammarLesson {
  id: string
  title: string
  exercises: GrammarExercise[]
}

interface GrammarTopic {
  id: string
  name: string
  lessons: GrammarLesson[]
}

const grammarDataArray = [
  guanciData,
  mingciData,
  daiciData,
  dongciyutaiData,
  dongcishitaiData,
  jiandanjuData,
  fuhejuData,
  bijiaojiData,
  zhuweiyizhiData,
  lianciData,
  shuciData,
  qingtaidongciData,
  qingjingduihuaData,
  daozhuangjuData,
  feiweiyudongciData,
  changnanjuData,
  tingliData,
  wanxingtiankongData,
  zuowenData,
  duanyuData,
  yuedulijieData
]

function getQuestionType(topicId: string): string {
  if (topicId.includes('yuedu') || topicId.includes('reading')) {
    return 'reading'
  }
  if (topicId.includes('wanxingtiankong') || topicId.includes('cloze')) {
    return 'cloze'
  }
  if (topicId.includes('qingjing') || 
      topicId.includes('dialogue') || 
      topicId.includes('situational') ||
      topicId.includes('communication')) {
    return 'dialogue'
  }
  if (topicId.includes('tingli') || topicId.includes('listen')) {
    return 'listening'
  }
  return 'single'
}

class QuestionService {
  private questions: RawQuestion[] = []
  private grammarQuestions: RawQuestion[] = []
  private isLoaded = false
  private isGrammarLoaded = false

  async loadQuestions(): Promise<void> {
    if (this.isLoaded) return
    
    console.log('Loading questions from import...')
    
    if (questionsData && Array.isArray(questionsData)) {
      this.questions = questionsData
      this.isLoaded = true
      console.log(`Loaded ${this.questions.length} real exam questions`)
    } else {
      console.error('Failed to load questions data')
    }
  }

  async loadGrammarLessons(): Promise<void> {
    if (this.isGrammarLoaded) return

    console.log('Loading grammar lessons from import...')

    try {
      for (const data of grammarDataArray as any[]) {
        if (data && data.grammar_topics) {
          const exercises = this.convertGrammarToQuestions(data.grammar_topics as any[])
          ;(this.grammarQuestions as any).push(...exercises)
        }
      }

      this.isGrammarLoaded = true
      console.log(`Loaded ${this.grammarQuestions.length} grammar exercises`)
    } catch (e) {
      console.error('Failed to load grammar lessons:', e)
    }
  }

  private convertGrammarToQuestions(topics: GrammarTopic[]): RawQuestion[] {
    const questions: RawQuestion[] = []
    let exerciseIndex = 0

    for (const topic of topics) {
      const questionType = getQuestionType(topic.id)

      for (const lesson of topic.lessons || []) {
        for (const exercise of lesson.exercises || []) {
          const questionId = `${lesson.id}_exercise_${exerciseIndex}`

          const question: RawQuestion = {
            id: questionId,
            year: 2024,
            type: questionType,
            difficulty: 'medium',
            content: exercise.question,
            options: exercise.options || {},
            answer: exercise.answer,
            analysis: exercise.explanation,
            tags: [topic.id, lesson.id],
            source: 'grammar_lesson'
          }

          questions.push(question)
          exerciseIndex++
        }
      }
    }

    return questions
  }

  async loadAll(): Promise<void> {
    await Promise.all([
      this.loadQuestions(),
      this.loadGrammarLessons()
    ])
  }

  getQuestions(filter?: QuestionFilter): Question[] {
    const allQuestions = [...this.questions, ...this.grammarQuestions]
    let result = allQuestions
    
    if (filter) {
      if (filter.year) {
        result = result.filter(q => q.year === filter.year)
      }
      if (filter.type) {
        result = result.filter(q => q.type === filter.type)
      }
      if (filter.difficulty) {
        result = result.filter(q => q.difficulty === filter.difficulty)
      }
    }
    
    return result.map(q => this.transformQuestion(q))
  }

  getAllQuestions(): Question[] {
    return this.getQuestions()
  }

  getRandomQuestions(count: number = 10): Question[] {
    const allQuestions = [...this.questions, ...this.grammarQuestions]
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count).map(q => this.transformQuestion(q))
  }

  getQuestionsByYear(year: number): Question[] {
    return this.getQuestions({ year })
  }

  getQuestionsByType(type: string): Question[] {
    return this.getQuestions({ type })
  }

  getQuestionsByTopic(topic: string): Question[] {
    const allQuestions = [...this.questions, ...this.grammarQuestions]
    return allQuestions
      .filter(q => q.tags && q.tags.some(t => t.includes(topic)))
      .map(q => this.transformQuestion(q))
  }

  getQuestionTypes(): string[] {
    const allQuestions = [...this.questions, ...this.grammarQuestions]
    const types = new Set(allQuestions.map(q => q.type))
    return Array.from(types).sort()
  }

  getQuestionCountsByType(): {id: string, name: string, count: number}[] {
    const allQuestions = [...this.questions, ...this.grammarQuestions]
    const typeCounts: Record<string, number> = {}
    
    allQuestions.forEach(q => {
      typeCounts[q.type] = (typeCounts[q.type] || 0) + 1
    })
    
    const typeNames: Record<string, string> = {
      'single': '单选题',
      'reading': '阅读理解',
      'cloze': '完形填空',
      'dialogue': '情景对话',
      'listening': '听力'
    }
    
    return Object.entries(typeCounts).map(([id, count]) => ({
      id,
      name: typeNames[id] || id,
      count
    }))
  }

  getQuestionsByTag(tag: string): Question[] {
    const allQuestions = [...this.questions, ...this.grammarQuestions]
    return allQuestions
      .filter(q => q.tags && q.tags.includes(tag))
      .map(q => this.transformQuestion(q))
  }

  getYears(): number[] {
    const allQuestions = [...this.questions, ...this.grammarQuestions]
    const years = new Set(allQuestions.map(q => q.year))
    return Array.from(years).sort((a, b) => b - a)
  }

  getTags(): string[] {
    const allQuestions = [...this.questions, ...this.grammarQuestions]
    const tags = new Set<string>()
    allQuestions.forEach(q => {
      if (q.tags) {
        q.tags.forEach(t => tags.add(t))
      }
    })
    return Array.from(tags).sort()
  }

  private transformQuestion(raw: RawQuestion): Question {
    const optionEntries = Object.entries(raw.options || {})
    const correctIndex = optionEntries.findIndex(([key]) => key === raw.answer)
    const optionsArray = optionEntries.map(([key, value]) => value)
    
    return {
      id: raw.id,
      year: raw.year,
      type: raw.type,
      difficulty: raw.difficulty,
      question: raw.content,
      content: raw.content,
      options: optionsArray,
      answer: raw.answer,
      analysis: raw.analysis,
      tags: raw.tags || [],
      source: raw.source,
      correctIndex: correctIndex >= 0 ? correctIndex : 0
    }
  }
}

export const questionService = new QuestionService()
