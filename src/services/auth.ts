import { learningRecord } from './learningRecord'

interface UserProfile {
  id: string
  username: string
  nickname: string
  avatar: string
  grade: number
  school: string
  exp: number
  level: number
  vip: boolean
  vipExpire: string
  learnedWords: number
  wrongQuestions: number
  streakDays: number
  createdAt: string
}

interface LoginResult {
  success: boolean
  user?: UserProfile
  token?: string
  error?: string
}

const STORAGE_KEY = 'user_profile'
const TOKEN_KEY = 'auth_token'
const WRONG_QUESTIONS_KEY = 'wrong_questions'
const LEARNING_RECORDS_KEY = 'learning_records'

const isWeixin = typeof uni !== 'undefined' && uni.getSystemInfoSync().platform === 'devtools'

class AuthService {
  private currentUser: UserProfile | null = null

  initDemoData() {
    const existingWrong = uni.getStorageSync(WRONG_QUESTIONS_KEY)
    if (!existingWrong || existingWrong.length === 0) {
      const demoWrongQuestions = [
        { id: 1, type: 'grammar', knowledge: '定语从句', question: 'The book ___ I bought yesterday is very interesting.', options: { A: 'who', B: 'which', C: 'whom', D: 'whose' }, correct: 'B', userAnswer: 'A', wrongReason: '定语从句关系代词选择错误' },
        { id: 2, type: 'grammar', knowledge: '定语从句', question: 'This is the only room ___ we can use.', options: { A: 'which', B: 'that', C: 'what', D: 'where' }, correct: 'B', userAnswer: 'A', wrongReason: 'that在定语从句中的用法' },
        { id: 3, type: 'grammar', knowledge: '名词性从句', question: '___ he says is not true.', options: { A: 'What', B: 'That', C: 'Which', D: 'Who' }, correct: 'A', userAnswer: 'B', wrongReason: '主语从句连接词选择' },
        { id: 4, type: 'vocabulary', knowledge: '词义辨析', question: 'The weather ___ our mood.', options: { A: 'effects', B: 'affects', C: 'efforts', D: 'attempts' }, correct: 'B', userAnswer: 'A', wrongReason: 'effect/affect混淆' },
        { id: 5, type: 'vocabulary', knowledge: '词义辨析', question: 'She is a very ___ student.', options: { A: 'hard-working', B: 'hardworking', C: 'hard working', D: 'hardworking' }, correct: 'B', userAnswer: 'A', wrongReason: '单词拼写错误' },
        { id: 6, type: 'reading', knowledge: '细节理解', question: 'What is the main idea of the passage?', options: { A: 'A', B: 'B', C: 'C', D: 'D' }, correct: 'C', userAnswer: 'B', wrongReason: '阅读理解细节定位错误' },
        { id: 7, type: 'listening', knowledge: '主旨大意', question: 'What are they mainly talking about?', options: { A: 'A', B: 'B', C: 'C', D: 'D' }, correct: 'A', userAnswer: 'D', wrongReason: '听力主旨理解偏差' },
        { id: 8, type: 'writing', knowledge: '句型表达', question: 'Write a sentence using "although"', answer: 'Although he was tired, he still worked hard.', wrongReason: '句型结构不完整' },
        { id: 9, type: 'cloze', knowledge: '上下文推理', question: 'The blank should be filled with ___', options: { A: 'quickly', B: 'quick', C: 'more quick', D: 'most quick' }, correct: 'B', userAnswer: 'A', wrongReason: '形容词副词使用错误' },
        { id: 10, type: 'grammar', knowledge: '时态', question: 'By next year, she ___ here for five years.', options: { A: 'will have worked', B: 'will work', C: 'works', D: 'worked' }, correct: 'A', userAnswer: 'B', wrongReason: '将来完成时掌握不牢' }
      ]
      uni.setStorageSync(WRONG_QUESTIONS_KEY, demoWrongQuestions)
    }

    const existingRecords = uni.getStorageSync(LEARNING_RECORDS_KEY)
    if (!existingRecords || existingRecords.length === 0) {
      const now = new Date()
      const demoRecords = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        demoRecords.push({
          date: date.toISOString(),
          wordsLearned: Math.floor(Math.random() * 15) + 10,
          studyTime: Math.floor(Math.random() * 60) + 60,
          accuracy: Math.floor(Math.random() * 20) + 65
        })
      }
      uni.setStorageSync(LEARNING_RECORDS_KEY, demoRecords)
    }
  }

  isLoggedIn(): boolean {
    const token = uni.getStorageSync(TOKEN_KEY)
    return !!token
  }

  getUser(): UserProfile | null {
    if (this.currentUser) return this.currentUser
    
    const saved = uni.getStorageSync(STORAGE_KEY)
    if (saved) {
      this.currentUser = saved
      return saved
    }
    return null
  }

  async loginWithPhone(phoneCode: string): Promise<LoginResult> {
    if (isWeixin) {
      try {
        const result = await uniCloud.callFunction({
          name: 'user-login',
          data: {
            code: phoneCode
          }
        })

        if (result.result && result.result.success) {
          const user = result.result.user
          uni.setStorageSync(TOKEN_KEY, result.result.token)
          uni.setStorageSync(STORAGE_KEY, user)
          this.currentUser = user
          return { success: true, user, token: result.result.token }
        }
        
        return { success: false, error: result.result?.errMsg || '登录失败' }
      } catch (e: any) {
        return { success: false, error: e.message || '登录失败' }
      }
    }

    const localUser = this.createLocalUser()
    return { success: true, user: localUser }
  }

  async loginWithWechat(): Promise<LoginResult> {
    if (isWeixin) {
      try {
        const loginRes = await uni.login({ provider: 'weixin' })
        if (!loginRes.code) {
          return { success: false, error: '获取登录凭证失败' }
        }
        return this.loginWithPhone(loginRes.code)
      } catch (e: any) {
        return { success: false, error: e.message || '登录失败' }
      }
    }
    
    const localUser = this.createLocalUser()
    return { success: true, user: localUser }
  }

  private createLocalUser(): UserProfile {
    const user: UserProfile = {
      id: 'local_' + Date.now(),
      username: '用户' + Math.floor(Math.random() * 10000),
      nickname: '学生',
      avatar: '',
      grade: 3,
      school: '',
      exp: 0,
      level: 1,
      vip: false,
      vipExpire: '',
      learnedWords: 0,
      wrongQuestions: 0,
      streakDays: 0,
      createdAt: new Date().toISOString()
    }
    
    uni.setStorageSync(STORAGE_KEY, user)
    this.currentUser = user
    return user
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<boolean> {
    const user = this.getUser()
    if (!user) return false

    const updatedUser = { ...user, ...updates }
    uni.setStorageSync(STORAGE_KEY, updatedUser)
    this.currentUser = updatedUser
    
    if (isWeixin && this.isLoggedIn()) {
      try {
        await uniCloud.callFunction({
          name: 'user-update',
          data: updates
        })
      } catch (e) {
        console.error('同步到云端失败', e)
      }
    }
    
    return true
  }

  logout() {
    uni.removeStorageSync(TOKEN_KEY)
    uni.removeStorageSync(STORAGE_KEY)
    this.currentUser = null
  }

  async syncToCloud(): Promise<boolean> {
    if (!this.isLoggedIn()) return false
    
    if (isWeixin) {
      try {
        const token = uni.getStorageSync(TOKEN_KEY)
        const localData = {
          records: uni.getStorageSync('learning_records'),
          learnedWords: uni.getStorageSync('learned_words'),
          wrongQuestions: uni.getStorageSync('wrong_questions'),
          settings: uni.getStorageSync('app_settings')
        }

        await uniCloud.callFunction({
          name: 'user-sync',
          data: {
            token: token,
            ...localData
          }
        })
        
        return true
      } catch (e) {
        return false
      }
    }
    
    return false
  }

  getLevelInfo(): { level: number; exp: number; nextLevelExp: number } {
    const user = this.getUser()
    const exp = user?.exp || 0
    const level = Math.floor(Math.sqrt(exp / 100)) + 1
    const nextLevelExp = Math.pow(level, 2) * 100
    
    return { level, exp, nextLevelExp }
  }

  addExp(amount: number) {
    const user = this.getUser()
    if (!user) return

    const newExp = user.exp + amount
    const newLevel = Math.floor(Math.sqrt(newExp / 100)) + 1
    
    this.updateProfile({ exp: newExp, level: newLevel })
    
    if (newLevel > user.level) {
      uni.showToast({
        title: `恭喜升到${newLevel}级！`,
        icon: 'none'
      })
    }
  }
}

export const authService = new AuthService()
