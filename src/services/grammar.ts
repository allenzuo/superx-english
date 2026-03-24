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

export interface GrammarTopic {
  id: string
  name: string
  icon: string
  color: string
  lessons: GrammarLesson[]
}

export interface GrammarLesson {
  id: string
  title: string
  content: string
  examples: GrammarExample[]
  exercises: GrammarExercise[]
}

export interface GrammarExample {
  sentence: string
  translation: string
  analysis: string
}

export interface GrammarExercise {
  question: string
  options: { [key: string]: string }
  answer: string
  explanation: string
}

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

class GrammarService {
  private topics: GrammarTopic[] = []
  private isLoaded = false

  async loadGrammar(): Promise<void> {
    if (this.isLoaded) return
    
    console.log('Loading grammar topics from import...')
    
    try {
      for (const data of grammarDataArray as any[]) {
        if (data && data.grammar_topics) {
          ;(this.topics as any).push(...data.grammar_topics)
        }
      }
      
      this.isLoaded = true
      console.log(`Loaded ${this.topics.length} grammar topics`)
    } catch (e) {
      console.error('Failed to load grammar:', e)
    }
  }

  getTopics(): GrammarTopic[] {
    return this.topics
  }

  getTopicById(id: string): GrammarTopic | undefined {
    return this.topics.find(t => t.id === id)
  }

  getLessonsByTopicId(topicId: string): GrammarLesson[] {
    const topic = this.getTopicById(topicId)
    return topic?.lessons || []
  }

  getLessonById(topicId: string, lessonId: string): GrammarLesson | undefined {
    const lessons = this.getLessonsByTopicId(topicId)
    return lessons.find(l => l.id === lessonId)
  }
}

export const grammarService = new GrammarService()
