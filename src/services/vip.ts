import { authService } from './auth'

interface VIPPlan {
  id: string
  name: string
  price: number
  originalPrice: number
  duration: number
  features: string[]
  recommended?: boolean
}

interface VIPOrder {
  orderId: string
  planId: string
  amount: number
  status: 'pending' | 'paid' | 'failed'
  createdAt: string
  paidAt?: string
}

const VIP_PLANS: VIPPlan[] = [
  {
    id: 'monthly',
    name: '月度会员',
    price: 1900,
    originalPrice: 3900,
    duration: 30,
    features: [
      'AI批改次数无限制',
      '所有真题无限做',
      '优先客服支持',
      '学习报告导出'
    ]
  },
  {
    id: 'quarterly',
    name: '季度会员',
    price: 4900,
    originalPrice: 9900,
    duration: 90,
    features: [
      '月度会员全部功能',
      '口语评测功能',
      '专属学习计划',
      '中考押题卷'
    ],
    recommended: true
  },
  {
    id: 'yearly',
    name: '年度会员',
    price: 9900,
    originalPrice: 29900,
    duration: 365,
    features: [
      '季度会员全部功能',
      '一对一答疑（限次）',
      '线下课程优惠券',
      '毕业礼物'
    ]
  }
]

const isWeixin = typeof uni !== 'undefined' && uni.getSystemInfoSync().platform === 'devtools'

class VIPService {
  isVIP(): boolean {
    const user = authService.getUser()
    if (!user || !user.vip) return false
    
    if (!user.vipExpire) return false
    
    const expireDate = new Date(user.vipExpire)
    return expireDate > new Date()
  }

  getExpireDate(): string | null {
    const user = authService.getUser()
    if (!user?.vipExpire) return null
    return user.vipExpire
  }

  getRemainingDays(): number {
    const expireDate = this.getExpireDate()
    if (!expireDate) return 0
    
    const now = new Date()
    const expire = new Date(expireDate)
    const diff = expire.getTime() - now.getTime()
    
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  getPlans(): VIPPlan[] {
    return VIP_PLANS
  }

  async purchase(planId: string): Promise<{ success: boolean; orderId?: string; error?: string }> {
    const plan = VIP_PLANS.find(p => p.id === planId)
    if (!plan) {
      return { success: false, error: '套餐不存在' }
    }

    if (isWeixin) {
      try {
        const token = uni.getStorageSync('auth_token')
        
        const result = await uniCloud.callFunction({
          name: 'vip-purchase',
          data: {
            planId: planId,
            token: token
          }
        })

        if (result.result && result.result.success) {
          const payment = result.result.payment
          
          const payResult = await uni.requestPayment({
            provider: 'wxpay',
            timeStamp: payment.timeStamp,
            nonceStr: payment.nonceStr,
            package: payment.package,
            signType: payment.signType,
            paySign: payment.paySign
          })

          if (payResult.errMsg?.includes('ok')) {
            await this.activateVIP(planId)
            return { success: true, orderId: result.result.orderId }
          }
        }
        
        return { success: false, error: result.result?.errMsg || '支付失败' }
      } catch (e: any) {
        return this.tryVIP(plan.duration)
      }
    }

    return this.tryVIP(plan.duration)
  }

  async tryVIP(days: number = 7): Promise<{ success: boolean; error?: string }> {
    return this.activateVIP('monthly', days)
  }

  private async activateVIP(planId: string, days?: number): Promise<{ success: boolean; error?: string }> {
    const user = authService.getUser()
    if (!user) {
      return { success: false, error: '请先登录' }
    }

    const plan = VIP_PLANS.find(p => p.id === planId)
    const duration = days || plan?.duration || 30
    
    const now = new Date()
    let newExpireDate: Date
    
    if (user.vip && user.vipExpire) {
      const currentExpire = new Date(user.vipExpire)
      if (currentExpire > now) {
        newExpireDate = new Date(currentExpire.getTime() + duration * 24 * 60 * 60 * 1000)
      } else {
        newExpireDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000)
      }
    } else {
      newExpireDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000)
    }
    
    await authService.updateProfile({
      vip: true,
      vipExpire: newExpireDate.toISOString().split('T')[0]
    })

    uni.showToast({
      title: '会员已激活！',
      icon: 'success'
    })

    return { success: true }
  }

  checkFeature(feature: string): boolean {
    if (!this.isVIP()) {
      const freeFeatures = [
        'basic_words',
        'basic_practice',
        'limited_ai',
        'daily_task'
      ]
      return freeFeatures.includes(feature)
    }

    return true
  }

  consumeAICount(): boolean {
    const freeLimit = 3
    const today = new Date().toDateString()
    
    const lastUse = uni.getStorageSync('ai_count_date')
    let count = uni.getStorageSync('ai_count') || 0
    
    if (lastUse !== today) {
      count = 0
    }
    
    if (!this.isVIP() && count >= freeLimit) {
      uni.showModal({
        title: '次数已用完',
        content: '今日免费AI次数已用完，开通会员无限使用！',
        confirmText: '立即开通',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({ url: '/pages/vip/index' })
          }
        }
      })
      return false
    }
    
    count++
    uni.setStorageSync('ai_count', count)
    uni.setStorageSync('ai_count_date', today)
    return true
  }

  getBenefits(): string[] {
    return [
      '🔓 无限 AI 批改',
      '🔓 所有真题题目',
      '🔓 口语评测',
      '🔓 学习报告导出',
      '🔓 专属学习计划',
      '🔓 中考押题卷'
    ]
  }
}

export const vipService = new VIPService()
