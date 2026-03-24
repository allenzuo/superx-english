import type { UserProfile, PracticeStats, DailyTask, WrongQuestion, WeakPoint } from './types'

const PROFILE_KEY = 'user_profile'
const PRACTICE_STATS_KEY = 'practice_stats'
const DAILY_TASK_KEY = 'daily_task'
const WRONG_QUESTIONS_KEY = 'wrong_questions'
const WEAK_POINTS_KEY = 'weak_points'
const LEARNED_WORDS_KEY = 'learned_words'
const DIAGNOSIS_HISTORY_KEY = 'diagnosis_history'

const EXP_PER_CORRECT = 5
const EXP_STREAK_BONUS = 3
const EXP_WRONG = 2
const EXP_PER_LEVEL = 100

function getLevelFromExp(exp: number): number {
  return Math.floor(Math.sqrt(exp / EXP_PER_LEVEL)) + 1
}

function getExpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * EXP_PER_LEVEL
}

class UserService {
  getProfile(): UserProfile {
    const saved = uni.getStorageSync(PROFILE_KEY)
    if (saved) return saved
    return this.createDefaultProfile()
  }

  createDefaultProfile(): UserProfile {
    const profile: UserProfile = {
      id: 1,
      name: '学生',
      avatar: '',
      level: 1,
      exp: 0,
      grade: '七年级',
      school: '',
      target_school: '',
      study_goal: '',
      total_study_time: 0,
      total_questions: 0,
      correct_rate: 0,
      streak_days: 0,
      last_study_date: '',
      created_at: new Date().toISOString(),
      tags: [],
      word_tags: {}
    }
    this.saveProfile(profile)
    return profile
  }

  saveProfile(profile: UserProfile): void {
    uni.setStorageSync(PROFILE_KEY, profile)
  }

  updateProfile(updates: Partial<UserProfile>): UserProfile {
    const profile = this.getProfile()
    const updated = { ...profile, ...updates }
    this.saveProfile(updated)
    return updated
  }

  getLevel(): number {
    const profile = this.getProfile()
    return profile.level
  }

  getExp(): number {
    const profile = this.getProfile()
    return profile.exp
  }

  getExpToNextLevel(): number {
    const profile = this.getProfile()
    const nextLevelExp = getExpForLevel(profile.level + 1)
    return nextLevelExp - profile.exp
  }

  getLevelProgress(): number {
    const profile = this.getProfile()
    const currentLevelExp = getExpForLevel(profile.level)
    const nextLevelExp = getExpForLevel(profile.level + 1)
    const progress = (profile.exp - currentLevelExp) / (nextLevelExp - currentLevelExp)
    return Math.min(1, Math.max(0, progress))
  }

  addExp(amount: number): { leveledUp: boolean; newLevel: number } {
    const profile = this.getProfile()
    const newExp = profile.exp + amount
    const newLevel = getLevelFromExp(newExp)
    const leveledUp = newLevel > profile.level
    
    this.updateProfile({
      exp: newExp,
      level: newLevel
    })

    return { leveledUp, newLevel }
  }

  updateStudyStats(correctCount: number, totalCount: number, studyTimeMinutes: number = 0): void {
    const profile = this.getProfile()
    const newTotalQuestions = profile.total_questions + totalCount
    const newCorrectCount = Math.round(profile.correct_rate * profile.total_questions) + correctCount
    const newCorrectRate = newTotalQuestions > 0 ? newCorrectCount / newTotalQuestions : 0
    
    const today = new Date().toISOString().split('T')[0]
    const lastDate = profile.last_study_date
    
    let newStreak = profile.streak_days
    if (lastDate) {
      const lastStudyDate = new Date(lastDate)
      const todayDate = new Date(today)
      const diffDays = Math.floor((todayDate.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        newStreak += 1
      } else if (diffDays > 1) {
        newStreak = 1
      }
    } else {
      newStreak = 1
    }

    this.updateProfile({
      total_questions: newTotalQuestions,
      correct_rate: newCorrectRate,
      total_study_time: profile.total_study_time + studyTimeMinutes,
      streak_days: newStreak,
      last_study_date: today
    })
  }

  getLearnedWords(): string[] {
    return uni.getStorageSync(LEARNED_WORDS_KEY) || []
  }

  setLearnedWords(wordIds: string[]): void {
    uni.setStorageSync(LEARNED_WORDS_KEY, wordIds)
  }

  addLearnedWord(wordId: string): void {
    const words = this.getLearnedWords()
    if (!words.includes(wordId)) {
      words.push(wordId)
      this.setLearnedWords(words)
    }
  }
}

class PracticeStatsService {
  getStats(): PracticeStats {
    const saved = uni.getStorageSync(PRACTICE_STATS_KEY)
    if (saved) return saved
    return { total: 0, correct: 0, accuracy: 0 }
  }

  recordAnswer(isCorrect: boolean): void {
    const stats = this.getStats()
    stats.total++
    if (isCorrect) stats.correct++
    stats.accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
    uni.setStorageSync(PRACTICE_STATS_KEY, stats)
  }

  reset(): void {
    uni.removeStorageSync(PRACTICE_STATS_KEY)
  }
}

class DailyTaskService {
  getTodayTasks(): DailyTask[] {
    const saved = uni.getStorageSync(DAILY_TASK_KEY)
    if (saved && saved.date === new Date().toISOString().split('T')[0]) {
      return saved.tasks
    }
    return this.createDailyTasks()
  }

  createDailyTasks(): DailyTask[] {
    const today = new Date().toISOString().split('T')[0]
    const tasks: DailyTask[] = [
      { id: '1', date: today, task_type: 'do_single', target: 5, progress: 0, completed: false, exp_reward: 25 },
      { id: '2', date: today, task_type: 'do_reading', target: 2, progress: 0, completed: false, exp_reward: 20 },
      { id: '3', date: today, task_type: 'do_cloze', target: 3, progress: 0, completed: false, exp_reward: 20 },
      { id: '4', date: today, task_type: 'learn_words', target: 30, progress: 0, completed: false, exp_reward: 30 }
    ]
    uni.setStorageSync(DAILY_TASK_KEY, { date: today, tasks })
    return tasks
  }

  updateTaskProgress(taskType: string, progress: number): void {
    const saved = uni.getStorageSync(DAILY_TASK_KEY)
    if (!saved) return
    
    const tasks = saved.tasks as DailyTask[]
    const task = tasks.find(t => t.task_type === taskType)
    if (task) {
      task.progress = Math.min(task.progress + progress, task.target)
      task.completed = task.progress >= task.target
      uni.setStorageSync(DAILY_TASK_KEY, saved)
    }
  }

  getTaskCompletionStats(): { completed: number; total: number } {
    const tasks = this.getTodayTasks()
    const completed = tasks.filter(t => t.completed).length
    return { completed, total: tasks.length }
  }
}

class WrongQuestionService {
  getQuestions(): WrongQuestion[] {
    return uni.getStorageSync(WRONG_QUESTIONS_KEY) || []
  }

  addQuestion(question: WrongQuestion): void {
    const questions = this.getQuestions()
    const exists = questions.find(q => q.question_id === question.question_id)
    if (!exists) {
      questions.push(question)
      uni.setStorageSync(WRONG_QUESTIONS_KEY, questions)
    }
  }

  removeQuestion(id: string): void {
    const questions = this.getQuestions().filter(q => q.id !== id)
    uni.setStorageSync(WRONG_QUESTIONS_KEY, questions)
  }

  updateMastery(id: string, mastery: WrongQuestion['mastery']): void {
    const questions = this.getQuestions()
    const question = questions.find(q => q.id === id)
    if (question) {
      question.mastery = mastery
      question.review_count++
      question.last_review_time = new Date().toISOString()
      uni.setStorageSync(WRONG_QUESTIONS_KEY, questions)
    }
  }

  getUnmasteredCount(): number {
    return this.getQuestions().filter(q => q.mastery !== 'mastered').length
  }
}

class WeakPointService {
  getWeakPoints(): WeakPoint[] {
    return uni.getStorageSync(WEAK_POINTS_KEY) || []
  }

  recordError(tag: string): void {
    const points = this.getWeakPoints()
    let point = points.find(p => p.tag === tag)
    
    if (point) {
      point.error_count++
      point.total_count++
      point.correct_rate = (point.total_count - point.error_count) / point.total_count
      point.priority = this.calculatePriority(point.correct_rate)
      point.updated_at = new Date().toISOString()
    } else {
      point = {
        id: 'wp_' + Date.now(),
        tag: tag,
        error_count: 1,
        total_count: 1,
        correct_rate: 0,
        priority: 5,
        updated_at: new Date().toISOString()
      }
      points.push(point)
    }
    
    uni.setStorageSync(WEAK_POINTS_KEY, points)
  }

  recordCorrect(tag: string): void {
    const points = this.getWeakPoints()
    let point = points.find(p => p.tag === tag)
    
    if (point) {
      point.total_count++
      point.correct_rate = (point.total_count - point.error_count) / point.total_count
      point.priority = this.calculatePriority(point.correct_rate)
      point.updated_at = new Date().toISOString()
      uni.setStorageSync(WEAK_POINTS_KEY, points)
    }
  }

  private calculatePriority(correctRate: number): number {
    if (correctRate < 0.3) return 5
    if (correctRate < 0.5) return 4
    if (correctRate < 0.7) return 3
    if (correctRate < 0.9) return 2
    return 1
  }

  getTopWeakPoints(limit: number = 3): WeakPoint[] {
    return this.getWeakPoints()
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit)
  }
}

export const userService = new UserService()
export const practiceStatsService = new PracticeStatsService()
export const dailyTaskService = new DailyTaskService()
export const wrongQuestionService = new WrongQuestionService()
export const weakPointService = new WeakPointService()

export { EXP_PER_CORRECT, EXP_STREAK_BONUS, EXP_WRONG }
