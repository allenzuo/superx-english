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
      <!-- Scan Tab -->
      <view v-show="currentTab === 0" class="scan-tab">
        <view class="scan-intro">
          <view class="intro-card">
            <text class="intro-icon">📖</text>
            <text class="intro-title">拍照识别英语单词</text>
            <text class="intro-desc">拍摄英语文本，自动识别单词并与中考3500词对照</text>
          </view>
          
          <view class="demo-hint" v-if="!hasApiKey">
            <text>💡 当前为演示模式，将返回模拟数据</text>
          </view>
        </view>

        <view class="camera-area" v-if="!capturedImage">
          <view class="camera-actions">
            <button class="btn-primary large" @tap="openCamera">
              <text>📸 拍照识别</text>
            </button>
            <button class="btn-secondary large" @tap="chooseImage">
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
            <button class="btn-primary" @tap="scanWords" :disabled="isScanning">
              <text v-if="!isScanning">🔍 开始识别</text>
              <text v-else>识别中...</text>
            </button>
          </view>
        </view>

        <!-- Scan Result -->
        <view class="result-card" v-if="wordResult">
          <view class="result-header">
            <text class="result-title">📚 识别结果</text>
            <text class="result-count">共识别 {{ wordResult.words.length }} 个单词</text>
          </view>

          <!-- In List Words -->
          <view class="word-section" v-if="wordResult.words.length > 0">
            <view class="section-title-row">
              <text class="section-title">✅ 已掌握 ({{ wordResult.words.length }})</text>
              <text class="section-hint">在中考3500词范围内</text>
            </view>
            
            <view class="word-list">
              <view class="word-item" v-for="(word, idx) in wordResult.words" :key="idx">
                <view class="word-main">
                  <text class="word-text">{{ word.word }}</text>
                  <text class="word-phonetic">{{ word.phonetic }}</text>
                </view>
                <view class="word-meaning">
                  <text class="word-definition">{{ word.definition }}</text>
                  <text class="word-example" v-if="word.example">{{ word.example }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- Not In List Words -->
          <view class="word-section" v-if="wordResult.notInList.length > 0">
            <view class="section-title-row">
              <text class="section-title">📝 拓展词汇 ({{ wordResult.notInList.length }})</text>
              <text class="section-hint">不在中考3500词范围内</text>
            </view>
            
            <view class="extra-words">
              <text class="extra-word" v-for="(word, idx) in wordResult.notInList" :key="idx">
                {{ word }}
              </text>
            </view>
          </view>

          <view class="result-actions">
            <button class="btn-action" @tap="saveToWordBook">
              <text>📖 加入生词本</text>
            </button>
            <button class="btn-action secondary" @tap="practiceWords">
              <text>🎯 开始练习</text>
            </button>
          </view>
        </view>
      </view>

      <!-- History Tab -->
      <view v-show="currentTab === 1" class="history-tab">
        <view class="history-list" v-if="wordHistory.length > 0">
          <view 
            class="history-item" 
            v-for="(item, index) in wordHistory" 
            :key="index"
            @tap="viewHistoryDetail(item)"
          >
            <view class="history-info">
              <text class="history-count">{{ item.words.length }} 个单词</text>
              <text class="history-date">{{ formatDate(item.scanDate) }}</text>
            </view>
            <view class="history-preview">
              <text class="preview-text">{{ item.words.slice(0, 3).map(w => w.word).join(', ') }}...</text>
            </view>
            <text class="history-arrow">›</text>
          </view>
        </view>
        
        <view class="empty-card" v-else>
          <text class="empty-icon">📖</text>
          <text class="empty-text">暂无扫描历史</text>
          <text class="empty-hint">扫描单词后将自动保存记录</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { aiService, type WordScanResult } from '@/services/ai'

const tabs = [
  { name: '扫描单词', icon: '📷' },
  { name: '历史记录', icon: '📋' }
]

const currentTab = ref(0)
const isScanning = ref(false)
const wordResult = ref<WordScanResult | null>(null)
const wordHistory = ref<WordScanResult[]>([])
const capturedImage = ref('')
const capturedFile = ref<any>(null)
const hasApiKey = ref(true)

// Initialize
onMounted(() => {
  checkApiKey()
  loadHistory()
})

function checkApiKey() {
  const settings = uni.getStorageSync('app_settings') || {}
  hasApiKey.value = !!settings.apiKey
}

function loadHistory() {
  wordHistory.value = aiService.getScannedWordsList()
}

// Camera functions
function openCamera() {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera'],
    success: (res) => {
      capturedImage.value = res.tempFilePaths[0]
    }
  })
}

function chooseImage() {
  uni.chooseImage({
    count: 1,
    sourceType: ['album'],
    success: (res) => {
      // Use tempFiles[0] which is a File object on H5, has path on WeChat
      capturedImage.value = (res.tempFiles[0] as any).path || res.tempFilePaths[0]
      capturedFile.value = res.tempFiles[0] as any
    }
  })
}

function retake() {
  capturedImage.value = ''
  wordResult.value = null
}

async function scanWords() {
  if (!capturedImage.value) return
  
  isScanning.value = true
  try {
    const base64 = await getBase64FromFile(capturedFile.value, capturedImage.value)
    const result = await aiService.scanWords(base64)
    wordResult.value = result
    aiService.saveScannedWords(result)
    wordHistory.value = aiService.getWordScanHistory()
    uni.showToast({ title: '识别完成', icon: 'success' })
  } catch (e: any) {
    uni.showToast({ title: e.message || '识别失败', icon: 'none' })
  } finally {
    isScanning.value = false
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
function viewHistoryDetail(item: WordScanResult) {
  wordResult.value = item
  currentTab.value = 0
}

function saveToWordBook() {
  if (!wordResult.value) return
  aiService.saveWordsToBook(wordResult.value)
  uni.showToast({ title: '已加入生词本', icon: 'success' })
}

function practiceWords() {
  if (!wordResult.value?.words.length) {
    uni.showToast({ title: '没有可练习的单词', icon: 'none' })
    return
  }
  aiService.saveWordsToBook(wordResult.value)
  const words = wordResult.value.words.map(w => ({
    word: w.word || '',
    phonetic: w.phonetic || '',
    type: '',
    meaning: w.definition || '',
    example: w.example || '',
    memory_methods: '',
    usage_notes: '',
    common_mistakes: '',
    example_sentences: w.example ? { exam: [w.example] } : undefined,
    example_translations: []
  }))
  try {
    const encoded = encodeURIComponent(JSON.stringify(words))
    uni.navigateTo({ url: `/pages/words/detail?wordList=${encoded}&currentIndex=0&from=scan` })
  } catch (e) {
    uni.showToast({ title: '跳转失败', icon: 'none' })
  }
}

// Helpers
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
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
  color: #11998e;
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

/* Scan Intro */
.scan-intro {
  margin-bottom: 30rpx;
}

.intro-card {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  border-radius: 20rpx;
  padding: 40rpx;
  text-align: center;
}

.intro-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
}

.intro-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  display: block;
}

.intro-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 10rpx;
}

.demo-hint {
  text-align: center;
  margin-top: 20rpx;
  color: #ff9500;
  font-size: 24rpx;
}

/* Camera Area */
.camera-area {
  background: #fff;
  border-radius: 20rpx;
  padding: 60rpx 40rpx;
}

.camera-actions {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.btn-primary.large, .btn-secondary.large {
  padding: 30rpx;
  font-size: 32rpx;
}

.btn-primary {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: #fff;
  border: none;
  border-radius: 50rpx;
  padding: 24rpx 60rpx;
  font-size: 30rpx;
  font-weight: bold;
}

.btn-secondary {
  background: #fff;
  color: #11998e;
  border: 2rpx solid #11998e;
  border-radius: 50rpx;
  padding: 22rpx 50rpx;
  font-size: 30rpx;
}

/* Preview */
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

/* Result Card */
.result-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-top: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

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

.result-count {
  font-size: 24rpx;
  color: #999;
}

/* Word Sections */
.word-section {
  margin-bottom: 30rpx;
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.section-hint {
  font-size: 22rpx;
  color: #999;
}

/* Word List */
.word-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.word-item {
  padding: 20rpx;
  background: #f9f9f9;
  border-radius: 10rpx;
}

.word-main {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
  margin-bottom: 10rpx;
}

.word-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #11998e;
}

.word-phonetic {
  font-size: 24rpx;
  color: #999;
}

.word-meaning {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.word-definition {
  font-size: 28rpx;
  color: #333;
}

.word-example {
  font-size: 24rpx;
  color: #666;
  font-style: italic;
}

/* Extra Words */
.extra-words {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.extra-word {
  background: #f0f0f0;
  color: #666;
  padding: 10rpx 20rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
}

/* Result Actions */
.result-actions {
  display: flex;
  justify-content: center;
  gap: 30rpx;
  margin-top: 30rpx;
  padding-top: 30rpx;
  border-top: 1rpx solid #eee;
}

.btn-action {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: #fff;
  border: none;
  border-radius: 50rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
}

.btn-action.secondary {
  background: #fff;
  color: #11998e;
  border: 2rpx solid #11998e;
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

.history-count {
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

.history-preview {
  flex: 2;
}

.preview-text {
  font-size: 24rpx;
  color: #666;
}

.history-arrow {
  font-size: 40rpx;
  color: #ccc;
  margin-left: 20rpx;
}

/* Empty Card */
.empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
  background: #fff;
  border-radius: 20rpx;
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
</style>
