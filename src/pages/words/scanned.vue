<template>
  <view class="scanned-page">
    <view class="stats-bar">
      <view class="stat-item">
        <text class="stat-num">{{ stats.total }}</text>
        <text class="stat-label">总数</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num mastered">{{ stats.mastered }}</text>
        <text class="stat-label">已掌握</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num unmastered">{{ stats.unmastered }}</text>
        <text class="stat-label">待学习</text>
      </view>
    </view>

    <view class="content-wrapper">
      <view v-if="isLoading" class="loading">
        <text>加载中...</text>
      </view>
      
      <view v-else-if="displayWords.length === 0" class="empty">
        <text class="empty-icon">📷</text>
        <text class="empty-text">还没有扫描的单词</text>
        <text class="empty-hint">去 AI 识单词 扫描教材或试卷上的单词吧</text>
      </view>
      
      <view v-else class="word-cards">
        <view 
          class="word-card"
          :class="{ mastered: word.mastered }"
          v-for="word in displayWords" 
          :key="word.id"
        >
          <view class="word-main" @tap="viewWordDetail(word)">
            <text class="word">{{ word.word }}</text>
            <text class="phonetic" v-if="word.phonetic">{{ word.phonetic }}</text>
          </view>
          <view class="word-meaning" v-if="word.definition" @tap="viewWordDetail(word)">
            <text class="definition">{{ word.definition }}</text>
            <text class="example" v-if="word.example">"{{ word.example }}"</text>
          </view>
          <view class="word-meta">
            <text class="meta-date">{{ formatDate(word.scannedAt) }} 扫描</text>
            <view class="word-actions">
              <view class="mastery-toggle" @tap.stop="toggleMastery(word)">
                <text :class="['mastery-tag', word.mastered ? 'mastered' : '']">
                  {{ word.mastered ? '✓ 已掌握' : '☆ 掌握' }}
                </text>
              </view>
              <text class="delete-btn" @tap.stop="deleteWord(word)">🗑️</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { aiService } from '@/services/ai'
import type { ScannedWord } from '@/services/types'

const displayWords = ref<ScannedWord[]>([])
const stats = ref({ total: 0, mastered: 0, unmastered: 0 })
const isLoading = ref(true)

onMounted(() => {
  loadWords()
})

function loadWords() {
  isLoading.value = true
  displayWords.value = aiService.getScannedWordsList()
  stats.value = aiService.getScannedWordStats()
  isLoading.value = false
}

function viewWordDetail(word: ScannedWord) {
  const wordData = {
    word: word.word,
    phonetic: word.phonetic || '',
    type: '',
    meaning: word.definition || '',
    example: word.example || '',
    memory_methods: '',
    usage_notes: '',
    common_mistakes: '',
    example_sentences: word.example ? { exam: [word.example] } : undefined,
    example_translations: []
  }
  
  try {
    const encoded = encodeURIComponent(JSON.stringify([wordData]))
    uni.navigateTo({ 
      url: `/pages/words/detail?wordList=${encoded}&currentIndex=0&from=scanned` 
    })
  } catch (e) {
    console.error('Navigate error:', e)
  }
}

function toggleMastery(word: ScannedWord) {
  const newState = !word.mastered
  aiService.updateScannedWordMastery(word.id, newState)
  word.mastered = newState
  stats.value = aiService.getScannedWordStats()
  uni.showToast({ 
    title: newState ? '已掌握' : '取消掌握', 
    icon: 'none' 
  })
}

function deleteWord(word: ScannedWord) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除单词 "${word.word}" 吗？`,
    success: (res) => {
      if (res.confirm) {
        aiService.deleteScannedWord(word.id)
        loadWords()
        uni.showToast({ title: '已删除', icon: 'success' })
      }
    }
  })
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>

<style scoped>
.scanned-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.stats-bar {
  display: flex;
  background: #fff;
  padding: 24rpx;
  justify-content: space-around;
  border-bottom: 1rpx solid #eee;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-num {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.stat-num.mastered { color: #52c41a; }
.stat-num.unmastered { color: #ff9500; }

.stat-label {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: #eee;
  align-self: center;
}

.content-wrapper {
  padding: 20rpx 20rpx 20rpx 16rpx;
  overflow-x: hidden;
  box-sizing: border-box;
  width: 100vw;
}

.loading, .empty {
  text-align: center;
  padding: 80rpx 40rpx;
  color: #999;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
  display: block;
}

.empty-hint {
  font-size: 26rpx;
  color: #999;
  margin-top: 12rpx;
  display: block;
}

.word-cards {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.word-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  border: 1rpx solid #e0e0e0;
}

.word-card.mastered {
  background: #f0f9ff;
  border-color: #667eea;
}

.word-main {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.word {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.phonetic {
  font-size: 24rpx;
  color: #999;
}

.word-meaning {
  margin-bottom: 8rpx;
}

.definition {
  font-size: 26rpx;
  color: #666;
  display: block;
}

.example {
  font-size: 24rpx;
  color: #aaa;
  font-style: italic;
  display: block;
  margin-top: 4rpx;
}

.word-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-date {
  font-size: 22rpx;
  color: #bbb;
}

.word-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.mastery-toggle {
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  background: #f5f5f5;
}

.mastery-tag {
  font-size: 24rpx;
  color: #999;
}

.mastery-tag.mastered {
  color: #52c41a;
}

.delete-btn {
  font-size: 28rpx;
  padding: 4rpx 8rpx;
}
</style>
