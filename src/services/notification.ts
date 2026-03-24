// 消息推送服务 - 微信小程序版本
import { learningRecord } from './learningRecord'

interface ReminderConfig {
  enabled: boolean
  time: string // HH:mm 格式
  weekdays: number[] // 1-7, 1为周一
}

const STORAGE_KEY = 'reminder_config'

class NotificationService {
  private config: ReminderConfig

  constructor() {
    this.config = this.loadConfig()
  }

  private loadConfig(): ReminderConfig {
    const saved = uni.getStorageSync(STORAGE_KEY)
    if (saved) {
      return saved
    }
    return {
      enabled: false,
      time: '08:00',
      weekdays: [1, 2, 3, 4, 5, 6, 7]
    }
  }

  private saveConfig() {
    uni.setStorageSync(STORAGE_KEY, this.config)
  }

  // 获取配置
  getConfig(): ReminderConfig {
    return { ...this.config }
  }

  // 更新配置
  updateConfig(updates: Partial<ReminderConfig>) {
    this.config = { ...this.config, ...updates }
    this.saveConfig()
    
    if (this.config.enabled) {
      this.scheduleReminder()
    } else {
      this.cancelReminder()
    }
  }

  // 开启提醒
  enable(time: string = '08:00') {
    this.updateConfig({ enabled: true, time })
  }

  // 关闭提醒
  disable() {
    this.updateConfig({ enabled: false })
  }

  // 安排提醒
  private scheduleReminder() {
    // #ifdef MP-WEIXIN
    const now = new Date()
    const [hour, minute] = this.config.time.split(':').map(Number)
    
    // 计算下次提醒时间
    const nextTime = new Date()
    nextTime.setHours(hour, minute, 0, 0)
    
    if (nextTime <= now) {
      nextTime.setDate(nextTime.getDate() + 1)
    }
    
    const delay = nextTime.getTime() - now.getTime()
    
    // 使用定时器模拟推送（实际需要接入微信订阅消息）
    setTimeout(() => {
      this.sendReminder()
      // 每天重复
      this.scheduleReminder()
    }, delay)
    // #endif
  }

  // 取消提醒
  private cancelReminder() {
    // #ifdef MP-WEIXIN
    // 取消所有定时器
    // #endif
  }

  // 发送提醒
  private sendReminder() {
    const stats = learningRecord.getStats()
    const today = learningRecord.getTodayRecord()
    
    // 检查今天是否已学习
    if (today.wordsLearned > 0) {
      // 今天已经学习了，不提醒
      return
    }

    // 发送订阅消息
    // #ifdef MP-WEIXIN
    uni.requestSubscribeMessage({
      tmplIds: ['YOUR_TEMPLATE_ID'], // 需要在微信公众平台配置
      success: (res) => {
        if (res['YOUR_TEMPLATE_ID'] === 'accept') {
          uni.showToast({
            title: '今日学习提醒已发送',
            icon: 'none'
          })
        }
      }
    })
    // #endif
  }

  // 检查并发送学习提醒
  checkAndRemind() {
    if (!this.config.enabled) return
    
    const now = new Date()
    const dayOfWeek = now.getDay() || 7 // 转换为1-7
    
    if (!this.config.weekdays.includes(dayOfWeek)) {
      return // 今天是休息日
    }

    const [hour, minute] = this.config.time.split(':').map(Number)
    if (now.getHours() === hour && now.getMinutes() >= minute) {
      this.sendReminder()
    }
  }

  // 手动触发提醒
  manualRemind() {
    const stats = learningRecord.getStats()
    const today = learningRecord.getTodayRecord()
    
    let message = ''
    
    if (today.wordsLearned === 0) {
      message = '今日还没有学习英语哦~'
    } else if (today.wordsLearned < 10) {
      message = `今日已学${today.wordsLearned}个单词，继续加油！`
    } else {
      message = `今日已学${today.wordsLearned}个单词，太棒了！`
    }

    // #ifdef MP-WEIXIN
    uni.showModal({
      title: '学习提醒',
      content: message,
      showCancel: false,
      confirmText: '知道了'
    })
    // #endif
    
    // #ifndef MP-WEIXIN
    uni.showToast({ title: message, icon: 'none' })
    // #endif
  }

  // 获取 icon: 'none下次提醒时间
  getNextReminderTime(): string {
    const now = new Date()
    const [hour, minute] = this.config.time.split(':').map(Number)
    
    const next = new Date()
    next.setHours(hour, minute, 0, 0)
    
    if (next <= now) {
      next.setDate(next.getDate() + 1)
    }
    
    return `${next.getMonth() + 1}月${next.getDate()}日 ${hour}:${String(minute).padStart(2, '0')}`
  }
}

export const notificationService = new NotificationService()
