import type { Question } from './types'
import bijiaojiData from '@/static/data/grammar_lessons_bijiaoji.json'
import changnanjuData from '@/static/data/grammar_lessons_changnanju.json'
import daiciData from '@/static/data/grammar_lessons_daici.json'
import daozhuangjuData from '@/static/data/grammar_lessons_daozhuangju.json'
import dongcishitaiData from '@/static/data/grammar_lessons_dongcishitai.json'
import dongciyutaiData from '@/static/data/grammar_lessons_dongciyutai.json'
import duanyuData from '@/static/data/grammar_lessons_duanyu.json'
import feiweiyudongciData from '@/static/data/grammar_lessons_feiweiyudongci.json'
import fuhejuData from '@/static/data/grammar_lessons_fuheju.json'
import guanciData from '@/static/data/grammar_lessons_guanci.json'
import jiandanjuData from '@/static/data/grammar_lessons_jiandanju.json'
import lianciData from '@/static/data/grammar_lessons_lianci.json'
import mingciData from '@/static/data/grammar_lessons_mingci.json'
import qingjingduihuaData from '@/static/data/grammar_lessons_qingjingduihua.json'
import qingtaidongciData from '@/static/data/grammar_lessons_qingtaidongci.json'
import shuciData from '@/static/data/grammar_lessons_shuci.json'
import tingliData from '@/static/data/grammar_lessons_tingli.json'
import wanxingtiankongData from '@/static/data/grammar_lessons_wanxingtiankong.json'
import yuedulijieData from '@/static/data/grammar_lessons_yuedulijie.json'
import zhuweiyizhiData from '@/static/data/grammar_lessons_zhuweiyizhi.json'
import zuowenData from '@/static/data/grammar_lessons_zuowen.json'

const grammarDataArray = [
  bijiaojiData,
  changnanjuData,
  daiciData,
  daozhuangjuData,
  dongcishitaiData,
  dongciyutaiData,
  duanyuData,
  feiweiyudongciData,
  fuhejuData,
  guanciData,
  jiandanjuData,
  lianciData,
  mingciData,
  qingjingduihuaData,
  qingtaidongciData,
  shuciData,
  tingliData,
  wanxingtiankongData,
  yuedulijieData,
  zhuweiyizhiData,
  zuowenData
]

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

class GrammarExerciseService {
  private exercises: Question[] = []
  private isLoaded = false

  async loadAllExercises(): Promise<void> {
    if (this.isLoaded) return
    
    const allExercises: Question[] = []
    let idCounter = 1
    
    for (const data of grammarDataArray as any[]) {
      try {
        if (data && data.grammar_topics) {
          const topics: GrammarTopic[] = data.grammar_topics
          
          for (const topic of topics) {
            if (topic.lessons) {
              for (const lesson of topic.lessons) {
                if (lesson.exercises) {
                  for (const exercise of lesson.exercises) {
                    const optionKeys = Object.keys(exercise.options || {})
                    const correctIndex = optionKeys.findIndex(k => k === exercise.answer)
                    const optionsArray = optionKeys.map(k => exercise.options[k])
                    
                    allExercises.push({
                      id: `grammar_${idCounter++}`,
                      year: 2024,
                      type: 'grammar',
                      difficulty: 'medium',
                      question: exercise.question,
                      content: exercise.question,
                      options: optionsArray,
                      answer: exercise.answer,
                      analysis: exercise.explanation,
                      tags: [topic.name],
                      source: data._fileName || 'grammar',
                      correctIndex: correctIndex >= 0 ? correctIndex : 0
                    })
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('Failed to load grammar exercises:', e)
      }
    }
    
    this.exercises = allExercises
    this.isLoaded = true
    console.log(`Loaded ${this.exercises.length} grammar exercises`)
  }

  getExercises(filter?: { tag?: string; limit?: number }): Question[] {
    let result = this.exercises
    
    if (filter?.tag) {
      result = result.filter(q => 
        q.tags?.some(t => t.includes(filter.tag!))
      )
    }
    
    if (filter?.limit && filter.limit > 0) {
      result = result.slice(0, filter.limit)
    }
    
    return result
  }

  getRandomExercises(count: number = 10): Question[] {
    const shuffled = [...this.exercises].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(count, shuffled.length))
  }

  getAllTags(): string[] {
    const tags = new Set<string>()
    this.exercises.forEach(q => {
      q.tags?.forEach(t => tags.add(t))
    })
    return Array.from(tags)
  }

  getExerciseCount(): number {
    return this.exercises.length
  }
}

export const grammarExerciseService = new GrammarExerciseService()
