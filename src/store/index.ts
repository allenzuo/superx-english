import { reactive } from 'vue'

interface UserProfile {
  name: string
  grade: number
  totalWords: number
  learnedWords: number
  wrongQuestions: number
  streakDays: number
}

interface State {
  profile: UserProfile
  isLoggedIn: boolean
}

const defaultProfile: UserProfile = {
  name: '学生',
  grade: 3,
  totalWords: 0,
  learnedWords: 0,
  wrongQuestions: 0,
  streakDays: 0
}

export const store = reactive<State>({
  profile: { ...defaultProfile },
  isLoggedIn: false
})

export const userStore = {
  // 加载用户信息
  loadProfile() {
    const saved = uni.getStorageSync('user_profile')
    if (saved) {
      store.profile = { ...defaultProfile, ...saved }
      store.isLoggedIn = true
    }
  },

  // 保存用户信息
  saveProfile(profile: Partial<UserProfile>) {
    store.profile = { ...store.profile, ...profile }
    uni.setStorageSync('user_profile', store.profile)
    store.isLoggedIn = true
  },

  // 更新学习进度
  updateProgress(learnedWords: number) {
    store.profile.learnedWords = learnedWords
    uni.setStorageSync('user_profile', store.profile)
  },

  // 增加错题数
  addWrongQuestion() {
    store.profile.wrongQuestions++
    uni.setStorageSync('user_profile', store.profile)
  },

  // 更新连续学习天数
  updateStreak(days: number) {
    store.profile.streakDays = days
    uni.setStorageSync('user_profile', store.profile)
  },

  // 登出
  logout() {
    store.profile = { ...defaultProfile }
    store.isLoggedIn = false
    uni.removeStorageSync('user_profile')
  }
}
