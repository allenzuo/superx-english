<template>
  <view class="scan-page">
    <view class="header">
      <text class="title">📷 AI 识题</text>
      <text class="subtitle">分析错题记录，识别薄弱知识点</text>
    </view>

    <view class="tabs">
      <view :class="['tab', currentTab === 0 ? 'active' : '']" @tap="currentTab = 0">
        分析错题
      </view>
      <view :class="['tab', currentTab === 1 ? 'active' : '']" @tap="currentTab = 1">
        拍照识题
      </view>
      <view :class="['tab', currentTab === 2 ? 'active' : '']" @tap="currentTab = 2; loadHistory()">
        历史记录
      </view>
    </view>

    <view v-if="currentTab === 0" class="tab-content">
      <view class="intro-card">
        <text class="intro-icon">🧠</text>
        <text class="intro-title">AI 智能分析</text>
        <text class="intro-desc">基于您的错题记录，AI 将分析您的知识薄弱点，并给出针对性的学习建议</text>
      </view>

      <view class="stats-preview">
        <view class="stat-item">
          <text class="stat-value">{{ wrongQuestionsCount }}</text>
          <text class="stat-label">错题总数</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ uniqueTopics }}</text>
          <text class="stat-label">涉及知识点</text>
        </view>
      </view>

      <view class="action-area">
        <button class="analyze-btn" :loading="analyzing" @tap="analyzeWrongQuestions">
          {{ analyzing ? '分析中...' : '开始 AI 分析' }}
        </button>
      </view>

      <view v-if="result" class="result-section">
        <view class="result-card">
          <text class="card-title">🔍 分析结果</text>
          <view class="info-row">
            <text class="label">主要问题类型：</text>
            <text class="value">{{ getTypeName(result.analysis.type) }}</text>
          </view>
          <view class="info-row">
            <text class="label">难度：</text>
            <text :class="['value', 'difficulty-' + result.analysis.difficulty]">
              {{ getDifficultyName(result.analysis.difficulty) }}
            </text>
          </view>
        </view>

        <view class="result-card">
          <text class="card-title">📚 知识点梳理</text>
          <view class="knowledge-tags">
            <text v-for="kp in result.analysis.knowledgePoints" :key="kp" class="tag">
              {{ kp }}
            </text>
          </view>
        </view>

        <view class="result-card">
          <text class="card-title">📝 问题分析</text>
          <text class="content">{{ result.analysis.analysis }}</text>
        </view>

        <view class="result-card">
          <text class="card-title">💡 学习建议</text>
          <text class="content highlight">{{ result.analysis.suggestion }}</text>
        </view>

        <view class="result-card">
          <text class="card-title">🔗 推荐学习</text>
          <view class="features">
            <view 
              v-for="feature in result.analysis.relatedFeatures" 
              :key="feature" 
              class="feature-btn"
              @tap="goToFeature(feature)"
            >
              {{ getFeatureName(feature) }}
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="currentTab === 1" class="tab-content">
      <view class="upload-section" @tap="chooseImage">
        <view v-if="!imagePath" class="upload-placeholder">
          <text class="icon">📸</text>
          <text class="text">点击拍照或选择图片</text>
          <text class="hint">支持试卷、练习册、作业照片</text>
        </view>
        <image v-else :src="imagePath" mode="aspectFit" class="preview-image" />
      </view>

      <view v-if="imagePath" class="action-section">
        <button class="scan-btn" :loading="scanning" @tap="scanQuestionImage">
          {{ scanning ? '识别中...' : '开始识别' }}
        </button>
        <button class="retry-btn" @tap="chooseImage">重新选择</button>
      </view>

      <view v-if="scanResult" class="result-section">
        <view class="result-card">
          <text class="card-title">🔍 识别结果</text>
          <view class="info-row">
            <text class="label">题目类型：</text>
            <text class="value">{{ getTypeName(scanResult.analysis.type) }}</text>
          </view>
          <view class="info-row">
            <text class="label">难度：</text>
            <text :class="['value', 'difficulty-' + scanResult.analysis.difficulty]">
              {{ getDifficultyName(scanResult.analysis.difficulty) }}
            </text>
          </view>
        </view>

        <view class="result-card">
          <text class="card-title">📝 详细解析</text>
          <text class="content">{{ scanResult.analysis.analysis }}</text>
        </view>

        <view class="result-card">
          <text class="card-title">💡 学习建议</text>
          <text class="content highlight">{{ scanResult.analysis.suggestion }}</text>
        </view>

        <view class="result-card">
          <text class="card-title">🔗 推荐功能</text>
          <view class="features">
            <view 
              v-for="feature in scanResult.analysis.relatedFeatures" 
              :key="feature" 
              class="feature-btn"
              @tap="goToFeature(feature)"
            >
              {{ getFeatureName(feature) }}
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="currentTab === 2" class="tab-content">
      <view v-if="history.length === 0" class="empty-history">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无分析历史</text>
      </view>

      <view v-else class="history-list">
        <view 
          v-for="(item, index) in history" 
          :key="index" 
          class="history-item"
          @tap="viewHistoryDetail(item)"
        >
          <view class="history-info">
            <text class="history-source">
              {{ item.source === 'wrong_questions' ? '📊 错题分析' : '📷 拍照识题' }}
            </text>
            <text class="history-date">{{ formatDate(item.scanDate) }}</text>
          </view>
          <view class="history-summary">
            <text class="summary-type">{{ getTypeName(item.analysis.type) }}</text>
            <text class="arrow">›</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { aiService, type QuestionScanResult } from '@/services/ai'

const currentTab = ref(0)
const wrongQuestionsCount = ref(0)
const analyzing = ref(false)
const result = ref<QuestionScanResult | null>(null)

const imagePath = ref('')
const scanning = ref(false)
const scanResult = ref<QuestionScanResult | null>(null)

const history = ref<QuestionScanResult[]>([])

onMounted(() => {
  loadWrongQuestionsCount()
})

function loadWrongQuestionsCount() {
  const wrongQuestions = uni.getStorageSync('wrong_questions') || []
  wrongQuestionsCount.value = wrongQuestions.length
  
  const unique = new Set(wrongQuestions.map((q: any) => q.type || q.knowledge))
  uniqueTopics.value = unique.size
}

const uniqueTopics = ref(0)

function loadHistory() {
  history.value = aiService.getQuestionScanHistory()
}

async function analyzeWrongQuestions() {
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

  const wrongQuestions = uni.getStorageSync('wrong_questions') || []
  if (wrongQuestions.length === 0) {
    uni.showToast({
      title: '暂无错题数据',
      icon: 'none'
    })
    return
  }

  analyzing.value = true
  try {
    result.value = await aiService.analyzeWrongQuestions(wrongQuestions)
  } catch (e: any) {
    uni.showToast({
      title: e.message || '分析失败',
      icon: 'none'
    })
  } finally {
    analyzing.value = false
  }
}

function chooseImage() {
  uni.chooseImage({
    count: 1,
    sourceType: ['album', 'camera'],
    success: (res) => {
      imagePath.value = res.tempFilePaths[0]
      scanResult.value = null
    }
  })
}

function getImageBase64(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.getFileSystemManager().readFile({
      filePath: path,
      encoding: 'base64',
      success: (res) => {
        resolve(res.data as string)
      },
      fail: reject
    })
  })
}

async function scanQuestionImage() {
  if (!imagePath.value) return

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

  scanning.value = true
  try {
    const base64 = await getImageBase64(imagePath.value)
    scanResult.value = await aiService.scanQuestionImage(base64)
  } catch (e: any) {
    uni.showToast({
      title: e.message || '识别失败',
      icon: 'none'
    })
  } finally {
    scanning.value = false
  }
}

function viewHistoryDetail(item: QuestionScanResult) {
  if (item.source === 'wrong_questions') {
    result.value = item
  } else {
    scanResult.value = item
    imagePath.value = item.imagePath || ''
  }
  currentTab.value = item.source === 'wrong_questions' ? 0 : 1
}

function getTypeName(type: string): string {
  const map: Record<string, string> = {
    grammar: '语法题',
    vocabulary: '词汇题',
    reading: '阅读理解',
    listening: '听力题',
    writing: '写作题',
    cloze: '完形填空',
    unknown: '未知'
  }
  return map[type] || '未知'
}

function getDifficultyName(difficulty: string): string {
  const map: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return map[difficulty] || '中等'
}

function getFeatureName(feature: string): string {
  const map: Record<string, string> = {
    grammar: '📚 语法学习',
    words: '📖 单词学习',
    reading: '📝 阅读练习',
    listening: '🎧 听力练习',
    writing: '✍️ 写作练习',
    wrong: '📚 错题复习'
  }
  return map[feature] || feature
}

function goToFeature(feature: string) {
  const routes: Record<string, string> = {
    grammar: '/pages/grammar/index',
    words: '/pages/words/index',
    reading: '/pages/reading/index',
    listening: '/pages/listening/index',
    writing: '/pages/writing/index',
    wrong: '/pages/wrong/index'
  }
  
  const url = routes[feature]
  if (url) {
    uni.switchTab({ url })
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.scan-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  color: #667eea;
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
  background: #667eea;
  border-radius: 2px;
}

.tab-content {
  padding: 20px;
  padding-bottom: 40px;
}

.intro-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  margin-bottom: 20px;
}

.intro-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.intro-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

.intro-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.stats-preview {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.stat-item {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #667eea;
  display: block;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.action-area {
  margin-bottom: 20px;
}

.analyze-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  padding: 16px;
  border-radius: 30px;
  font-size: 16px;
}

.result-section {
  margin-top: 20px;
}

.result-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.info-row .label {
  font-size: 14px;
  color: #666;
  width: 100px;
  flex-shrink: 0;
}

.info-row .value {
  font-size: 14px;
  color: #333;
  flex: 1;
}

.difficulty-easy {
  color: #52c41a;
}

.difficulty-medium {
  color: #faad14;
}

.difficulty-hard {
  color: #ff4d4f;
}

.knowledge-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  background: #f0f0f0;
  color: #666;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
}

.content {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
}

.content.highlight {
  color: #667eea;
  font-weight: 500;
}

.features {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.feature-btn {
  background: linear-gradient(135deg, #667eea20%, #764ba220%);
  border: 1px solid #667eea;
  color: #667eea;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 20px;
}

.upload-section {
  background: #fff;
  border-radius: 12px;
  min-height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 20px;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-placeholder .icon {
  font-size: 60px;
  margin-bottom: 16px;
}

.upload-placeholder .text {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
}

.upload-placeholder .hint {
  font-size: 12px;
  color: #999;
}

.preview-image {
  width: 100%;
  max-height: 350px;
}

.action-section {
  display: flex;
  gap: 12px;
}

.scan-btn, .retry-btn {
  flex: 1;
  padding: 14px;
  border-radius: 30px;
  font-size: 16px;
}

.scan-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
}

.retry-btn {
  background: #fff;
  color: #667eea;
  border: 1px solid #667eea;
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

.history-source {
  font-size: 16px;
  color: #333;
  display: block;
  margin-bottom: 4px;
}

.history-date {
  font-size: 12px;
  color: #999;
}

.history-summary {
  display: flex;
  align-items: center;
}

.summary-type {
  font-size: 14px;
  color: #666;
  margin-right: 8px;
}

.arrow {
  font-size: 20px;
  color: #ccc;
}
</style>
