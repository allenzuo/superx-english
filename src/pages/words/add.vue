<template>
  <view class="add-page">
    <view class="search-section">
      <view class="search-bar">
        <text class="search-icon">🔍</text>
        <input 
          class="search-input" 
          v-model="searchWord" 
          placeholder="输入英文单词，如 accomplish"
          @confirm="queryWord"
        />
        <text class="clear-btn" v-if="searchWord" @tap="searchWord = ''; showResult = false">✕</text>
      </view>
      <button class="query-btn" :disabled="!searchWord.trim() || isLoading" @tap="queryWord">
        {{ isLoading ? '查询中...' : '查询' }}
      </button>
    </view>

    <view class="result-section" v-if="showResult && wordDetails">
      <view class="word-card">
        <view class="word-header">
          <view class="word-main">
            <text class="word-text">{{ wordDetails.word }}</text>
            <text class="phonetic">{{ wordDetails.phonetic }}</text>
          </view>
          <view class="word-type">{{ wordDetails.partOfSpeech }}</view>
        </view>

        <view class="definition-row">
          <text class="definition-label">释义</text>
          <text class="definition-text">{{ wordDetails.definition }}</text>
        </view>

        <view class="memory-tip" v-if="wordDetails.memoryTip">
          <view class="section-header">
            <text class="section-icon">🧠</text>
            <text class="section-title">记忆技巧</text>
          </view>
          <text class="tip-text">{{ wordDetails.memoryTip }}</text>
        </view>

        <view class="examples" v-if="wordDetails.examples?.length">
          <view class="section-header">
            <text class="section-icon">📖</text>
            <text class="section-title">例句</text>
          </view>
          <view class="example-item" v-for="(ex, idx) in wordDetails.examples" :key="idx">
            <text class="example-sentence">{{ ex.sentence }}</text>
            <text class="example-translation">{{ ex.translation }}</text>
          </view>
        </view>

        <view class="collocations" v-if="wordDetails.collocations?.length">
          <view class="section-header">
            <text class="section-icon">🔗</text>
            <text class="section-title">常见搭配</text>
          </view>
          <view class="collo-list">
            <text class="collo-item" v-for="(c, idx) in wordDetails.collocations" :key="idx">{{ c }}</text>
          </view>
        </view>

        <view class="common-mistakes" v-if="wordDetails.commonMistakes">
          <view class="section-header">
            <text class="section-icon">⚠️</text>
            <text class="section-title">易错提醒</text>
          </view>
          <text class="mistakes-text">{{ wordDetails.commonMistakes }}</text>
        </view>

        <view class="action-row">
          <button class="save-btn" :class="{ saved: isSaved }" @tap="saveWord">
            <text>{{ isSaved ? '✓ 已保存' : '💾 保存到生词本' }}</text>
          </button>
          <button class="practice-btn" @tap="practiceWord">
            <text>🎯 开始记忆</text>
          </button>
        </view>
      </view>
    </view>

    <view class="history-section" v-if="!showResult && recentWords.length > 0">
      <view class="section-title-row">
        <text class="section-title">最近添加</text>
        <text class="clear-history" @tap="clearHistory">清空</text>
      </view>
      <view class="history-list">
        <view class="history-item" v-for="w in recentWords" :key="w.word" @tap="loadFromHistory(w)">
          <text class="history-word">{{ w.word }}</text>
          <text class="history-def">{{ w.definition }}</text>
        </view>
      </view>
    </view>

    <view class="empty-hint" v-if="!showResult && !isLoading">
      <text class="hint-icon">📝</text>
      <text class="hint-text">输入单词，AI为你查询详细释义、例句和记忆技巧</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { aiService } from '@/services/ai'
import type { WordDetails } from '@/services/types'

const searchWord = ref('')
const isLoading = ref(false)
const showResult = ref(false)
const wordDetails = ref<WordDetails | null>(null)
const isSaved = ref(false)
const recentWords = ref<{ word: string; definition: string; phonetic: string }[]>([])

onMounted(() => {
  loadHistory()
})

function loadHistory() {
  const history = uni.getStorageSync('word_add_history') || []
  recentWords.value = history.slice(0, 10)
}

function loadFromHistory(w: { word: string; definition: string; phonetic: string }) {
  searchWord.value = w.word
  wordDetails.value = { ...w, examples: [], partOfSpeech: '', memoryTip: '', commonMistakes: '', collocations: [] }
  showResult.value = true
  isSaved.value = false
}

async function queryWord() {
  const word = searchWord.value.trim()
  if (!word) return
  
  isLoading.value = true
  showResult.value = false
  isSaved.value = false
  
  try {
    wordDetails.value = await aiService.queryWordDetails(word)
    showResult.value = true
    checkIfSaved(word)
  } catch (e: any) {
    uni.showToast({ title: e.message || '查询失败', icon: 'none' })
  } finally {
    isLoading.value = false
  }
}

function checkIfSaved(word: string) {
  const history = uni.getStorageSync('word_add_history') || []
  isSaved.value = history.some((w: any) => w.word.toLowerCase() === word.toLowerCase())
}

function saveWord() {
  if (!wordDetails.value) return
  const history = uni.getStorageSync('word_add_history') || []
  const exists = history.findIndex((w: any) => w.word.toLowerCase() === wordDetails.value!.word.toLowerCase())
  if (exists >= 0) {
    history.splice(exists, 1)
  }
  history.unshift({
    word: wordDetails.value.word,
    definition: wordDetails.value.definition,
    phonetic: wordDetails.value.phonetic
  })
  if (history.length > 50) history.splice(50)
  uni.setStorageSync('word_add_history', history)
  isSaved.value = true
  recentWords.value = history.slice(0, 10)
  uni.showToast({ title: '已保存到生词本', icon: 'success' })
}

function practiceWord() {
  saveWord()
  const words = [{
    word: wordDetails.value!.word,
    phonetic: wordDetails.value!.phonetic,
    type: wordDetails.value!.partOfSpeech,
    meaning: wordDetails.value!.definition,
    example: wordDetails.value!.examples?.[0]?.sentence || '',
    memory_methods: wordDetails.value!.memoryTip || '',
    usage_notes: wordDetails.value!.commonMistakes || '',
    common_mistakes: '',
    example_sentences: wordDetails.value!.examples?.map(e => e.sentence),
    example_translations: wordDetails.value!.examples?.map(e => e.translation)
  }]
  try {
    const encoded = encodeURIComponent(JSON.stringify(words))
    uni.navigateTo({ url: `/pages/words/detail?wordList=${encoded}&currentIndex=0&from=add` })
  } catch (e) {
    uni.showToast({ title: '跳转失败', icon: 'none' })
  }
}

function clearHistory() {
  uni.removeStorageSync('word_add_history')
  recentWords.value = []
}
</script>

<style scoped>
.add-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.search-section {
  display: flex;
  gap: 16rpx;
  align-items: center;
  margin-bottom: 24rpx;
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 40rpx;
  padding: 0 24rpx;
  height: 80rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
}

.search-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.clear-btn {
  font-size: 24rpx;
  color: #999;
  padding: 8rpx;
}

.query-btn {
  width: 140rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.query-btn[disabled] {
  opacity: 0.5;
}

.result-section {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.word-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
}

.word-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24rpx;
  border-bottom: 2rpx solid #667eea;
  padding-bottom: 20rpx;
}

.word-main {
  flex: 1;
}

.word-text {
  font-size: 48rpx;
  font-weight: bold;
  color: #1a1a1a;
  display: block;
  margin-bottom: 8rpx;
}

.phonetic {
  font-size: 26rpx;
  color: #999;
  display: block;
}

.word-type {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.definition-row {
  margin-bottom: 24rpx;
}

.definition-label {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 8rpx;
}

.definition-text {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
  line-height: 1.6;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.section-icon {
  font-size: 28rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.memory-tip {
  background: #f3e8ff;
  border: 1rpx solid #d8b4fe;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 24rpx;
}

.memory-tip .section-icon { }
.memory-tip .section-title { color: #7c3aed; }

.tip-text {
  font-size: 28rpx;
  color: #6d28d9;
  line-height: 1.7;
}

.examples {
  margin-bottom: 24rpx;
}

.example-item {
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  margin-bottom: 12rpx;
}

.example-sentence {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  display: block;
  margin-bottom: 8rpx;
}

.example-translation {
  font-size: 24rpx;
  color: #999;
  display: block;
}

.collocations {
  margin-bottom: 24rpx;
}

.collo-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.collo-item {
  background: #e3f2fd;
  color: #1976d2;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
}

.common-mistakes {
  background: #fee2e2;
  border: 1rpx solid #fca5a5;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 24rpx;
}

.common-mistakes .section-title { color: #dc2626; }

.mistakes-text {
  font-size: 26rpx;
  color: #991b1b;
  line-height: 1.6;
}

.action-row {
  display: flex;
  gap: 16rpx;
  margin-top: 8rpx;
}

.save-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #667eea;
  background: #fff;
  color: #667eea;
}

.save-btn.saved {
  background: #667eea;
  color: #fff;
}

.practice-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
}

.history-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.clear-history {
  font-size: 24rpx;
  color: #ff4d4f;
}

.history-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.history-item:last-child {
  border-bottom: none;
}

.history-word {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 6rpx;
}

.history-def {
  font-size: 26rpx;
  color: #999;
}

.empty-hint {
  text-align: center;
  padding: 80rpx 40rpx;
}

.hint-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
}

.hint-text {
  font-size: 28rpx;
  color: #999;
  line-height: 1.6;
}
</style>
