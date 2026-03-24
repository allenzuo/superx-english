<template>
  <view class="hundred-page">
    <view class="header">
      <view class="progress-ring">
        <view class="ring-text">
          <text class="day">{{ currentDay }}</text>
          <text class="label">/100天</text>
        </view>
      </view>
    </view>

    <view class="stats">
      <view class="stat-item">
        <text class="value">{{ stats.totalWords }}</text>
        <text class="label">总词汇</text>
      </view>
      <view class="stat-item">
        <text class="value">{{ stats.learnedWords }}</text>
        <text class="label">已掌握</text>
      </view>
      <view class="stat-item">
        <text class="value">{{ stats.todayWords }}</text>
        <text class="label">今日已学</text>
      </view>
    </view>

    <view class="content-wrapper">
    <view class="today-section" v-if="todayWords.length > 0">
      <view class="section-header">
        <text class="title">今日任务</text>
        <text class="count">{{ todayWords.length }}个</text>
      </view>
      <view class="word-cards">
        <view 
          v-for="word in todayWords" 
          :key="word.word"
          :class="['word-card', { learned: word.learned }]"
          @tap="goToWordDetail(word)"
        >
          <view class="word-info">
            <text class="word">{{ word.word }}</text>
            <text class="meaning">{{ word.translation }}</text>
          </view>
          <view class="word-actions">
            <button size="mini" @tap="playAudio(word.word)">🔊</button>
            <button 
              size="mini" 
              :type="word.learned ? 'primary' : 'default'"
              @tap="markLearned(word)"
            >
              {{ word.learned ? '✓ 已掌握' : '掌握' }}
            </button>
          </view>
        </view>
      </view>
    </view>

    <view class="start-section" v-else>
      <button class="start-btn" @tap="startToday">开始今日学习</button>
    </view>

    <view class="calendar-section">
      <view class="section-header">
        <text class="title">学习日历</text>
      </view>
      <view class="calendar">
        <view 
          v-for="day in 100" 
          :key="day"
          :class="['day-cell', { 
            completed: day < currentDay, 
            today: day === currentDay,
            locked: day > currentDay
          }]"
          @tap="selectDay(day)"
        >
          {{ day }}
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

interface Word {
  word: string
  translation: string
  phonetic?: string
  type?: string
  meaning?: string
  memory_methods?: string
  usage_notes?: string
  common_mistakes?: string
  example_sentences?: any
  example_translations?: string[]
  learned: boolean
}

const currentDay = ref(1)
const allWords = ref<Word[]>([])
const todayWords = ref<Word[]>([])

const stats = computed(() => {
  const learnedWords = allWords.value.filter(w => w.learned).length
  return {
    totalWords: allWords.value.length,
    learnedWords,
    todayWords: todayWords.value.filter(w => w.learned).length
  }
})

onMounted(() => {
  loadProgress()
  loadWords()
})

function loadProgress() {
  const progress = uni.getStorageSync('hundred_days_progress') || {}
  currentDay.value = progress.currentDay || 1
}

async function loadWords() {
  const words = await wordService.loadWords()
  const learnedWords = uni.getStorageSync('learned_words') || []
  
  allWords.value = words.map((w: any) => ({
    word: w.word || '',
    translation: w.translation || w.meaning || '',
    phonetic: w.phonetic || '',
    type: w.type || '',
    meaning: w.meaning || w.translation || '',
    memory_methods: w.memory_methods,
    usage_notes: w.usage_notes,
    common_mistakes: w.common_mistakes,
    example_sentences: w.example_sentences,
    example_translations: w.example_translations,
    learned: learnedWords.includes(w.word)
  }))
  
  loadTodayWords()
}

function loadTodayWords() {
  const totalWords = 3508
  const totalDays = 100
  const wordsPerDay = Math.ceil(totalWords / totalDays) // 35 words per day
  const startIndex = (currentDay.value - 1) * wordsPerDay
  const endIndex = Math.min(startIndex + wordsPerDay, totalWords)
  
  if (startIndex >= totalWords) {
    todayWords.value = []
    return
  }
  
  todayWords.value = allWords.value.slice(startIndex, endIndex).map(w => ({ ...w }))
}

function startToday() {
  if (todayWords.value.length === 0) {
    loadTodayWords()
  }
  
  if (todayWords.value.every(w => w.learned)) {
    if (currentDay.value < 100) {
      currentDay.value++
      uni.setStorageSync('hundred_days_progress', { currentDay: currentDay.value })
      loadTodayWords()
    } else {
      uni.showToast({ title: '恭喜完成百日计划！', icon: 'success' })
    }
  }
}

function playAudio(word: string) {
  ttsService.speak(word)
}

function selectDay(day: number) {
  if (day > currentDay.value) {
    uni.showToast({ title: '请先完成前面的学习', icon: 'none' })
    return
  }
  currentDay.value = day
  loadTodayWords()
  uni.showToast({ title: `已切换到第${day}天`, icon: 'none' })
}

function goToWordDetail(word: Word) {
  const currentIdx = todayWords.value.findIndex(w => w.word === word.word)
  
  uni.navigateTo({
    url: `/pages/words/detail?word=${encodeURIComponent(word.word)}&index=${currentIdx}&total=${todayWords.value.length}`
  })
}

function markLearned(word: Word) {
  word.learned = !word.learned
  
  let learnedWords = uni.getStorageSync('learned_words') || []
  if (word.learned && !learnedWords.includes(word.word)) {
    learnedWords.push(word.word)
  } else if (!word.learned) {
    learnedWords = learnedWords.filter((w: string) => w !== word.word)
  }
  uni.setStorageSync('learned_words', learnedWords)
  
  const learnedCount = todayWords.value.filter(w => w.learned).length
  if (learnedCount === todayWords.value.length && currentDay.value < 100) {
    uni.showModal({
      title: '今日任务完成！',
      content: '是否进入下一天？',
      success: (res) => {
        if (res.confirm) {
          currentDay.value++
          uni.setStorageSync('hundred_days_progress', { currentDay: currentDay.value })
          loadTodayWords()
        }
      }
    })
  }
}
</script>

<style scoped>
.hundred-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.hundred-page .content-wrapper {
  padding: 16px 20px 16px 16px;
  overflow-x: hidden;
  box-sizing: border-box;
  width: 100vw;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
  color: #fff;
  text-align: center;
}

.title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 20px;
}

.progress-ring {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-text {
  text-align: center;
}

.day {
  font-size: 32px;
  font-weight: bold;
}

.label {
  font-size: 14px;
  opacity: 0.9;
}

.stats {
  display: flex;
  background: #fff;
  padding: 20px;
  margin-bottom: 12px;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-item .value {
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
  display: block;
}

.stat-item .label {
  font-size: 12px;
  color: #999;
}

.today-section, .calendar-section {
  background: #fff;
  margin: 12px;
  border-radius: 12px;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header .title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.count {
  font-size: 14px;
  color: #667eea;
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
  background: #f5f5f5;
  border-radius: 8px;
}

.word-card.learned {
  background: #f0f9ff;
}

.word-info .word {
  font-size: 16px;
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

.start-section {
  padding: 40px 20px;
  text-align: center;
}

.start-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 16px 40px;
  border-radius: 30px;
  font-size: 18px;
  border: none;
}

.calendar {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 8px;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
  color: #999;
}

.day-cell.completed {
  background: #667eea;
  color: #fff;
}

.day-cell.today {
  background: #ff9800;
  color: #fff;
}

.day-cell.locked {
  background: #e0e0e0;
  color: #bbb;
}
</style>
