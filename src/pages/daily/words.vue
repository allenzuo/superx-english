<template>
  <view class="day-words-page">
    <view class="header">
      <view class="day-info">
        <text class="day-label">第 {{ day }} 天</text>
        <text class="date">{{ date }}</text>
      </view>
      <view class="progress-info">
        <text>{{ currentIndex + 1 }}/{{ words.length }}</text>
      </view>
    </view>

    <view class="word-card" v-if="words.length > 0">
      <view class="word-main">
        <view class="word">{{ currentWord.word }}</view>
        <view class="phonetic">{{ currentWord.phonetic }}</view>
      </view>
      <view class="meaning">{{ currentWord.translation }}</view>
      
      <view class="examples" v-if="currentWord.examples && currentWord.examples.length > 0">
        <view class="example" v-for="(ex, i) in currentWord.examples" :key="i">
          {{ ex }}
        </view>
      </view>

      <view class="actions">
        <button @tap="playAudio">🔊 朗读</button>
        <button @tap="markKnown" :class="{ marked: currentWord.known }">
          {{ currentWord.known ? '✓ 已掌握' : '☆ 认识' }}
        </button>
      </view>
    </view>

    <view class="navigation">
      <button @tap="previousWord" :disabled="currentIndex === 0">上一个</button>
      <view class="dots">
        <view 
          v-for="i in Math.min(words.length, 10)" 
          :key="i"
          :class="['dot', { active: i - 1 === currentIndex % 10 }]"
        ></view>
      </view>
      <button @tap="nextWord" :disabled="currentIndex >= words.length - 1">下一个</button>
    </view>

    <view class="all-words" v-if="showAll">
      <view class="all-header">
        <text>全部单词</text>
        <text class="close" @tap="showAll = false">×</text>
      </view>
      <scroll-view class="word-list" scroll-y>
        <view 
          v-for="(word, index) in words" 
          :key="index"
          :class="['word-item', { known: word.known }]"
          @tap="goToWord(index)"
        >
          <text class="word">{{ word.word }}</text>
          <text class="meaning">{{ word.translation }}</text>
        </view>
      </scroll-view>
    </view>

    <view class="bottom-bar">
      <button @tap="showAll = true">查看全部</button>
      <button type="primary" @tap="completeDay" v-if="!isCompleted">
        完成今日学习
      </button>
      <button type="primary" v-else disabled>
        ✅ 已完成
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ttsService } from '@/services/tts'
import { wordService } from '@/services/word'

interface DailyWord {
  word: string
  phonetic: string
  translation: string
  known: boolean
  examples?: string[]
}

const day = ref(1)
const date = ref('')
const words = ref<DailyWord[]>([])
const currentIndex = ref(0)
const showAll = ref(false)
const isCompleted = ref(false)
const isLoading = ref(false)

const WORDS_PER_DAY = 10

const currentWord = computed(() => words.value[currentIndex.value] || { word: '', phonetic: '', translation: '', known: false })

onMounted(() => {
  loadWords()
  checkCompletion()
})

async function loadWords() {
  if (isLoading.value) return
  isLoading.value = true
  
  try {
    const allWords = await wordService.loadWords()
    
    // Shuffle and pick 10 words for today
    const shuffled = [...allWords].sort(() => Math.random() - 0.5)
    const dailyWords = shuffled.slice(0, WORDS_PER_DAY).map((w: any) => ({
      word: w.word || '',
      phonetic: w.phonetic || '',
      translation: w.translation || w.meaning || '',
      known: false,
      examples: w.examples || []
    })).filter((w: DailyWord) => w.word)
    
    // Check if we have saved progress for today
    const savedDay = uni.getStorageSync('day_words_day')
    if (savedDay) {
      day.value = savedDay
    }
    
    const savedWords = uni.getStorageSync(`day_${day.value}_words`)
    if (savedWords) {
      words.value = savedWords
    } else {
      words.value = dailyWords
    }
  } catch (e) {
    console.error('Load words error:', e)
    loadDefaultWords()
  } finally {
    isLoading.value = false
  }
  
  const now = new Date()
  date.value = `${now.getMonth() + 1}月${now.getDate()}日`
}

function checkCompletion() {
  const completed = uni.getStorageSync(`day_${day.value}_completed`)
  isCompleted.value = completed || false
}

function playAudio() {
  ttsService.speak(currentWord.value.word)
}

function markKnown() {
  words.value[currentIndex.value].known = !words.value[currentIndex.value].known
  
  const knownWords = words.value.filter(w => w.known).length
  uni.setStorageSync(`day_${day.value}_words`, words.value)
  
  if (knownWords === words.value.length) {
    isCompleted.value = true
    uni.setStorageSync(`day_${day.value}_completed`, true)
  }
}

function previousWord() {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

function nextWord() {
  if (currentIndex.value < words.value.length - 1) {
    currentIndex.value++
  }
}

function goToWord(index: number) {
  currentIndex.value = index
  showAll.value = false
}

function completeDay() {
  isCompleted.value = true
  uni.setStorageSync(`day_${day.value}_completed`, true)
  
  if (day.value < 100) {
    uni.showModal({
      title: '恭喜完成！',
      content: '是否进入第 ' + (day.value + 1) + ' 天？',
      success: (res) => {
        if (res.confirm) {
          day.value++
          uni.setStorageSync('day_words_day', day.value)
          currentIndex.value = 0
          isCompleted.value = false
        }
      }
    })
  } else {
    uni.showToast({ title: '恭喜完成百日计划！', icon: 'success' })
  }
}
</script>

<style scoped>
.day-words-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.day-label {
  font-size: 24px;
  font-weight: bold;
}

.date {
  font-size: 14px;
  opacity: 0.9;
}

.progress-info {
  font-size: 16px;
}

.word-card {
  flex: 1;
  background: #fff;
  margin: 16px;
  border-radius: 12px;
  padding: 24px;
}

.word-main {
  text-align: center;
  margin-bottom: 20px;
}

.word {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.phonetic {
  font-size: 18px;
  color: #999;
}

.meaning {
  font-size: 18px;
  color: #666;
  text-align: center;
  margin-bottom: 20px;
}

.examples {
  margin-bottom: 20px;
}

.example {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.actions {
  display: flex;
  gap: 12px;
}

.actions button {
  flex: 1;
}

.actions button.marked {
  background: #52c41a;
  color: #fff;
}

.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ddd;
}

.dot.active {
  background: #667eea;
}

.all-words {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 100px;
  background: #fff;
  z-index: 10;
}

.all-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.close {
  font-size: 24px;
  color: #999;
}

.word-list {
  height: calc(100vh - 180px);
  padding: 16px;
}

.word-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.word-item.known {
  background: #f0f9ff;
}

.word-item .word {
  font-size: 16px;
  color: #333;
}

.word-item .meaning {
  font-size: 14px;
  color: #999;
}

.bottom-bar {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #fff;
}
</style>
