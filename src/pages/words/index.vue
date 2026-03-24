<template>
  <view class="word-book-page">
    <view class="search-bar">
      <view class="search-bar-inner">
        <input 
          class="search-input" 
          v-model="searchKeyword" 
          placeholder="搜索单词..."
          @input="doSearch"
        />
        <button class="add-word-btn" @tap="goToAdd">➕ 添加</button>
      </view>
    </view>

    <view class="tabs">
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 2 }" 
        @tap="goToScanned"
      >
        扫描生词
      </view>
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 1 }" 
        @tap="switchTab(1)"
      >
        未掌握
      </view>
    </view>

    <view class="content-wrapper">
    <view v-if="isLoading" class="loading">
      <text>加载中...</text>
    </view>
    
    <view v-else-if="displayWords.length === 0" class="empty">
      <text>暂无单词</text>
    </view>
    
    <view v-else class="word-cards">
      <view 
        v-for="word in displayWords" 
        :key="word.id"
        class="word-card"
        :class="{ mastered: word.learned }"
        @tap="goToWordDetail(word)"
      >
        <view class="word-info">
          <text class="word">{{ word.word }}</text>
          <text class="meaning">{{ word.type }} {{ word.meaning }}</text>
        </view>
        <view class="word-actions">
          <button size="mini" @tap.stop="playAudio(word.word)">🔊</button>
          <button 
            size="mini" 
            :type="word.learned ? 'primary' : 'default'"
            @tap.stop="toggleLearned(word)"
          >
            {{ word.learned ? '✓ 已掌握' : '掌握' }}
          </button>
        </view>
      </view>
    </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ttsService } from '@/services/tts'
import { wordService } from '@/services/word'

interface WordItem {
  id: string
  word: string
  phonetic: string
  type: string
  meaning: string
  memory_methods?: string
  usage_notes?: string
  common_mistakes?: string
  example_sentences?: any
  example_translations?: string[]
  learned: boolean
}

const currentTab = ref(0)
const searchKeyword = ref('')
const allWords = ref<WordItem[]>([])
const isLoading = ref(true)

const displayWords = computed(() => {
  let result = allWords.value
  
  if (currentTab.value === 1) {
    result = result.filter(w => !w.learned)
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(w => 
      w.word.toLowerCase().includes(keyword) ||
      w.meaning?.toLowerCase().includes(keyword)
    )
  }
  
  return result
})

onMounted(async () => {
  await loadWords()
})

async function loadWords() {
  isLoading.value = true
  try {
    const words = await wordService.loadWords()
    const learnedWords = uni.getStorageSync('learned_words') || []
    
    allWords.value = words.map((w: any) => ({
      id: w.id || w.word,
      word: w.word || '',
      phonetic: w.phonetic || '',
      type: w.type || '',
      meaning: w.meaning || '',
      memory_methods: w.memory_methods,
      usage_notes: w.usage_notes,
      common_mistakes: w.common_mistakes,
      example_sentences: w.example_sentences,
      example_translations: w.example_translations,
      learned: learnedWords.includes(w.word)
    }))
  } catch (e) {
    console.error('Load words error:', e)
  }
  isLoading.value = false
}

function switchTab(tab: number) {
  currentTab.value = tab
}

function doSearch() {
  // Computed property handles this automatically
}

function playAudio(word: string) {
  ttsService.speak(word)
}

function toggleLearned(word: WordItem) {
  word.learned = !word.learned
  
  let learnedWords = uni.getStorageSync('learned_words') || []
  if (word.learned && !learnedWords.includes(word.word)) {
    learnedWords.push(word.word)
  } else if (!word.learned) {
    learnedWords = learnedWords.filter((w: string) => w !== word.word)
  }
  uni.setStorageSync('learned_words', learnedWords)
}

function goToWordDetail(word: WordItem) {
  const currentIdx = displayWords.value.findIndex(w => w.word === word.word)
  
  uni.navigateTo({
    url: `/pages/words/detail?word=${encodeURIComponent(word.word)}&index=${currentIdx}&total=${displayWords.value.length}`
  })
}

function goToScanned() {
  uni.navigateTo({ url: '/pages/words/scanned' })
}

function goToAdd() {
  uni.navigateTo({ url: '/pages/words/add' })
}
</script>

<style scoped>
.word-book-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.search-bar {
  padding: 12px 16px 12px 12px;
  background: #fff;
}

.search-bar-inner {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 10px 16px;
  background: #f5f5f5;
  border-radius: 20px;
  font-size: 14px;
}

.add-word-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  flex-shrink: 0;
}

.tabs {
  display: flex;
  background: #fff;
  padding: 0 16px 12px 12px;
  gap: 12px;
}

.tab-item {
  padding: 8px 20px;
  font-size: 14px;
  color: #666;
  border-radius: 20px;
  background: #f5f5f5;
}

.tab-item.active {
  background: #667eea;
  color: #fff;
}

.content-wrapper {
  padding: 16px 20px 16px 16px;
  overflow-x: hidden;
  box-sizing: border-box;
  width: 100vw;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.word-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.word-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.word-card.mastered {
  background: #f0f9ff;
  border-color: #667eea;
}

.word-info {
  flex: 1;
}

.word-info .word {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 4px;
}

.word-info .meaning {
  font-size: 14px;
  color: #666;
}

.word-actions {
  display: flex;
  gap: 8px;
}

.word-actions button {
  padding: 4px 12px;
  font-size: 12px;
}
</style>
