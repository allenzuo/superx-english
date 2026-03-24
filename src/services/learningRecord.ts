// 统一的学习记录服务
import { reactive } from 'vue'

interface DailyRecord {
  date: string // YYYY-MM-DD
  wordsLearned: number
  wordsReviewed: number
  wrongCount: number
  listeningTime: number // 分钟
  readingCount: number
  grammarCount: number
  writingCount: number
  totalTime: number // 分钟
  completed: boolean
}

interface LearningStats {
  totalWordsLearned: number
  totalTime: number
  streakDays: number
  lastStudyDate: string
  records: DailyRecord[]
}

const STORAGE_KEY = 'learning_records'

class LearningRecordService {
  private stats: LearningRecord

  constructor() {
    this.stats = this.loadStats()
  }

  private loadStats(): LearningRecord {
    const saved = uni.getStorageSync(STORAGE_KEY)
    if (saved) {
      return { ...defaultStats, ...saved }
    }
    return { ...defaultStats }
  }

  private saveStats() {
    uni.setStorageSync(STORAGE_KEY, this.stats)
  }

  // 获取今天的记录
  getTodayRecord(): DailyRecord {
    const today = this.getDateString()
    const record = this.stats.records.find(r => r.date === today)
    if (record) return record
    
    const newRecord: DailyRecord = {
      date: today,
      wordsLearned: 0,
      wordsReviewed: 0,
      wrongCount: 0,
      listeningTime: 0,
      readingCount: 0,
      grammarCount: 0,
      writingCount: 0,
      totalTime: 0,
      completed: false
    }
    this.stats.records.push(newRecord)
    this.saveStats()
    return newRecord
  }

  // 更新今天的学习记录
  updateTodayRecord(updates: Partial<DailyRecord>) {
    const today = this.getDateString()
    const record = this.stats.records.find(r => r.date === today)
    
    if (record) {
      Object.assign(record, updates)
    } else {
      const newRecord: DailyRecord = {
        date: today,
        wordsLearned: 0,
        wordsReviewed: 0,
        wrongCount: 0,
        listeningTime: 0,
        readingCount: 0,
        grammarCount: 0,
        writingCount: 0,
        totalTime: 0,
        completed: false,
        ...updates
      }
      this.stats.records.push(newRecord)
    }
    
    this.updateStreak()
    this.saveStats()
    return this.getTodayRecord()
  }

  // 增加单词学习
  addWordsLearned(count: number) {
    const record = this.getTodayRecord()
    record.wordsLearned += count
    this.stats.totalWordsLearned += count
    this.saveStats()
  }

  // 增加错题
  addWrongQuestion(count: number = 1) {
    const record = this.getTodayRecord()
    record.wrongCount += count
    this.saveStats()
  }

  // 增加学习时间
  addStudyTime(minutes: number) {
    const record = this.getTodayRecord()
    record.totalTime += minutes
    this.stats.totalTime += minutes
    this.saveStats()
  }

  // 标记今日完成
  markCompleted() {
    const record = this.getTodayRecord()
    record.completed = true
    this.updateStreak()
    this.saveStats()
  }

  // 更新连续学习天数
  private updateStreak() {
    const today = this.getDateString()
    const yesterday = this.getDateString(-1)
    
    const todayRecord = this.stats.records.find(r => r.date === today)
    const yesterdayRecord = this.stats.records.find(r => r.date === yesterday)
    
    if (todayRecord && todayRecord.completed) {
      if (yesterdayRecord && yesterdayRecord.completed) {
        this.stats.streakDays++
      } else if (this.stats.streakDays === 0) {
        this.stats.streakDays = 1
      }
    }
    
    this.stats.lastStudyDate = today
  }

  // 获取连续学习天数
  getStreakDays(): number {
    this.updateStreak()
    return this.stats.streakDays
  }

  // 获取历史记录
  getHistory(days: number = 7): DailyRecord[] {
    const records = [...this.stats.records].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    return records.slice(0, days)
  }

  // 获取统计数据
  getStats(): LearningRecord {
    return { ...this.stats }
  }

  // 重置统计数据
  resetStats() {
    this.stats = { ...defaultStats }
    this.saveStats()
  }

  // 导出数据（备份）
  exportData(): string {
    return JSON.stringify(this.stats)
  }

  // 导入数据（恢复）
  importData(jsonString: string) {
    try {
      const data = JSON.parse(jsonString)
      this.stats = { ...defaultStats, ...data }
      this.saveStats()
      return true
    } catch (e) {
      console.error('Import failed:', e)
      return false
    }
  }

  private getDateString(daysOffset: number = 0): string {
    const date = new Date()
    date.setDate(date.getDate() + daysOffset)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}

const defaultStats: LearningRecord = {
  totalWordsLearned: 0,
  totalTime: 0,
  streakDays: 0,
  lastStudyDate: '',
  records: []
}

interface LearningRecord {
  totalWordsLearned: number
  totalTime: number
  streakDays: number
  lastStudyDate: string
  records: DailyRecord[]
}

export const learningRecord = new LearningRecordService()
