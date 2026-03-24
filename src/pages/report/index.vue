<template>
  <view class="report-page">
    <view class="header">
      <text class="title">📊 AI 学习报告</text>
      <text class="subtitle">智能分析学习数据，定制提升方案</text>
    </view>

    <view class="tabs">
      <view :class="['tab', currentTab === 0 ? 'active' : '']" @tap="currentTab = 0">
        生成报告
      </view>
      <view :class="['tab', currentTab === 1 ? 'active' : '']" @tap="currentTab = 1; loadHistory()">
        历史报告
      </view>
    </view>

    <view v-if="currentTab === 0" class="tab-content">
      <view class="period-section">
        <text class="section-label">选择分析周期：</text>
        <view class="period-options">
          <view 
            v-for="option in periodOptions" 
            :key="option.value"
            :class="['period-btn', selectedPeriod === option.value ? 'active' : '']"
            @tap="selectedPeriod = option.value"
          >
            {{ option.label }}
          </view>
        </view>
        <view v-if="selectedPeriod === 'custom'" class="custom-period">
          <picker mode="date" :start="customStartMin" :end="today" @change="onCustomStartChange">
            <view class="picker-btn">{{ customStart || '开始日期' }}</view>
          </picker>
          <text class="picker-separator">至</text>
          <picker mode="date" :start="customStart || customStartMin" :end="today" @change="onCustomEndChange">
            <view class="picker-btn">{{ customEnd || '结束日期' }}</view>
          </picker>
        </view>
      </view>

      <view class="action-area">
        <button class="generate-btn" :loading="generating" @tap="generateReport">
          {{ generating ? '生成中...' : '生成 AI 报告' }}
        </button>
      </view>

      <view v-if="loading" class="loading-section">
        <view class="loading-content">
          <text class="loading-icon">🤖</text>
          <text class="loading-text">AI 正在分析您的学习数据...</text>
          <view class="progress-bar">
            <view class="progress" :style="{ width: progress + '%' }"></view>
          </view>
        </view>
      </view>

      <view v-else-if="report" class="report-content">
        <view class="period-badge">
          <text>{{ getPeriodText() }}</text>
        </view>

        <view class="summary-section">
          <text class="section-title">📈 学习概览</text>
          <view class="stats-grid">
            <view class="stat-card">
              <text class="stat-value">{{ report.summary.learnedWords }}</text>
              <text class="stat-label">学单词</text>
            </view>
            <view class="stat-card">
              <text class="stat-value">{{ report.summary.wrongQuestions }}</text>
              <text class="stat-label">错题数</text>
            </view>
            <view class="stat-card">
              <text class="stat-value">{{ report.summary.streakDays }}</text>
              <text class="stat-label">连续天数</text>
            </view>
            <view class="stat-card">
              <text class="stat-value">{{ report.summary.totalStudyTime }}</text>
              <text class="stat-label">学习时长(分)</text>
            </view>
          </view>
          <view v-if="report.summary.accuracy" class="accuracy-row">
            <text class="accuracy-label">准确率：</text>
            <text class="accuracy-value">{{ report.summary.accuracy }}%</text>
          </view>
        </view>

        <view class="radar-section">
          <text class="section-title">🎯 知识点掌握</text>
          <view class="radar-chart">
            <view class="radar-item" v-for="(value, key) in report.knowledgeRadar" :key="key">
              <view class="radar-label">{{ getKnowledgeName(key) }}</view>
              <view class="radar-bar">
                <view class="radar-fill" :style="{ width: value + '%', background: getRadarColor(value) }"></view>
              </view>
              <text class="radar-value">{{ value }}</text>
            </view>
          </view>
        </view>

        <view class="weakpoints-section">
          <text class="section-title">⚠️ 薄弱点分析</text>
          <view v-if="report.weakPoints && report.weakPoints.length > 0">
            <view 
              v-for="(wp, index) in report.weakPoints" 
              :key="index" 
              class="weakpoint-card"
              @tap="goToFeature(wp.relatedFeature)"
            >
              <view class="wp-header">
                <text class="wp-topic">{{ wp.topic }}</text>
                <text class="wp-priority" :class="'priority-' + wp.priority">
                  {{ getPriorityName(wp.priority) }}
                </text>
              </view>
              <text class="wp-description">{{ wp.description }}</text>
              <view class="wp-suggestion">
                <text class="suggestion-icon">💡</text>
                <text class="suggestion-text">{{ wp.suggestion }}</text>
              </view>
            </view>
          </view>
          <view v-else class="empty-tip">
            <text>🎉 恭喜！暂无明显薄弱点</text>
          </view>
        </view>

        <view v-if="report.progress && report.progress.length > 0" class="progress-section">
          <text class="section-title">📅 每日进度</text>
          <view class="progress-chart">
            <view 
              v-for="(day, index) in report.progress.slice(-7)" 
              :key="index" 
              class="progress-day"
            >
              <view class="day-bar">
                <view 
                  class="day-fill" 
                  :style="{ height: (day.wordsLearned / maxWords * 100) + '%' }"
                ></view>
              </view>
              <text class="day-label">{{ formatDayLabel(day.date) }}</text>
              <text class="day-value">{{ day.wordsLearned }}</text>
            </view>
          </view>
        </view>

        <view class="plan-section">
          <text class="section-title">📋 下一步计划</text>
          <view class="plan-card">
            <view class="plan-reason">
              <text class="reason-icon">🎯</text>
              <text class="reason-text">{{ report.nextPlan.reason }}</text>
            </view>
            <view class="plan-focus">
              <text class="plan-label">重点攻克：</text>
              <view class="focus-tags">
                <text v-for="focus in report.nextPlan.focus" :key="focus" class="focus-tag">
                  {{ focus }}
                </text>
              </view>
            </view>
            <view class="plan-goal">
              <text class="goal-label">每日目标：</text>
              <text class="goal-value">{{ report.nextPlan.dailyGoal }} 个单词</text>
            </view>
          </view>
        </view>

        <view class="action-section">
          <button class="refresh-btn" @tap="generateReport">
            🔄 重新生成
          </button>
          <view class="quick-actions">
            <button class="action-btn" @tap="goToWords">📖 背单词</button>
            <button class="action-btn" @tap="goToWrong">📚 错题</button>
            <button class="action-btn" @tap="goToGrammar">📝 语法</button>
          </view>
        </view>
      </view>
    </view>

    <view v-if="currentTab === 1" class="tab-content">
      <view v-if="history.length === 0" class="empty-history">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无报告历史</text>
      </view>

      <view v-else class="history-list">
        <view 
          v-for="(item, index) in history" 
          :key="index" 
          class="history-item"
          @tap="viewHistoryReport(item)"
        >
          <view class="history-info">
            <text class="history-period">{{ getPeriodLabel(item.period) }}</text>
            <text class="history-date">{{ formatFullDate(item.startDate) }} - {{ formatFullDate(item.endDate) }}</text>
          </view>
          <view class="history-stats">
            <text class="history-words">{{ item.summary.learnedWords }} 词</text>
            <text class="arrow">›</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { aiService, type LearningReport } from '@/services/ai'

const currentTab = ref(0)
const selectedPeriod = ref<'day' | 'week' | 'month' | 'custom'>('week')
const customStart = ref('')
const customEnd = ref('')

const generating = ref(false)
const loading = ref(false)
const progress = ref(0)
const report = ref<LearningReport | null>(null)
const history = ref<LearningReport[]>([])

const periodOptions = [
  { value: 'day', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'custom', label: '自定义' }
]

const today = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const customStartMin = computed(() => {
  const d = new Date()
  d.setMonth(d.getMonth() - 3)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const maxWords = computed(() => {
  if (!report.value?.progress) return 20
  return Math.max(...report.value.progress.map(p => p.wordsLearned), 20)
})

function onCustomStartChange(e: any) {
  customStart.value = e.detail.value
}

function onCustomEndChange(e: any) {
  customEnd.value = e.detail.value
}

function getPeriodText(): string {
  const map: Record<string, string> = {
    day: '今日学习报告',
    week: '本周学习报告',
    month: '本月学习报告',
    custom: '自定义周期报告'
  }
  return map[selectedPeriod.value] || '学习报告'
}

function getPeriodLabel(period: string): string {
  const map: Record<string, string> = {
    day: '今日',
    week: '本周',
    month: '本月',
    custom: '自定义'
  }
  return map[period] || period
}

async function generateReport() {
  const settings = uni.getStorageSync('app_settings') || {}
  if (!settings.apiKey) {
    uni.showModal({
      title: '提示',
      content: '请先在设置页面配置 API Key',
      confirmText: '去设置',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: '/pages/settings/index' })
        }
      }
    })
    return
  }

  loading.value = true
  generating.value = true
  progress.value = 0
  
  const progressTimer = setInterval(() => {
    if (progress.value < 90) {
      progress.value += Math.random() * 15
    }
  }, 300)

  try {
    report.value = await aiService.generateLearningReport(
      selectedPeriod.value,
      selectedPeriod.value === 'custom' ? customStart.value : undefined,
      selectedPeriod.value === 'custom' ? customEnd.value : undefined
    )
    progress.value = 100
  } catch (e: any) {
    uni.showToast({
      title: e.message || '生成失败',
      icon: 'none'
    })
  } finally {
    clearInterval(progressTimer)
    setTimeout(() => {
      loading.value = false
      generating.value = false
    }, 500)
  }
}

function loadHistory() {
  history.value = aiService.getLearningReportHistory()
}

function viewHistoryReport(item: LearningReport) {
  report.value = item
  selectedPeriod.value = item.period
  currentTab.value = 0
}

function getKnowledgeName(key: string): string {
  const map: Record<string, string> = {
    grammar: '语法',
    vocabulary: '词汇',
    reading: '阅读',
    listening: '听力',
    writing: '写作'
  }
  return map[key] || key
}

function getRadarColor(value: number): string {
  if (value >= 80) return '#52c41a'
  if (value >= 60) return '#faad14'
  if (value >= 40) return '#fa8c16'
  return '#ff4d4f'
}

function getPriorityName(priority: number): string {
  if (priority >= 4) return '紧急'
  if (priority >= 3) return '重要'
  if (priority >= 2) return '一般'
  return '低'
}

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}.${date.getDate()}`
}

function goToFeature(feature: string) {
  const routes: Record<string, string> = {
    grammar: '/pages/grammar/index',
    words: '/pages/words/index',
    reading: '/pages/reading/index',
    listening: '/pages/listening/index',
    writing: '/pages/writing/index'
  }
  const url = routes[feature]
  if (url) uni.navigateTo({ url })
}

function goToWords() {
  uni.switchTab({ url: '/pages/words/index' })
}

function goToWrong() {
  uni.switchTab({ url: '/pages/wrong/index' })
}

function goToGrammar() {
  uni.navigateTo({ url: '/pages/grammar/index' })
}
</script>

<style scoped>
.report-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  padding: 30px 20px;
  color: #fff;
  text-align: center;
}

.title {
  font-size: 24px;
  font-weight: bold;
  display: block;
}

.subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 8px;
}

.tabs {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 16px;
  font-size: 14px;
  color: #666;
  position: relative;
}

.tab.active {
  color: #f5576c;
  font-weight: bold;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background: #f5576c;
  border-radius: 2px;
}

.tab-content {
  padding: 20px;
  padding-bottom: 40px;
}

.period-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.section-label {
  font-size: 14px;
  color: #666;
  display: block;
  margin-bottom: 12px;
}

.period-options {
  display: flex;
  gap: 8px;
}

.period-btn {
  flex: 1;
  padding: 12px;
  text-align: center;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
}

.period-btn.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.custom-period {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.picker-btn {
  flex: 1;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
  color: #666;
}

.picker-separator {
  color: #999;
  font-size: 14px;
}

.action-area {
  margin-bottom: 20px;
}

.generate-btn {
  width: 100%;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
  border: none;
  padding: 16px;
  border-radius: 30px;
  font-size: 16px;
}

.loading-section {
  padding: 60px 20px;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.loading-text {
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
}

.progress-bar {
  width: 200px;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #f093fb, #f5576c);
  border-radius: 4px;
}

.period-badge {
  display: inline-block;
  background: linear-gradient(135deg, #f093fb20%, #f5576c20%);
  color: #f5576c;
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 14px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 16px;
}

.summary-section {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #f5576c;
  display: block;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.accuracy-row {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
}

.accuracy-label {
  font-size: 14px;
  color: #666;
}

.accuracy-value {
  font-size: 18px;
  font-weight: bold;
  color: #52c41a;
}

.radar-section {
  margin-bottom: 24px;
}

.radar-chart {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}

.radar-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.radar-label {
  width: 50px;
  font-size: 14px;
  color: #333;
}

.radar-bar {
  flex: 1;
  height: 16px;
  background: #f0f0f0;
  border-radius: 8px;
  margin: 0 12px;
  overflow: hidden;
}

.radar-fill {
  height: 100%;
  border-radius: 8px;
}

.radar-value {
  width: 30px;
  font-size: 12px;
  color: #666;
  text-align: right;
}

.weakpoints-section {
  margin-bottom: 24px;
}

.weakpoint-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.wp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.wp-topic {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.wp-priority {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.priority-5, .priority-4 {
  background: #fff1f0;
  color: #ff4d4f;
}

.priority-3 {
  background: #fff7e6;
  color: #fa8c16;
}

.priority-2 {
  background: #f0f5ff;
  color: #1890ff;
}

.priority-1 {
  background: #f6ffed;
  color: #52c41a;
}

.wp-description {
  font-size: 14px;
  color: #666;
  display: block;
  margin-bottom: 12px;
}

.wp-suggestion {
  display: flex;
  align-items: flex-start;
  background: #f6ffed;
  border-radius: 8px;
  padding: 12px;
}

.suggestion-icon {
  margin-right: 8px;
}

.suggestion-text {
  font-size: 14px;
  color: #52c41a;
  flex: 1;
}

.empty-tip {
  background: #f6ffed;
  color: #52c41a;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
}

.progress-section {
  margin-bottom: 24px;
}

.progress-chart {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.progress-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.day-bar {
  width: 24px;
  height: 60px;
  background: #f0f0f0;
  border-radius: 4px;
  display: flex;
  align-items: flex-end;
  margin-bottom: 8px;
}

.day-fill {
  width: 100%;
  background: linear-gradient(180deg, #f093fb, #f5576c);
  border-radius: 4px;
}

.day-label {
  font-size: 12px;
  color: #999;
}

.day-value {
  font-size: 12px;
  color: #666;
}

.plan-section {
  margin-bottom: 24px;
}

.plan-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}

.plan-reason {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background: #f6ffed;
  border-radius: 8px;
}

.reason-icon {
  margin-right: 8px;
}

.reason-text {
  font-size: 14px;
  color: #52c41a;
}

.plan-focus {
  margin-bottom: 12px;
}

.plan-label, .goal-label {
  font-size: 14px;
  color: #666;
  display: block;
  margin-bottom: 8px;
}

.focus-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.focus-tag {
  background: linear-gradient(135deg, #f093fb20%, #f5576c20%);
  color: #f5576c;
  font-size: 14px;
  padding: 6px 12px;
  border-radius: 16px;
}

.goal-value {
  font-size: 18px;
  font-weight: bold;
  color: #f5576c;
}

.action-section {
  margin-top: 24px;
}

.refresh-btn {
  width: 100%;
  background: #fff;
  color: #f5576c;
  border: 1px solid #f5576c;
  padding: 14px;
  border-radius: 30px;
  font-size: 16px;
  margin-bottom: 16px;
}

.quick-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  background: #f5576c;
  color: #fff;
  border: none;
  padding: 12px;
  border-radius: 20px;
  font-size: 14px;
}

.empty-history {
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 60px;
  display: block;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #999;
}

.history-list {
  background: #fff;
  border-radius: 12px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.history-item:last-child {
  border-bottom: none;
}

.history-info {
  flex: 1;
}

.history-period {
  font-size: 16px;
  color: #333;
  display: block;
  margin-bottom: 4px;
}

.history-date {
  font-size: 12px;
  color: #999;
}

.history-stats {
  display: flex;
  align-items: center;
}

.history-words {
  font-size: 14px;
  color: #666;
  margin-right: 8px;
}

.arrow {
  font-size: 20px;
  color: #ccc;
}
</style>
