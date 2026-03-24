<template>
  <view class="detail-page">
    <scroll-view scroll-y class="content">
      <view class="question-card" v-if="questionData.questionText">
        <view class="card-header">
          <text class="card-title">📝 识别题目</text>
          <text class="source-tag" :class="questionData.source">
            {{ questionData.source === 'upload' ? '拍照识题' : '错题分析' }}
          </text>
        </view>
        <text class="question-text">{{ questionData.questionText }}</text>
      </view>

      <view class="image-card" v-if="questionData.imageBase64">
        <view class="card-header">
          <text class="card-title">🖼️ 原始图片</text>
        </view>
        <image 
          class="question-image" 
          :src="'data:image/jpeg;base64,' + questionData.imageBase64" 
          mode="widthFix" 
        />
      </view>

      <view class="analysis-card">
        <view class="card-header">
          <text class="card-title">🔍 AI 分析</text>
          <text class="scan-date">{{ formatDate(questionData.scanDate) }}</text>
        </view>

        <view class="analysis-grid">
          <view class="grid-item">
            <text class="grid-label">题目类型</text>
            <text class="type-badge">{{ getTypeLabel(questionData.analysis.type) }}</text>
          </view>
          <view class="grid-item">
            <text class="grid-label">难度</text>
            <text class="difficulty-badge" :class="questionData.analysis.difficulty">
              {{ getDifficultyLabel(questionData.analysis.difficulty) }}
            </text>
          </view>
        </view>

        <view class="analysis-item" v-if="questionData.analysis.knowledgePoints.length">
          <text class="label">📚 知识点</text>
          <view class="tags">
            <text class="tag" v-for="(kp, idx) in questionData.analysis.knowledgePoints" :key="idx">
              {{ kp }}
            </text>
          </view>
        </view>

        <view class="analysis-section">
          <text class="section-title">📖 详细分析</text>
          <text class="section-content">{{ questionData.analysis.analysis }}</text>
        </view>

        <view class="analysis-section suggestion">
          <text class="section-title">💡 学习建议</text>
          <text class="section-content">{{ questionData.analysis.suggestion }}</text>
        </view>
      </view>

      <view class="features-card" v-if="questionData.analysis.relatedFeatures?.length">
        <view class="card-header">
          <text class="card-title">🔗 相关功能</text>
        </view>
        <view class="feature-links">
          <view 
            class="feature-link" 
            v-for="(feature, idx) in questionData.analysis.relatedFeatures" 
            :key="idx"
            @tap="goToFeature(feature)"
          >
            {{ getFeatureLabel(feature) }}
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="bottom-bar">
      <button class="action-btn secondary" @tap="addToWrong">
        <text>📚 加入错题本</text>
      </button>
      <button class="action-btn primary" @tap="continueScan">
        <text>📷 继续扫描</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { aiService } from '@/services/ai'
import type { ScannedQuestion } from '@/services/types'

const questionData = ref<ScannedQuestion>({
  id: '',
  questionText: '',
  analysis: {
    type: 'unknown',
    difficulty: 'medium',
    knowledgePoints: [],
    analysis: '',
    suggestion: '',
    relatedFeatures: []
  },
  source: 'upload',
  scanDate: ''
})

onLoad((options: any) => {
  if (options.id) {
    const list = aiService.getScannedQuestionsList()
    const found = list.find((q: ScannedQuestion) => q.id === options.id)
    if (found) questionData.value = found
  } else if (options.index !== undefined) {
    const list = aiService.getScannedQuestionsList()
    const idx = parseInt(options.index)
    if (list[idx]) questionData.value = list[idx]
  }
})

function addToWrong() {
  const success = aiService.addScannedQuestionToWrongQuestions(questionData.value)
  uni.showToast({ 
    title: success ? '已加入错题本' : '加入失败', 
    icon: success ? 'success' : 'none' 
  })
}

function continueScan() {
  uni.navigateBack()
}

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
      uni.switchTab({ url: path })
    } else {
      uni.navigateTo({ url: path })
    }
  }
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'grammar': '语法', 'vocabulary': '词汇', 'reading': '阅读',
    'listening': '听力', 'writing': '写作', 'cloze': '完形填空', 'unknown': '其他'
  }
  return labels[type] || type
}

function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = { 'easy': '简单', 'medium': '中等', 'hard': '困难' }
  return labels[difficulty] || difficulty
}

function getFeatureLabel(feature: string): string {
  const labels: Record<string, string> = {
    'grammar': '语法学习', 'words': '背单词', 'reading': '阅读理解',
    'listening': '听力训练', 'writing': '写作练习', 'practice': '专项练习'
  }
  return labels[feature] || feature
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 140rpx;
}

.content {
  padding: 30rpx;
}

.question-card, .analysis-card, .image-card, .features-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.source-tag {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  background: #f0f0f0;
  color: #666;
}

.source-tag.upload {
  background: #e3f2fd;
  color: #1976d2;
}

.source-tag.wrong_questions {
  background: #fff3e0;
  color: #e65100;
}

.scan-date {
  font-size: 24rpx;
  color: #999;
}

.question-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.8;
  white-space: pre-wrap;
  display: block;
}

.question-image {
  width: 100%;
  border-radius: 12rpx;
  background: #f9f9f9;
}

.analysis-grid {
  display: flex;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.grid-item {
  flex: 1;
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
}

.grid-label {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-bottom: 8rpx;
}

.type-badge {
  background: #667eea;
  color: #fff;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
}

.difficulty-badge {
  font-size: 26rpx;
  font-weight: bold;
}

.difficulty-badge.easy { color: #4caf50; }
.difficulty-badge.medium { color: #ff9800; }
.difficulty-badge.hard { color: #f44336; }

.analysis-item {
  margin-bottom: 20rpx;
}

.label {
  font-size: 26rpx;
  color: #999;
  display: block;
  margin-bottom: 12rpx;
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

.analysis-section {
  margin-top: 30rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.section-content {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  display: block;
}

.analysis-section.suggestion .section-content {
  color: #ff9500;
  font-weight: 500;
}

.feature-links {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.feature-link {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 12rpx 24rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 30rpx;
  display: flex;
  gap: 20rpx;
  border-top: 1rpx solid #eee;
  box-sizing: border-box;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.action-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.action-btn.secondary {
  background: #fff;
  color: #667eea;
  border: 2rpx solid #667eea;
}
</style>
