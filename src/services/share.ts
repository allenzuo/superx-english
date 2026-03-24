// 分享服务 - 微信小程序版本
import { learningRecord } from './learningRecord'

export const shareService = {
  // 获取学习成就数据
  getAchievementData() {
    const stats = learningRecord.getStats()
    const today = learningRecord.getTodayRecord()
    
    return {
      wordsLearned: stats.totalWordsLearned,
      streakDays: stats.streakDays,
      todayWords: today.wordsLearned,
      todayTime: today.totalTime,
      totalTime: stats.totalTime
    }
  },

  // 生成分享标题
  getShareTitle(): string {
    const data = this.getAchievementData()
    const titles = [
      `我已经连续学习了${data.streakDays}天！`,
      `今天学习了${data.todayWords}个单词！`,
      `累计学习${data.totalTime}分钟了！`,
      `中考英语百日计划，第${data.streakDays}天！`
    ]
    return titles[Math.floor(Math.random() * titles.length)]
  },

  // 生成分享图片路径
  getShareImagePath(): string {
    return '/static/share.png'
  },

  // 分享到微信会话
  shareToWechat() {
    // #ifdef MP-WEIXIN
    uni.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    // #endif
    
    // #ifndef MP-WEIXIN
    uni.showToast({ title: '请在微信中分享', icon: 'none' })
    // #endif
  },

  // 自定义分享内容
  onShareAppMessage(): any {
    const data = this.getAchievementData()
    
    return {
      title: this.getShareTitle(),
      path: '/pages/home/index',
      imageUrl: this.getShareImagePath()
    }
  },

  // 分享到朋友圈
  onShareTimeline(): any {
    const data = this.getAchievementData()
    
    return {
      title: this.getShareTitle(),
      query: `streak=${data.streakDays}&words=${data.totalWordsLearned}`,
      imageUrl: this.getShareImagePath()
    }
  },

  // 生成分享海报（需要 canvas）
  generatePoster(): Promise<string> {
    return new Promise((resolve, reject) => {
      // #ifdef MP-WEIXIN
      const ctx = uni.createCanvasContext('share-poster')
      const data = this.getAchievementData()
      
      // 背景
      ctx.setFillStyle('#667eea')
      ctx.fillRect(0, 0, 300, 400)
      
      // 标题
      ctx.setFillStyle('#ffffff')
      ctx.setFontSize(24)
      ctx.fillText('中考英语', 100, 50)
      
      // 数据
      ctx.setFontSize(16)
      ctx.fillText(`连续学习: ${data.streakDays}天`, 50, 100)
      ctx.fillText(`已学单词: ${data.totalWordsLearned}个`, 50, 140)
      ctx.fillText(`今日学习: ${data.todayWords}个`, 50, 180)
      ctx.fillText(`学习时长: ${data.totalTime}分钟`, 50, 220)
      
      // 二维码提示
      ctx.setFontSize(12)
      ctx.fillText('扫码一起学习', 100, 350)
      
      ctx.draw(false, () => {
        uni.canvasToTempFilePath({
          canvasId: 'share-poster',
          success: (res) => {
            resolve(res.tempFilePath)
          },
          fail: reject
        })
      })
      // #endif
      
      // #ifndef MP-WEIXIN
      reject(new Error('Only available in WeChat'))
      // #endif
    })
  }
}
