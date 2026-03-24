// 存储服务 - 使用 uni.setStorage
const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  WORDS_PROGRESS: 'words_progress',
  WRONG_QUESTIONS: 'wrong_questions',
  DAILY_TASKS: 'daily_tasks',
  SETTINGS: 'settings',
  LEARNING_PLAN: 'learning_plan'
}

export const storage = {
  // 获取数据
  get<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const value = uni.getStorageSync(key)
      return value || defaultValue
    } catch (e) {
      console.error('Storage get error:', e)
      return defaultValue
    }
  },

  // 设置数据
  set<T>(key: string, value: T): boolean {
    try {
      uni.setStorageSync(key, value)
      return true
    } catch (e) {
      console.error('Storage set error:', e)
      return false
    }
  },

  // 删除数据
  remove(key: string): boolean {
    try {
      uni.removeStorageSync(key)
      return true
    } catch (e) {
      console.error('Storage remove error:', e)
      return false
    }
  },

  // 清空所有数据
  clear(): boolean {
    try {
      uni.clearStorageSync()
      return true
    } catch (e) {
      console.error('Storage clear error:', e)
      return false
    }
  }
}

export { STORAGE_KEYS }
