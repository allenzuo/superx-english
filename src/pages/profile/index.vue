<template>
  <view class="profile-page">
    <view class="profile-header">
      <view class="avatar" :style="{ background: getLevelColor(store.profile.level) }">
        <text class="avatar-text">{{ store.profile.name.charAt(0) }}</text>
      </view>
      <view class="info">
        <text class="name">{{ store.profile.name }}</text>
        <view class="level-info">
          <text class="level-badge" :style="{ background: getLevelColor(store.profile.level) }">
            Lv.{{ store.profile.level || 1 }}
          </text>
          <text class="exp-text">{{ store.profile.exp || 0 }} EXP</text>
        </view>
      </view>
    </view>

    <view class="stats-section">
      <view class="stats-grid">
        <view class="stat-item">
          <text class="value">{{ learnedWordsCount }}</text>
          <text class="label">已学单词</text>
        </view>
        <view class="stat-item">
          <text class="value">{{ wrongCount }}</text>
          <text class="label">错题数</text>
        </view>
        <view class="stat-item">
          <text class="value">{{ store.profile.streakDays }}</text>
          <text class="label">连续天数</text>
        </view>
      </view>
      <view class="stats-grid secondary">
        <view class="stat-item">
          <text class="value">{{ stats.total }}</text>
          <text class="label">总做题</text>
        </view>
        <view class="stat-item">
          <text class="value">{{ stats.correct }}</text>
          <text class="label">正确数</text>
        </view>
        <view class="stat-item">
          <text class="value">{{ stats.accuracy }}%</text>
          <text class="label">正确率</text>
        </view>
      </view>
    </view>

    <view class="menu-section">
      <view class="menu-item" @tap="goToReport">
        <text class="icon">📊</text>
        <view class="label-wrapper">
          <text class="label">AI报告</text>
          <text class="label-desc">学习进度智能分析报告</text>
        </view>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @tap="goToDiagnostic">
        <text class="icon">📋</text>
        <view class="label-wrapper">
          <text class="label">学情诊断</text>
          <text class="label-desc">分析学生薄弱知识点</text>
        </view>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @tap="openVip">
        <text class="icon">👑</text>
        <text class="label">开通会员</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @tap="shareAchievement">
        <text class="icon">📤</text>
        <text class="label">分享成就</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @tap="clearCache">
        <text class="icon">🗑️</text>
        <text class="label">清除缓存</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @tap="goToSettings">
        <text class="icon">⚙️</text>
        <view class="label-wrapper">
          <text class="label">设置</text>
          <text class="label-desc">大模型/API配置</text>
        </view>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @tap="showAbout">
        <text class="icon">ℹ️</text>
        <text class="label">关于</text>
        <text class="arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { store, userStore } from '@/store'
import { userService, practiceStatsService } from '@/services/user'

const stats = ref({ total: 0, correct: 0, accuracy: 0 })
const wrongCount = ref(0)
const learnedWordsCount = ref(0)

onMounted(() => {
  userStore.loadProfile()
  loadStats()
})

function loadStats() {
  const profile = userService.getProfile()
  stats.value = practiceStatsService.getStats()
  wrongCount.value = uni.getStorageSync('wrong_questions')?.length || 0
  learnedWordsCount.value = userService.getLearnedWords().length
  
  store.profile.learnedWords = learnedWordsCount.value
  store.profile.wrongQuestions = wrongCount.value
  store.profile.streakDays = profile.streak_days
  store.profile.exp = profile.exp
  store.profile.level = profile.level
}

function goTo(path: string) {
  uni.navigateTo({ url: path })
}

function goToReport() {
  uni.navigateTo({ url: '/pages/report/index' })
}

function goToDiagnostic() {
  uni.navigateTo({ url: '/pages/diagnostic/index' })
}

function goToSettings() {
  uni.navigateTo({ url: '/pages/settings/index' })
}

function openVip() {
  uni.navigateTo({ url: '/pages/vip/index' })
}

function showAbout() {
  uni.showModal({
    title: '关于',
    content: '中考英语·真题吃透\nVersion 1.1\n\n专注中考英语学习',
    showCancel: false
  })
}

function shareAchievement() {
  const profile = userService.getProfile()
  const messages = [
    `我已经连续学习了${profile.streak_days}天！`,
    `我已经学习了${learnedWordsCount.value}个单词！`,
    `我的等级是Lv.${profile.level}！`
  ]
  const randomMsg = messages[Math.floor(Math.random() * messages.length)]
  
  uni.showModal({
    title: '分享成就',
    content: `${randomMsg}\n\n点击右上角菜单，分享给朋友吧！`,
    confirmText: '知道了',
    showCancel: false
  })
}

function clearCache() {
  uni.showModal({
    title: '清除缓存',
    content: '确定要清除所有缓存数据吗？',
    success: (res) => {
      if (res.confirm) {
        uni.clearStorageSync()
        userStore.loadProfile()
        loadStats()
        uni.showToast({ title: '已清除', icon: 'success' })
      }
    }
  })
}

function getLevelColor(level: number): string {
  const colors = ['#ff6b6b', '#ff9a44', '#ffbe0b', '#06d6a0', '#3a86ff', '#a18cd1', '#f72585']
  return colors[Math.min(level - 1, 6)]
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.profile-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
  display: flex;
  align-items: center;
  color: #fff;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.avatar-text {
  font-size: 28px;
  font-weight: bold;
}

.info .name {
  font-size: 20px;
  font-weight: bold;
  display: block;
}

.info .grade {
  font-size: 14px;
  opacity: 0.9;
}

.level-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.level-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: #fff;
}

.exp-text {
  font-size: 12px;
  opacity: 0.8;
}

.stats-section {
  background: #fff;
  margin-bottom: 12px;
}

.stats-grid {
  display: flex;
  padding: 20px;
}

.stats-grid.secondary {
  padding-top: 0;
  border-top: 1px solid #f0f0f0;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-item .value {
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
  display: block;
}

.stat-item .label {
  font-size: 12px;
  color: #999;
}

.menu-section {
  background: #fff;
  margin-bottom: 12px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item .icon {
  font-size: 20px;
  margin-right: 12px;
}

.menu-item .label {
  flex: 1;
  font-size: 16px;
  color: #333;
}

.menu-item .label-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.menu-item .label-desc {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.menu-item .arrow {
  color: #ccc;
  font-size: 20px;
}
</style>
