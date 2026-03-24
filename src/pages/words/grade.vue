<template>
  <view class="grade-page">
    <view class="grade-tabs">
      <view 
        v-for="grade in grades" 
        :key="grade.value"
        :class="['grade-tab', { active: currentGrade === grade.value }]"
        @tap="switchGrade(grade.value)"
      >
        {{ grade.label }}
        <text class="count">{{ grade.count }}</text>
      </view>
    </view>

    <view class="stats-bar">
      <view class="stat">
        <text class="value">{{ currentWords.length }}</text>
        <text class="label">总单词</text>
      </view>
      <view class="stat">
        <text class="value">{{ learnedCount }}</text>
        <text class="label">已掌握</text>
      </view>
      <view class="stat">
        <text class="value">{{ currentWords.length - learnedCount }}</text>
        <text class="label">未掌握</text>
      </view>
    </view>

    <scroll-view class="word-list" scroll-y @scrolltolower="loadMore">
      <view 
        v-for="word in currentWords" 
        :key="word.word"
        :class="['word-card', { learned: word.learned }]"
        @tap="showWordDetail(word)"
      >
        <view class="word-main">
          <view class="word-header">
            <text class="word">{{ word.word }}</text>
            <text class="phonetic">{{ word.phonetic }}</text>
          </view>
          <view class="word-meaning">{{ word.translation }}</view>
        </view>
        <view class="word-actions">
          <view class="action-btn" @tap.stop="playAudio(word.word)">
            <text>🔊</text>
          </view>
          <view :class="['action-btn', { marked: word.learned }]" @tap.stop="toggleLearned(word)">
            <text>{{ word.learned ? '★' : '☆' }}</text>
          </view>
        </view>
      </view>
      
      <view class="load-more" v-if="hasMore">
        <text>加载中...</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ttsService } from '@/services/tts'
import { wordService } from '@/services/word'

interface GradeWord {
  word: string
  phonetic: string
  translation: string
  grade: string
  semester?: string
  learned: boolean
  examples?: string[]
  type?: string
  meaning?: string
  memory_methods?: string
  usage_notes?: string
  common_mistakes?: string
  example_sentences?: any
  example_translations?: string[]
}

interface Grade {
  value: string
  label: string
  count: number
}

const grades = ref<Grade[]>([
  { value: '三年级', label: '三年级', count: 0 },
  { value: '四年级', label: '四年级', count: 0 },
  { value: '五年级', label: '五年级', count: 0 },
  { value: '六年级', label: '六年级', count: 0 },
  { value: '七年级', label: '七年级', count: 0 },
  { value: '八年级', label: '八年级', count: 0 },
  { value: '九年级', label: '九年级', count: 0 }
])

const currentGrade = ref('七年级')
const allWords = ref<GradeWord[]>([])
const page = ref(1)
const pageSize = 30
const hasMore = ref(true)
const isLoading = ref(false)

const currentWords = computed(() => {
  const filtered = allWords.value.filter(w => w.grade === currentGrade.value)
  const limit = page.value * pageSize
  hasMore.value = filtered.length > limit
  return filtered.slice(0, limit)
})

const learnedCount = computed(() => {
  return currentWords.value.filter(w => w.learned).length
})

const gradeWords = computed(() => {
  return allWords.value.filter(w => w.grade === currentGrade.value)
})

onMounted(async () => {
  await loadWordGrades()
  await loadWords()
})

async function loadWordGrades() {
  try {
    await wordService.loadWordGrades()
    
    const gradeCounts = wordService.getAllGradeCounts()
    grades.value.forEach(g => {
      const found = gradeCounts.find(c => c.grade === g.value)
      g.count = found?.count || 0
    })
    
    console.log('Grade word counts:', grades.value.map(g => `${g.label}: ${g.count}`))
  } catch (e) {
    console.error('Load word grades error:', e)
  }
}

async function loadWords() {
  if (isLoading.value) return
  isLoading.value = true
  
  try {
    const words = await wordService.loadWords()
    const learnedWords = uni.getStorageSync('learned_words') || []
    
    allWords.value = words.filter((w: any) => {
      const grades = wordService.getGradesForWord(w.word)
      return grades.length > 0
    }).map((w: any) => {
      const wordGrades = wordService.getGradesForWord(w.word)
      
      return {
        word: w.word || '',
        phonetic: w.phonetic || '',
        translation: w.translation || w.meaning || '',
        type: w.type || '',
        meaning: w.meaning || w.translation || '',
        grade: wordGrades[0] || currentGrade.value,
        learned: learnedWords.includes(w.word),
        memory_methods: w.memory_methods,
        usage_notes: w.usage_notes,
        common_mistakes: w.common_mistakes,
        example_sentences: w.example_sentences,
        example_translations: w.example_translations
      }
    })
    
    console.log('Loaded', allWords.value.length, 'words with grade mappings')
    console.log('Sample words:', allWords.value.slice(0, 3).map(w => `${w.word} - ${w.grade}`))
  } catch (e) {
    console.error('Load words error:', e)
    loadDefaultWords()
  } finally {
    isLoading.value = false
  }
}

function loadDefaultWords() {
  allWords.value = []
}

function switchGrade(grade: string) {
  currentGrade.value = grade
  page.value = 1
}

function loadMore() {
  if (hasMore.value) {
    page.value++
  }
}

function showWordDetail(word: GradeWord) {
  const currentIndex = gradeWords.value.findIndex(w => w.word === word.word)
  
  uni.navigateTo({
    url: `/pages/words/detail?word=${encodeURIComponent(word.word)}&index=${currentIndex}&total=${gradeWords.value.length}`
  })
}

function playAudio(word: string) {
  ttsService.speak(word)
}

function toggleLearned(word: GradeWord) {
  word.learned = !word.learned
  
  let learnedWords = uni.getStorageSync('learned_words') || []
  if (word.learned) {
    if (!learnedWords.includes(word.word)) {
      learnedWords.push(word.word)
    }
  } else {
    learnedWords = learnedWords.filter((w: string) => w !== word.word)
  }
  uni.setStorageSync('learned_words', learnedWords)
  
  uni.showToast({
    title: word.learned ? '已掌握' : '取消掌握',
    icon: 'none'
  })
}
</script>

<style scoped>
.grade-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.grade-tabs {
  display: flex;
  background: #fff;
  padding: 12px 16px;
  gap: 12px;
}

.grade-tab {
  flex: 1;
  text-align: center;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 16px;
  color: #666;
  position: relative;
}

.grade-tab.active {
  background: #667eea;
  color: #fff;
}

.grade-tab .count {
  display: block;
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}

.stats-bar {
  display: flex;
  background: #fff;
  padding: 16px;
  margin-top: 12px;
}

.stat {
  flex: 1;
  text-align: center;
}

.stat .value {
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
  display: block;
}

.stat .label {
  font-size: 12px;
  color: #999;
}

.word-list {
  padding: 12px;
  height: calc(100vh - 200px);
}

.word-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.word-card.learned {
  background: #f0f9ff;
}

.word-main {
  flex: 1;
}

.word-header {
  display: flex;
  align-items: baseline;
  margin-bottom: 8px;
}

.word {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-right: 12px;
}

.phonetic {
  font-size: 14px;
  color: #999;
}

.word-meaning {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.word-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.action-btn.marked {
  color: #ffd700;
}

.load-more {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}
</style>
