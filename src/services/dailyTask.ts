import type { Question } from './types'

const DAILY_TASK_KEY = 'daily_task_data'
const PRACTICE_STATS_KEY = 'practice_stats'

interface DailyTask {
  type: string
  target: number
  completed: number
  questionIds: string[]
}

interface DailyTaskData {
  date: string
  tasks: DailyTask[]
}

class DailyTaskService {
  private todayTasks: DailyTask[] = []
  
  getTodayTasks(): DailyTask[] {
    const saved = uni.getStorageSync(DAILY_TASK_KEY)
    const today = this.getTodayDate()
    
    if (saved && saved.date === today) {
      this.todayTasks = saved.tasks
      return this.todayTasks
    }
    
    // Generate new daily tasks
    this.todayTasks = this.generateDailyTasks()
    this.saveTasks()
    return this.todayTasks
  }
  
  private generateDailyTasks(): DailyTask[] {
    return [
      { type: 'single', target: 5, completed: 0, questionIds: [] },
      { type: 'reading', target: 2, completed: 0, questionIds: [] },
      { type: '完形填空', target: 3, completed: 0, questionIds: [] },
      { type: 'dialogue', target: 2, completed: 0, questionIds: [] }
    ]
  }
  
  updateTaskProgress(type: string, correctCount: number): void {
    const task = this.todayTasks.find(t => t.type === type)
    if (task) {
      task.completed = Math.min(task.completed + correctCount, task.target)
      this.saveTasks()
    }
  }
  
  isTaskCompleted(type: string): boolean {
    const task = this.todayTasks.find(t => t.type === type)
    return task ? task.completed >= task.target : false
  }
  
  getCompletedCount(): number {
    return this.todayTasks.filter(t => t.completed >= t.target).length
  }
  
  private saveTasks(): void {
    const data: DailyTaskData = {
      date: this.getTodayDate(),
      tasks: this.todayTasks
    }
    uni.setStorageSync(DAILY_TASK_KEY, data)
  }
  
  private getTodayDate(): string {
    const now = new Date()
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
  }
}

class PracticeStats {
  total: number = 0
  correct: number = 0
  streak: number = 0
  
  load(): PracticeStats {
    const saved = uni.getStorageSync(PRACTICE_STATS_KEY)
    if (saved) {
      this.total = saved.total || 0
      this.correct = saved.correct || 0
      this.streak = saved.streak || 0
    }
    return this
  }
  
  save(): void {
    uni.setStorageSync(PRACTICE_STATS_KEY, {
      total: this.total,
      correct: this.correct,
      streak: this.streak
    })
  }
  
  addResult(correct: boolean): void {
    this.total++
    if (correct) {
      this.correct++
      this.streak++
    } else {
      this.streak = 0
    }
    this.save()
  }
  
  getAccuracy(): number {
    return this.total > 0 ? Math.round((this.correct / this.total) * 100) : 0
  }
}

export const dailyTaskService = new DailyTaskService()
export const practiceStats = new PracticeStats()
