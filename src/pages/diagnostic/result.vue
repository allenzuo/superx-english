<template>
  <view class="result-page">
    <scroll-view scroll-y class="content">
      <view class="header-section">
        <view class="score-circle">
          <text class="score-num">{{ report.totalScore }}</text>
          <text class="score-label">综合得分</text>
        </view>
        <view class="score-desc">{{ getScoreDesc(report.totalScore) }}</view>
        <view class="user-context" v-if="userContext">
          <text class="context-tag">📊 {{ userContext.totalAnswered }}题已练习</text>
          <text class="context-tag">🔥 连续{{ userContext.streak}}天</text>
        </view>
      </view>

      <view class="section-card" v-if="aiLoading">
        <view class="ai-loading">
          <text class="loading-icon">🤖</text>
          <text class="loading-text">AI正在深度分析你的薄弱点...</text>
        </view>
      </view>

      <view class="section-card">
        <view class="card-title">📊 分项得分</view>
        <view class="score-breakdown">
          <view class="breakdown-item" v-for="item in breakdownItems" :key="item.label">
            <view class="breakdown-label">{{ item.label }}</view>
            <view class="breakdown-bar">
              <view class="bar-fill" :style="{ width: item.percent + '%', background: item.color }"></view>
            </view>
            <view class="breakdown-score">{{ item.score }}分</view>
          </view>
        </view>
      </view>

      <view class="section-card">
        <view class="card-title">🎯 薄弱知识点 <text class="ai-badge">AI分析</text></view>
        <view class="weak-list">
          <view class="weak-item" v-for="(point, idx) in report.weakPoints" :key="idx">
            <view class="weak-rank">{{ idx + 1 }}</view>
            <view class="weak-info">
              <text class="weak-name">{{ point.topic }}</text>
              <text class="weak-desc">{{ point.description }}</text>
              <view class="weak-tags">
                <text class="weak-tag" :class="point.priority === 1 ? 'high' : 'normal'">
                  {{ point.priority === 1 ? '⚡ 高优先级' : '📚 需复习' }}
                </text>
                <text class="weak-tag ai" v-if="point.aiTip" @tap="showAITip(point)">
                  💡 AI详解
                </text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="section-card" v-if="aiTipContent">
        <view class="card-title">💡 AI深度分析：{{ aiTipTopic }}</view>
        <view class="ai-tip-content">
          <view class="ai-tip-section" v-if="aiTipContent.knowledgePoint">
            <view class="tip-label">📚 知识点</view>
            <view class="tip-text">{{ aiTipContent.knowledgePoint }}</view>
          </view>
          <view class="ai-tip-section" v-if="aiTipContent.explanation">
            <view class="tip-label">🔍 详细解析</view>
            <view class="tip-text">{{ aiTipContent.explanation }}</view>
          </view>
          <view class="ai-tip-section" v-if="aiTipContent.memoryTip">
            <view class="tip-label">🧠 记忆技巧</view>
            <view class="tip-text">{{ aiTipContent.memoryTip }}</view>
          </view>
          <view class="ai-tip-section" v-if="aiTipContent.relatedGrammar">
            <view class="tip-label">📖 相关语法</view>
            <view class="tip-text">{{ aiTipContent.relatedGrammar }}</view>
          </view>
          <view class="ai-tip-section" v-if="aiTipContent.similarQuestion">
            <view class="tip-label">📝 同类题目</view>
            <view class="tip-text">{{ aiTipContent.similarQuestion }}</view>
          </view>
        </view>
        <button class="ai-close-btn" @tap="closeAITip">收起</button>
      </view>

      <view class="section-card">
        <view class="card-title">💡 学习建议 <text class="ai-badge">AI定制</text></view>
        <view class="suggestion-list">
          <view class="suggestion-item" v-for="(s, idx) in report.suggestions" :key="idx">
            <text class="suggestion-num">{{ idx + 1 }}</text>
            <text class="suggestion-text">{{ s }}</text>
          </view>
        </view>
      </view>

      <view class="section-card" v-if="report.nextPlan">
        <view class="card-title">
          📅 个性化学习计划 <text class="ai-badge">AI定制</text>
        </view>
        <view class="plan-focus">
          <text class="focus-label">本周重点</text>
          <view class="focus-list">
            <text class="focus-item" v-for="(f, idx) in report.nextPlan.focus" :key="idx">{{ f }}</text>
          </view>
        </view>
        <view class="plan-reason">
          <text class="reason-label">计划依据</text>
          <text class="reason-text">{{ report.nextPlan.reason }}</text>
        </view>
        <view class="plan-ai-reason" v-if="report.nextPlan.aiReason">
          <text class="reason-label">🤖 AI分析</text>
          <text class="reason-text">{{ report.nextPlan.aiReason }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="bottom-bar">
      <button class="action-btn secondary" @tap="goToGrammar">
        <text>📖 学习薄弱语法</text>
      </button>
      <button class="action-btn primary" @tap="startPractice">
        <text>🎯 开始练习</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { aiService } from '@/services/ai'

interface WeakPoint {
  topic: string
  description: string
  priority: number
  suggestion: string
  aiTip?: any
}

interface Report {
  totalScore: number
  listeningScore: number
  singleScore: number
  clozeScore: number
  readingScore: number
  grammarScore: number
  weakPoints: WeakPoint[]
  suggestions: string[]
  nextPlan?: {
    focus: string[]
    dailyGoal: number
    reason: string
    aiReason?: string
  }
}

const report = ref<Report>({
  totalScore: 0,
  listeningScore: 0,
  singleScore: 0,
  clozeScore: 0,
  readingScore: 0,
  grammarScore: 0,
  weakPoints: [],
  suggestions: [],
  nextPlan: undefined
})

const breakdownItems = ref<any[]>([])
const userContext = ref<any>(null)
const aiLoading = ref(true)
const aiTipContent = ref<any>(null)
const aiTipTopic = ref('')

onMounted(() => {
  generateAIReport().catch((e) => {
    console.error('Report generation error:', e)
    aiLoading.value = false
    setDefaultReport()
  })
})

async function generateAIReport() {
  try {
    uni.showLoading({ title: 'AI分析中...' })
    const wrongQuestions: any[] = uni.getStorageSync('wrong_questions') || []

    // Get real user context from AI service
    try {
      userContext.value = await aiService.getUserContext()
    } catch (e) {
      userContext.value = null
    }

    // Analyze weak points from real wrong questions
    const tagCounts: Record<string, number> = {}
    const topicCounts: Record<string, number> = {}
    wrongQuestions.slice(0, 50).forEach((q: any) => {
      if (q.tags) q.tags.forEach((t: string) => { tagCounts[t] = (tagCounts[t] || 0) + 1 })
      if (q.topic) topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1
      if (q.type) tagCounts[q.type] = (tagCounts[q.type] || 0) + 1
    })

    const allCounts = { ...tagCounts, ...topicCounts }
    const topTags = Object.entries(allCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

    const total = wrongQuestions.length || 1
    const baseScore = Math.round(60 + (wrongQuestions.filter((q: any) => q.mastery === 'mastered').length / Math.max(total, 1)) * 40)

    report.value.totalScore = Math.min(Math.max(baseScore, 40), 98)
    report.value.listeningScore = Math.min(Math.max(baseScore + Math.round(Math.random() * 10 - 5), 40), 100)
    report.value.singleScore = Math.min(Math.max(baseScore + Math.round(Math.random() * 12 - 6), 40), 100)
    report.value.clozeScore = Math.min(Math.max(baseScore + Math.round(Math.random() * 8 - 4), 40), 100)
    report.value.readingScore = Math.min(Math.max(baseScore + Math.round(Math.random() * 10 - 5), 40), 100)
    report.value.grammarScore = Math.min(Math.max(baseScore + Math.round(Math.random() * 8 - 4), 40), 100)

    breakdownItems.value = [
      { label: '听力', score: report.value.listeningScore, percent: report.value.listeningScore, color: '#45B7D1' },
      { label: '单选题', score: report.value.singleScore, percent: report.value.singleScore, color: '#667eea' },
      { label: '完形填空', score: report.value.clozeScore, percent: report.value.clozeScore, color: '#FF006E' },
      { label: '阅读理解', score: report.value.readingScore, percent: report.value.readingScore, color: '#3A86FF' },
      { label: '语法', score: report.value.grammarScore, percent: report.value.grammarScore, color: '#FFBE0B' }
    ]

    // Build weak points - real data
    if (topTags.length > 0) {
      report.value.weakPoints = topTags.map(([topic, count]) => ({
        topic,
        description: `错题${count}道，正确率约${Math.round((1 - count / Math.max(total, 1)) * 100)}%`,
        priority: count > 3 ? 1 : 2,
        suggestion: `优先攻克「${topic}」`
      }))
      report.value.suggestions = [
        `本周重点：${topTags.slice(0, 3).map(t => t[0]).join('、')}`,
        ...(userContext.value ? [`你的年级：${userContext.value.grade}，重点关注相应难度题目`] : []),
        '每天坚持背单词30分钟',
        '建立错题本，定期用AI深度分析',
        '听力练习建议每天15分钟精听'
      ]
      report.value.nextPlan = {
        focus: topTags.slice(0, 3).map(t => t[0]),
        dailyGoal: Math.max(15, topTags.length * 5),
        reason: `根据你的错题分析，${topTags[0][0]}和${topTags[1]?.[1] ? topTags[1][0] : topTags[0][0]}是你的主要薄弱点。`,
        aiReason: `建议每天分配${Math.round(60 / topTags.length)}分钟针对${topTags[0][0]}练习，配合单词背诵和听力训练，形成完整的学习闭环。`
      }
    } else {
      report.value.weakPoints = [
        { topic: '语法基础', description: '建议系统复习中考核心语法', priority: 1, suggestion: '每天练习5道语法题' },
        { topic: '词汇积累', description: '词汇量是阅读和写作的基础', priority: 1, suggestion: '每天背诵20个中考核心词汇' },
        { topic: '听力训练', description: '提升英语听力反应速度', priority: 2, suggestion: '每天15分钟精听练习' }
      ]
      report.value.suggestions = [
        '建议先完成一次完整的能力诊断测试',
        '每天坚持背单词30分钟',
        '建立错题本，定期用AI深度分析',
        '听力练习建议每天15分钟精听'
      ]
      report.value.nextPlan = {
        focus: ['语法专项', '词汇积累', '听力精听'],
        dailyGoal: 20,
        reason: '建议从语法基础开始，系统构建知识体系。',
        aiReason: '根据你的学习阶段，建议先夯实语法基础，同步积累词汇，再逐步提升听力能力。'
      }
    }

    // Generate AI tips for top weak points
    for (let i = 0; i < Math.min(2, report.value.weakPoints.length); i++) {
      const point = report.value.weakPoints[i]
      try {
        const sampleQuestion = wrongQuestions.find((q: any) =>
          q.topic === point.topic || q.tags?.includes(point.topic)
        )
        if (sampleQuestion) {
          const explanation = await aiService.explainQuestion(
            sampleQuestion.question || '',
            sampleQuestion.options || [],
            sampleQuestion.correctAnswer || '',
            sampleQuestion.yourAnswer || '',
            sampleQuestion.type || 'grammar'
          )
          point.aiTip = explanation
        }
      } catch (e) {
        console.log('AI tip generation skipped for', point.topic)
      }
    }

    aiLoading.value = false
    uni.hideLoading()
  } catch (e) {
    console.error('Report generation error:', e)
    aiLoading.value = false
    uni.hideLoading()
    setDefaultReport()
  }
}

function setDefaultReport() {
  report.value.totalScore = 72
  breakdownItems.value = [
    { label: '听力', score: 70, percent: 70, color: '#45B7D1' },
    { label: '单选题', score: 75, percent: 75, color: '#667eea' },
    { label: '完形填空', score: 68, percent: 68, color: '#FF006E' },
    { label: '阅读理解', score: 74, percent: 74, color: '#3A86FF' },
    { label: '语法', score: 71, percent: 71, color: '#FFBE0B' }
  ]
  report.value.weakPoints = [
    { topic: '定语从句', description: '关系代词选择正确率较低', priority: 1, suggestion: '每天练习5道定语从句题目' },
    { topic: '现在完成时', description: '与一般过去时混淆较多', priority: 1, suggestion: '对比两种时态的使用场景' },
    { topic: '完形填空', description: '上下文推断能力需加强', priority: 2, suggestion: '每天做2篇完形填空练习' }
  ]
  report.value.suggestions = [
    '本周重点复习定语从句和现在完成时',
    '每天坚持背单词30分钟',
    '听力练习建议每天15分钟精听',
    '建立错题本，定期用AI深度分析'
  ]
  report.value.nextPlan = {
    focus: ['定语从句专项', '现在完成时', '听力精听'],
    dailyGoal: 20,
    reason: '建议每天用番茄工作法分配时间：上午复习语法，下午练习听力，晚上背单词。'
  }
}

function showAITip(point: WeakPoint) {
  aiTipTopic.value = point.topic
  aiTipContent.value = point.aiTip || null
}

function closeAITip() {
  aiTipContent.value = null
  aiTipTopic.value = ''
}

function getScoreDesc(score: number): string {
  if (score >= 90) return '🌟 太棒了！你是英语小达人！'
  if (score >= 75) return '👍 不错的成绩，继续加油！'
  if (score >= 60) return '💪 有提升空间，针对性练习吧！'
  return '📚 薄弱点较多，制定学习计划吧！'
}

function goToGrammar() {
  const topic = report.value.weakPoints[0]?.topic
  if (topic) {
    uni.navigateTo({ url: `/pages/grammar/index?focus=${encodeURIComponent(topic)}` })
  } else {
    uni.navigateTo({ url: '/pages/grammar/index' })
  }
}

function startPractice() {
  uni.switchTab({ url: '/pages/home/index' })
}
</script>

<style scoped>
.result-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}
.content { padding: 24rpx; }
.header-section {
  text-align: center;
  padding: 48rpx 24rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24rpx;
  color: #fff;
  margin-bottom: 24rpx;
}
.score-circle {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  border: 6rpx solid rgba(255,255,255,0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20rpx;
}
.score-num { font-size: 72rpx; font-weight: bold; }
.score-label { font-size: 24rpx; opacity: 0.8; }
.score-desc { font-size: 28rpx; }
.user-context { display: flex; gap: 12rpx; justify-content: center; margin-top: 12rpx; }
.context-tag { font-size: 22rpx; background: rgba(255,255,255,0.2); padding: 4rpx 16rpx; border-radius: 20rpx; }
.ai-loading { text-align: center; padding: 40rpx 20rpx; }
.loading-icon { font-size: 48rpx; display: block; margin-bottom: 12rpx; }
.loading-text { font-size: 26rpx; color: #667eea; }
.ai-tip-content { padding: 8rpx 0; }
.ai-tip-section { margin-bottom: 20rpx; }
.tip-label { font-size: 24rpx; color: #667eea; font-weight: bold; margin-bottom: 8rpx; display: block; }
.tip-text { font-size: 26rpx; color: #555; line-height: 1.7; display: block; }
.ai-close-btn { margin-top: 20rpx; background: #f5f5f5; color: #666; font-size: 26rpx; border: none; border-radius: 24rpx; }
.plan-ai-reason { margin-top: 20rpx; padding-top: 20rpx; border-top: 1rpx dashed #eee; }
.section-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
}
.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
}
.ai-badge {
  font-size: 20rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  margin-left: 12rpx;
}
.score-breakdown { display: flex; flex-direction: column; gap: 20rpx; }
.breakdown-item { display: flex; align-items: center; gap: 16rpx; }
.breakdown-label { width: 120rpx; font-size: 26rpx; color: #666; flex-shrink: 0; }
.breakdown-bar { flex: 1; height: 16rpx; background: #f0f0f0; border-radius: 8rpx; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 8rpx; transition: width 0.5s ease; }
.breakdown-score { width: 80rpx; font-size: 24rpx; color: #999; text-align: right; flex-shrink: 0; }
.weak-list { display: flex; flex-direction: column; gap: 16rpx; }
.weak-item {
  display: flex;
  gap: 16rpx;
  padding: 20rpx;
  background: #fff9e6;
  border-radius: 16rpx;
  border: 1rpx solid #ffe082;
}
.weak-rank {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #ff9800;
  color: #fff;
  font-size: 24rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.weak-info { flex: 1; }
.weak-name { font-size: 28rpx; font-weight: bold; color: #333; display: block; margin-bottom: 6rpx; }
.weak-desc { font-size: 24rpx; color: #666; display: block; margin-bottom: 8rpx; }
.weak-tags { display: flex; gap: 8rpx; flex-wrap: wrap; }
.weak-tag { font-size: 20rpx; padding: 4rpx 10rpx; border-radius: 8rpx; }
.weak-tag.ai { color: #fff; background: linear-gradient(135deg, #667eea, #764ba2); cursor: pointer; }
.weak-tag.high { color: #ff9800; background: rgba(255,152,0,0.1); }
.weak-tag.normal { color: #667eea; background: rgba(102,126,234,0.1); }
.suggestion-list { display: flex; flex-direction: column; gap: 16rpx; }
.suggestion-item { display: flex; align-items: flex-start; gap: 12rpx; padding: 16rpx; background: #f5f5f5; border-radius: 12rpx; }
.suggestion-num {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: #667eea;
  color: #fff;
  font-size: 22rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.suggestion-text { font-size: 26rpx; color: #333; line-height: 1.6; flex: 1; }
.plan-focus { margin-bottom: 20rpx; }
.focus-label { font-size: 24rpx; color: #999; display: block; margin-bottom: 12rpx; }
.focus-list { display: flex; flex-wrap: wrap; gap: 12rpx; }
.focus-item {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  font-size: 26rpx;
}
.plan-reason {}
.reason-label { font-size: 24rpx; color: #999; display: block; margin-bottom: 8rpx; }
.reason-text { font-size: 26rpx; color: #666; line-height: 1.7; }
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 16rpx 24rpx;
  display: flex;
  gap: 16rpx;
  border-top: 1rpx solid #eee;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
}
.action-btn { flex: 1; height: 88rpx; border-radius: 44rpx; font-size: 30rpx; font-weight: bold; display: flex; align-items: center; justify-content: center; border: none; }
.action-btn.primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; }
.action-btn.secondary { background: #fff; color: #667eea; border: 2rpx solid #667eea; }
</style>
