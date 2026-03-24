<template>
  <view class="vip-page">
    <view class="header">
      <view class="title">开通会员</view>
      <view class="subtitle">解锁全部功能，助你中考英语拿高分</view>
    </view>

    <view class="benefits-section">
      <view class="section-title">会员特权</view>
      <view class="benefits-list">
        <view v-for="benefit in benefits" :key="benefit" class="benefit-item">
          {{ benefit }}
        </view>
      </view>
    </view>

    <view class="plans-section">
      <view class="section-title">选择套餐</view>
      <view class="plans-list">
        <view 
          v-for="plan in plans" 
          :key="plan.id"
          :class="['plan-card', { recommended: plan.recommended }]"
          @tap="selectPlan(plan)"
        >
          <view v-if="plan.recommended" class="tag">推荐</view>
          <view class="plan-name">{{ plan.name }}</view>
          <view class="plan-price">
            <text class="current">¥{{ plan.price / 100 }}</text>
            <text class="original">¥{{ plan.originalPrice / 100 }}</text>
          </view>
          <view class="plan-duration">{{ plan.duration }}天</view>
          <view class="plan-features">
            <view v-for="f in plan.features" :key="f" class="feature">
              {{ f }}
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="trial-section">
      <button class="trial-btn" @tap="tryFree">免费试用7天</button>
    </view>

    <view class="footer">
      <text>支付即表示同意</text>
      <text class="link">《会员服务协议》</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { vipService } from '@/services/vip'

interface Plan {
  id: string
  name: string
  price: number
  originalPrice: number
  duration: number
  features: string[]
  recommended?: boolean
}

const plans = ref<Plan[]>([])
const benefits = ref<string[]>([])
const isProcessing = ref(false)

onMounted(() => {
  plans.value = vipService.getPlans()
  benefits.value = vipService.getBenefits()
})

async function selectPlan(plan: Plan) {
  if (isProcessing.value) return
  
  uni.showModal({
    title: '确认开通',
    content: `确定开通${plan.name}？\n价格：¥${plan.price / 100}`,
    success: async (res) => {
      if (res.confirm) {
        isProcessing.value = true
        uni.showLoading({ title: '处理中...' })
        
        try {
          const result = await vipService.purchase(plan.id)
          uni.hideLoading()
          
          if (result.success) {
            uni.showToast({ title: '开通成功！', icon: 'success' })
            setTimeout(() => {
              uni.navigateBack()
            }, 1500)
          } else {
            uni.showToast({ title: result.error || '开通失败', icon: 'none' })
          }
        } catch (e: any) {
          uni.hideLoading()
          // Fallback to demo mode
          uni.showModal({
            title: '支付演示',
            content: '当前为演示环境，是否模拟支付成功？',
            success: async (modalRes) => {
              if (modalRes.confirm) {
                await vipService.tryVIP(plan.duration)
                uni.showToast({ title: '开通成功！', icon: 'success' })
                setTimeout(() => {
                  uni.navigateBack()
                }, 1500)
              }
            }
          })
        } finally {
          isProcessing.value = false
        }
      }
    }
  })
}

async function tryFree() {
  if (isProcessing.value) return
  isProcessing.value = true
  
  uni.showLoading({ title: '开通中...' })
  try {
    await vipService.tryVIP(7)
    uni.hideLoading()
    uni.showToast({ title: '试用已开通！', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: '开通失败', icon: 'none' })
  } finally {
    isProcessing.value = false
  }
}
</script>

<style scoped>
.vip-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
  color: #fff;
  text-align: center;
}

.title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.benefits-section, .plans-section {
  background: #fff;
  margin: 16px;
  border-radius: 12px;
  padding: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.benefits-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.benefit-item {
  font-size: 14px;
  color: #666;
}

.plans-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-card {
  background: #f5f5f5;
  border-radius: 12px;
  padding: 16px;
  position: relative;
}

.plan-card.recommended {
  background: linear-gradient(135deg, #667eea20%, #764ba220%);
  border: 2px solid #667eea;
}

.plan-card .tag {
  position: absolute;
  top: -10px;
  right: 20px;
  background: #667eea;
  color: #fff;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
}

.plan-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.plan-price {
  margin-bottom: 8px;
}

.plan-price .current {
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
}

.plan-price .original {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
  margin-left: 8px;
}

.plan-duration {
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
}

.plan-features {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.feature {
  font-size: 12px;
  color: #666;
}

.trial-section {
  padding: 20px 16px;
}

.trial-btn {
  width: 100%;
  background: transparent;
  border: 1px solid #667eea;
  color: #667eea;
  padding: 14px;
  border-radius: 30px;
  font-size: 16px;
}

.footer {
  text-align: center;
  padding: 20px;
  font-size: 12px;
  color: #999;
}

.footer .link {
  color: #667eea;
}
</style>
