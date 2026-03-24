<template>
  <view class="scan-page">
    <view class="header">
      <text class="title">📷 AI 识单词</text>
      <text class="subtitle">拍照识别英语单词，智能构建单词本</text>
    </view>

    <view class="tabs">
      <view :class="['tab', currentTab === 0 ? 'active' : '']" @tap="currentTab = 0">
        拍照识别
      </view>
      <view :class="['tab', currentTab === 1 ? 'active' : '']" @tap="currentTab = 1; loadHistory()">
        扫描历史
      </view>
    </view>

    <view v-if="currentTab === 0" class="tab-content">
      <view class="upload-section" @tap="chooseImage">
        <view v-if="!imagePath" class="upload-placeholder">
          <text class="icon">📖</text>
          <text class="text">点击拍照或选择图片</text>
          <text class="hint">支持书本、杂志、路标等英文内容</text>
        </view>
        <image v-else :src="imagePath" mode="aspectFit" class="preview-image" />
      </view>

      <view v-if="imagePath" class="action-section">
        <button class="scan-btn" :loading="scanning" @tap="scanWords">
          {{ scanning ? '识别中...' : '开始识别' }}
        </button>
        <button class="retry-btn" @tap="chooseImage">重新选择</button>
      </view>

      <view v-if="result" class="result-section">
        <view class="result-header">
          <text class="result-title">识别结果</text>
          <text class="word-count">共 {{ result.words.length }} 个单词</text>
        </view>

        <view v-if="result.notInList.length > 0" class="not-in-list-warning">
          <text class="warning-icon">⚠️</text>
          <text class="warning-text">以下单词不在3500词范围内：{{ result.notInList.join(', ') }}</text>
        </view>

        <view v-if="result.words.length > 0" class="words-list">
          <view v-for="(word, index) in result.words" :key="index" class="word-card">
            <view class="word-header">
              <text class="word">{{ word.word }}</text>
              <text class="phonetic">{{ word.phonetic }}</text>
            </view>
            <view class="word-definition">{{ word.definition }}</view>
            <view v-if="word.example" class="word-example">
              <text class="example-label">例句：</text>
              <text class="example-text">{{ word.example }}</text>
            </view>
            <view class="word-actions">
              <view 
                :class="['mastery-tag', word.mastery]"
                @tap="toggleMastery(index)"
              >
                {{ getMasteryName(word.mastery) }}
              </view>
            </view>
          </view>
        </view>

        <view v-if="result.words.length > 0" class="action-btns">
          <button class="add-btn" @tap="addToWordBook">
            📚 添加到单词本
          </button>
          <button class="learn-btn" @tap="startLearning">
            🚀 开始背单词
          </button>
        </view>
      </view>
    </view>

    <view v-if="currentTab === 1" class="tab-content">
      <view v-if="history.length === 0" class="empty-history">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无扫描历史</text>
      </view>

      <view v-else class="history-list">
        <view 
          v-for="(item, index) in history" 
          :key="index" 
          class="history-item"
          @tap="viewHistoryDetail(item)"
        >
          <view class="history-info">
            <text class="history-date">{{ formatDate(item.scanDate) }}</text>
            <text class="history-count">识别了 {{ item.words.length }} 个单词</text>
          </view>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { aiService, type WordScanResult, type WordInfo } from '@/services/ai'
import { wordService } from '@/services/word'

const currentTab = ref(0)
const imagePath = ref('')
const scanning = ref(false)
const result = ref<WordScanResult | null>(null)
const history = ref<WordScanResult[]>([])

let wordList: string[] = []

onMounted(async () => {
  await loadWordList()
})

async function loadWordList() {
  try {
    const words = await wordService.loadWords()
    wordList = words.map((w: any) => w.word).filter(Boolean)
  } catch (e) {
    console.error('Failed to load word list:', e)
  }
}

function loadHistory() {
  history.value = aiService.getScannedWordsHistory()
}

function chooseImage() {
  uni.chooseImage({
    count: 1,
    sourceType: ['album', 'camera'],
    success: (res) => {
      imagePath.value = res.tempFilePaths[0]
      result.value = null
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

async function scanWords() {
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
    result.value = await aiService.scanWords(base64, wordList)
    result.value.imagePath = imagePath.value
    
    if (result.value.words.length === 0 && result.value.notInList.length === 0) {
      uni.showToast({
        title: '未识别到单词，请重试',
        icon: 'none'
      })
    }
  } catch (e: any) {
    uni.showToast({
      title: e.message || '识别失败',
      icon: 'none'
    })
  } finally {
    scanning.value = false
  }
}

function getMasteryName(mastery: string): string {
  const map: Record<string, string> = {
    known: '✅ 已掌握',
    learning: '📚 学习中',
    unknown: '❌ 不认识'
  }
  return map[mastery] || '❌ 不认识'
}

function toggleMastery(index: number) {
  if (!result.value) return
  const current = result.value.words[index].mastery
  const next: Record<string, string> = {
    unknown: 'learning',
    learning: 'known',
    known: 'unknown'
  }
  result.value.words[index].mastery = next[current] as any
}

function addToWordBook() {
  if (!result.value) return

  const unknownWords = result.value.words.filter(w => w.mastery !== 'known')
  
  if (unknownWords.length === 0) {
    uni.showToast({
      title: '所有单词都已掌握！',
      icon: 'success'
    })
    return
  }

  aiService.saveScannedWords(result.value)

  const existingWords = uni.getStorageSync('scanned_words') || []
  const newWords = unknownWords.map(w => ({
    ...w,
    addedDate: new Date().toISOString()
  }))
  
  uni.setStorageSync('scanned_words', [...existingWords, ...newWords])
  
  uni.showToast({
    title: `已添加 ${newWords.length} 个单词`,
    icon: 'success'
  })
}

function startLearning() {
  uni.switchTab({
    url: '/pages/words/index'
  })
}

function viewHistoryDetail(item: WordScanResult) {
  result.value = item
  currentTab.value = 0
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
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
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
  font-size: 16px;
  color: #666;
  position: relative;
}

.tab.active {
  color: #11998e;
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
  background: #11998e;
  border-radius: 2px;
}

.tab-content {
  padding-bottom: 40px;
}

.upload-section {
  margin: 20px;
  background: #fff;
  border-radius: 12px;
  min-height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
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
  padding: 0 20px;
  display: flex;
  gap: 12px;
}

.scan-btn {
  flex: 1;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: #fff;
  border: none;
  padding: 14px;
  border-radius: 30px;
  font-size: 16px;
}

.retry-btn {
  flex: 1;
  background: #fff;
  color: #11998e;
  border: 1px solid #11998e;
  padding: 14px;
  border-radius: 30px;
  font-size: 16px;
}

.result-section {
  padding: 20px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.result-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.word-count {
  font-size: 14px;
  color: #666;
}

.not-in-list-warning {
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
}

.warning-icon {
  margin-right: 8px;
}

.warning-text {
  font-size: 14px;
  color: #fa8c16;
  flex: 1;
}

.words-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.word-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
}

.word-header {
  display: flex;
  align-items: baseline;
  margin-bottom: 8px;
}

.word {
  font-size: 20px;
  font-weight: bold;
  color: #11998e;
  margin-right: 12px;
}

.phonetic {
  font-size: 14px;
  color: #999;
}

.word-definition {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.word-example {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.example-label {
  font-size: 12px;
  color: #666;
}

.example-text {
  font-size: 14px;
  color: #333;
  font-style: italic;
}

.word-actions {
  display: flex;
  justify-content: flex-end;
}

.mastery-tag {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
}

.mastery-known {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.mastery-learning {
  background: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}

.mastery-unknown {
  background: #fff1f0;
  color: #ff4d4f;
  border: 1px solid #ffa39e;
}

.action-btns {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.add-btn {
  background: #fff;
  color: #11998e;
  border: 1px solid #11998e;
  padding: 14px;
  border-radius: 30px;
  font-size: 16px;
}

.learn-btn {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: #fff;
  border: none;
  padding: 14px;
  border-radius: 30px;
  font-size: 16px;
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
  margin: 20px;
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

.history-date {
  font-size: 16px;
  color: #333;
  display: block;
  margin-bottom: 4px;
}

.history-count {
  font-size: 14px;
  color: #999;
}

.arrow {
  font-size: 20px;
  color: #ccc;
}
</style>
