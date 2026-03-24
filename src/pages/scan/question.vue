<template>
  <view class="scan-page">
    <!-- Tab Bar -->
    <view class="tab-bar">
      <view 
        v-for="(tab, index) in tabs" 
        :key="index"
        :class="['tab-item', currentTab === index ? 'active' : '']"
        @tap="currentTab = index"
      >
        <text class="tab-icon">{{ tab.icon }}</text>
        <text class="tab-text">{{ tab.name }}</text>
      </view>
    </view>

    <!-- Tab Content -->
    <view class="tab-content">
      <!-- Analyze Wrong Questions Tab -->
      <view v-show="currentTab === 0" class="analyze-tab">
        <view class="section-card" v-if="wrongQuestions.length > 0">
          <view class="section-header">
            <text class="section-title">📚 错题记录分析</text>
            <text class="section-subtitle">共 {{ wrongQuestions.length }} 道错题</text>
          </view>
          <view class="action-area">
            <button class="btn-primary" @tap="analyzeWrongQuestions" :disabled="isAnalyzing">
              <text v-if="!isAnalyzing">🔍 开始分析错题</text>
              <text v-else>分析中...</text>
            </button>
          </view>
          <view class="demo-hint" v-if="!hasApiKey">
            <text>💡 当前为演示模式，将返回模拟数据</text>
          </view>
        </view>
        
        <view class="empty-card" v-else>
          <text class="empty-icon">📝</text>
          <text class="empty-text">暂无错题记录</text>
          <text class="empty-hint">请先完成一些练习题，系统将自动记录错题</text>
        </view>

        <!-- Analysis Result -->
        <view class="result-card" v-if="questionResult">
          <view class="result-header">
            <text class="result-title">📊 分析结果</text>
            <text class="result-date">{{ formatDate(questionResult.scanDate) }}</text>
          </view>
          
          <view class="result-content">
            <view class="result-item">
              <text class="result-label">题目类型</text>
              <text class="result-value type-badge">{{ getTypeLabel(questionResult.analysis.type) }}</text>
            </view>
            
            <view class="result-item">
              <text class="result-label">难度</text>
              <text class="result-value">{{ getDifficultyLabel(questionResult.analysis.difficulty) }}</text>
            </view>
            
            <view class="result-item">
              <text class="result-label">知识点</text>
              <view class="tags">
                <text class="tag" v-for="(kp, idx) in questionResult.analysis.knowledgePoints" :key="idx">
                  {{ kp }}
                </text>
              </view>
            </view>
            
            <view class="result-section">
              <text class="result-section-title">📝 详细分析</text>
              <text class="result-section-content">{{ questionResult.analysis.analysis }}</text>
            </view>
            
            <view class="result-section">
              <text class="result-section-title">💡 学习建议</text>
              <text class="result-section-content suggestion">{{ questionResult.analysis.suggestion }}</text>
            </view>
            
            <view class="result-section" v-if="questionResult.analysis.relatedFeatures?.length">
              <text class="result-section-title">🔗 相关功能</text>
              <view class="feature-links">
                <view 
                  class="feature-link" 
                  v-for="(feature, idx) in questionResult.analysis.relatedFeatures" 
                  :key="idx"
                  @tap="goToFeature(feature)"
                >
                  {{ getFeatureLabel(feature) }}
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- Camera Tab -->
      <view v-show="currentTab === 1" class="camera-tab">
        <view class="camera-guide" v-if="!capturedImage">
          <text class="guide-icon">📷</text>
          <text class="guide-text">拍摄或上传题目图片</text>
          <text class="guide-hint">请确保图片清晰，文字可辨识</text>
          
          <view class="camera-actions">
            <button class="btn-primary" @tap="openCamera">
              <text>📸 拍照</text>
            </button>
            <button class="btn-secondary" @tap="chooseImage">
              <text>🖼️ 选择图片</text>
            </button>
          </view>
        </view>

        <view class="preview-area" v-else>
          <image class="preview-image" :src="capturedImage" mode="aspectFit" />
          <view class="preview-actions">
            <button class="btn-secondary" @tap="retake">
              <text>🔄 重拍</text>
            </button>
            <button class="btn-primary" @tap="analyzeImage" :disabled="isAnalyzing">
              <text v-if="!isAnalyzing">🔍 开始分析</text>
              <text v-else>分析中...</text>
            </button>
          </view>
        </view>

        <!-- Analysis Result -->
        <view class="result-card" v-if="questionResult && currentTab === 1">
          <view class="result-header">
            <text class="result-title">📊 分析结果</text>
          </view>
          <view class="result-content">
            <view class="result-item">
              <text class="result-label">题目类型</text>
              <text class="result-value type-badge">{{ getTypeLabel(questionResult.analysis.type) }}</text>
            </view>
            <view class="result-section">
              <text class="result-section-title">💡 解析与建议</text>
              <text class="result-section-content">{{ questionResult.analysis.analysis }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- History Tab -->
      <view v-show="currentTab === 2" class="history-tab">
        <view class="history-list" v-if="questionHistory.length > 0">
          <view 
            class="history-item" 
            v-for="(item, index) in questionHistory" 
            :key="index"
            @tap="viewHistoryDetail(item)"
          >
            <view class="history-info">
              <text class="history-type">{{ getTypeLabel(item.analysis.type) }}</text>
              <text class="history-date">{{ formatDate(item.scanDate) }}</text>
            </view>
            <view class="history-points">
              <text class="point-tag" v-for="(kp, idx) in item.analysis.knowledgePoints.slice(0, 2)" :key="idx">
                {{ kp }}
              </text>
            </view>
            <text class="history-arrow">›</text>
          </view>
        </view>
        
        <view class="empty-card" v-else>
          <text class="empty-icon">📋</text>
          <text class="empty-text">暂无分析历史</text>
          <text class="empty-hint">完成分析后将自动保存记录</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { aiService, type QuestionScanResult, type QuestionAnalysis } from '@/services/ai'

const tabs = [
  { name: '分析错题', icon: '📚' },
  { name: '拍照识题', icon: '📷' },
  { name: '历史记录', icon: '📋' }
]

const currentTab = ref(0)
const isAnalyzing = ref(false)
const questionResult = ref<QuestionScanResult | null>(null)
const questionHistory = ref<QuestionScanResult[]>([])
const wrongQuestions = ref<any[]>([])
const capturedImage = ref('')
const capturedFile = ref<any>(null)
const hasApiKey = ref(true)

// Initialize
onMounted(() => {
  checkApiKey()
  loadWrongQuestions()
  loadHistory()
})

function checkApiKey() {
  const settings = uni.getStorageSync('app_settings') || {}
  hasApiKey.value = !!settings.apiKey
}

function loadWrongQuestions() {
  const records = uni.getStorageSync('wrong_questions') || []
  wrongQuestions.value = records
}

function loadHistory() {
  questionHistory.value = aiService.getQuestionScanHistory()
}

// Analyze wrong questions
async function analyzeWrongQuestions() {
  if (wrongQuestions.value.length === 0) {
    uni.showToast({ title: '暂无错题记录', icon: 'none' })
    return
  }
  
  isAnalyzing.value = true
  try {
    const result = await aiService.analyzeWrongQuestions(wrongQuestions.value)
    questionResult.value = result
    questionHistory.value = aiService.getQuestionScanHistory()
    uni.showToast({ title: '分析完成', icon: 'success' })
  } catch (e: any) {
    uni.showToast({ title: e.message || '分析失败', icon: 'none' })
  } finally {
    isAnalyzing.value = false
  }
}

// Camera functions
function openCamera() {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera'],
    success: (res) => {
      capturedImage.value = (res.tempFiles[0] as any).path || res.tempFilePaths[0]
      capturedFile.value = res.tempFiles[0] as any
    }
  })
}

function chooseImage() {
  uni.chooseImage({
    count: 1,
    sourceType: ['album'],
    success: (res) => {
      capturedImage.value = (res.tempFiles[0] as any).path || res.tempFilePaths[0]
      capturedFile.value = res.tempFiles[0] as any
    }
  })
}

function retake() {
  capturedImage.value = ''
  capturedFile.value = null
  questionResult.value = null
}

async function analyzeImage() {
  if (!capturedImage.value) return
  
  isAnalyzing.value = true
  try {
    const base64 = await getBase64FromFile(capturedFile.value, capturedImage.value)
    const result = await aiService.scanQuestionImage(base64)
    questionResult.value = result
    questionHistory.value = aiService.getQuestionScanHistory()
    uni.showToast({ title: '分析完成', icon: 'success' })
  } catch (e: any) {
    uni.showToast({ title: e.message || '分析失败', icon: 'none' })
  } finally {
    isAnalyzing.value = false
  }
}

function getBase64FromFile(file: any, path: string): Promise<string> {
  // H5 with File object (preferred)
  if (file && typeof window !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.replace(/^data:image\/\w+;base64,/, ''))
      }
      reader.onerror = () => reject(new Error('读取图片失败'))
      reader.readAsDataURL(file)
    })
  }
  // Fallback: data URL path
  if (path.startsWith('data:')) {
    return Promise.resolve(path.replace(/^data:image\/\w+;base64,/, ''))
  }
  // WeChat mini-program
  return new Promise((resolve, reject) => {
    if (typeof uni.getFileSystemManager !== 'function') {
      reject(new Error('无法读取图片'))
      return
    }
    uni.getFileSystemManager().readFile({
      filePath: path,
      encoding: 'base64',
      success: (res) => { resolve(res.data as string) },
      fail: reject
    })
  })
}

// View history detail
function viewHistoryDetail(item: QuestionScanResult) {
  const list = aiService.getScannedQuestionsList()
  const idx = list.findIndex((q: any) => q.id === item.id || q.scanDate === item.scanDate)
  if (idx >= 0) {
    uni.navigateTo({ url: `/pages/scan/question-detail?index=${idx}` })
  } else {
    questionResult.value = item
    currentTab.value = 0
  }
}

// Navigation
function goToFeature(feature: string) {
  const pages: Record<string, string> = {
    'grammar': '/pages/grammar/index',
    'words': '/pages/words/index',
    'reading': '/pages/reading/index',
    'listening': '/pages/listening/index',
    'writing': '/pages/writing/index',
    'practice': '/pages/practice/index'
  }
  
  const path = pages[feature]
  if (path) {
    if (feature === 'words') {
      // words is in tabBar, must use switchTab
      uni.switchTab({ url: path })
    } else {
      uni.navigateTo({ url: path })
    }
  } else {
    uni.switchTab({ url: '/pages/home/index' })
  }
}

// Helpers
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'grammar': '语法',
    'vocabulary': '词汇',
    'reading': '阅读',
    'listening': '听力',
    'writing': '写作',
    'cloze': '完形填空',
    'unknown': '其他'
  }
  return labels[type] || type
}

function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    'easy': '简单',
    'medium': '中等',
    'hard': '困难'
  }
  return labels[difficulty] || difficulty
}

function getFeatureLabel(feature: string): string {
  const labels: Record<string, string> = {
    'grammar': '语法学习',
    'words': '背单词',
    'reading': '阅读理解',
    'listening': '听力训练',
    'writing': '写作练习',
    'practice': '专项练习'
  }
  return labels[feature] || feature
}
</script>

<style scoped>
.scan-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}

.tab-bar {
  display: flex;
  background: #fff;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10rpx 0;
}

.tab-item.active .tab-text {
  color: #667eea;
  font-weight: bold;
}

.tab-icon {
  font-size: 40rpx;
  margin-bottom: 4rpx;
}

.tab-text {
  font-size: 24rpx;
  color: #666;
}

.tab-content {
  padding: 30rpx;
}

/* Cards */
.section-card, .result-card, .empty-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.section-header {
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.section-subtitle {
  font-size: 26rpx;
  color: #999;
  margin-top: 8rpx;
}

/* Buttons */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 50rpx;
  padding: 24rpx 60rpx;
  font-size: 30rpx;
  font-weight: bold;
}

.btn-secondary {
  background: #fff;
  color: #667eea;
  border: 2rpx solid #667eea;
  border-radius: 50rpx;
  padding: 22rpx 50rpx;
  font-size: 30rpx;
}

.action-area {
  display: flex;
  justify-content: center;
}

.demo-hint {
  text-align: center;
  margin-top: 20rpx;
  color: #ff9500;
  font-size: 24rpx;
}

/* Empty state */
.empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
}

.empty-hint {
  font-size: 26rpx;
  color: #999;
  margin-top: 10rpx;
}

/* Result */
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.result-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.result-date {
  font-size: 24rpx;
  color: #999;
}

.result-item {
  margin-bottom: 20rpx;
}

.result-label {
  font-size: 26rpx;
  color: #999;
  display: block;
  margin-bottom: 8rpx;
}

.result-value {
  font-size: 30rpx;
  color: #333;
}

.type-badge {
  background: #667eea;
  color: #fff;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.tag {
  background: #f0f0f0;
  color: #666;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.result-section {
  margin-top: 30rpx;
}

.result-section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.result-section-content {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

.result-section-content.suggestion {
  color: #ff9500;
  font-weight: 500;
}

.feature-links {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 16rpx;
}

.feature-link {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 12rpx 24rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
}

/* Camera Tab */
.camera-guide {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 40rpx;
  background: #fff;
  border-radius: 20rpx;
}

.guide-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.guide-text {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}

.guide-hint {
  font-size: 26rpx;
  color: #999;
  margin-top: 10rpx;
}

.camera-actions {
  display: flex;
  gap: 30rpx;
  margin-top: 50rpx;
}

.preview-area {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
}

.preview-image {
  width: 100%;
  height: 400rpx;
  border-radius: 10rpx;
  background: #f5f5f5;
}

.preview-actions {
  display: flex;
  justify-content: center;
  gap: 30rpx;
  margin-top: 30rpx;
}

/* History Tab */
.history-list {
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.history-item:last-child {
  border-bottom: none;
}

.history-info {
  flex: 1;
}

.history-type {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  display: block;
}

.history-date {
  font-size: 24rpx;
  color: #999;
  margin-top: 6rpx;
  display: block;
}

.history-points {
  display: flex;
  gap: 10rpx;
}

.point-tag {
  background: #f0f0f0;
  color: #666;
  padding: 4rpx 12rpx;
  border-radius: 10rpx;
  font-size: 22rpx;
}

.history-arrow {
  font-size: 40rpx;
  color: #ccc;
  margin-left: 20rpx;
}
</style>
