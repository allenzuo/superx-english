<template>
  <view class="detail-page" @touchstart="onTouchStart" @touchend="onTouchEnd">
    <!-- Navigation hints -->
    <view class="swipe-hint" v-if="wordList.length > 1">
      <text class="hint-left" @tap="goToPrevWord">‹ 上一词</text>
      <text class="hint-center">{{ currentIndex + 1 }}/{{ wordList.length }}</text>
      <text class="hint-right" @tap="goToNextWord">下一词 ›</text>
    </view>
    
    <scroll-view scroll-y class="content">
      <!-- Word Header -->
      <view class="word-header">
        <view class="word-row">
          <view class="word-main">
            <view class="word-text">{{ showAnswer ? wordData.word : '***' }}</view>
            <view class="phonetic-row" v-if="wordData.phonetic">
              <text class="phonetic">{{ wordData.phonetic }}</text>
            </view>
            <view class="meaning-row" v-if="wordData.meaning">
              <text v-if="showMemory" class="meaning-text">{{ wordData.type }} {{ wordData.meaning }}</text>
              <text v-else class="meaning-hidden">******</text>
            </view>
            <view v-if="!showMemory && wordData.meaning" class="hint-text">
              点击「记忆」显示词义
            </view>
          </view>
          
          <view class="action-buttons">
            <view class="action-btn" :class="{ active: showAnswer }" @tap="toggleAnswer">
              <text class="action-icon">📝</text>
              <text class="action-label">听写</text>
            </view>
            <view class="action-btn" :class="{ active: showMemory }" @tap="toggleMemory">
              <text class="action-icon">🧠</text>
              <text class="action-label">记忆</text>
            </view>
            <view class="action-btn" :class="{ active: isSpeaking }" @tap="startLecture">
              <text class="action-icon">📢</text>
              <text class="action-label">讲课</text>
            </view>
          </view>
        </view>
        
        <view class="speak-row">
          <view class="speak-btn" @tap="speakWord">
            <text v-if="isSpeaking" class="loading-icon">🔊</text>
            <text v-else>🔊</text>
            <text class="speak-text">{{ isSpeaking ? '朗读中...' : '发音' }}</text>
          </view>
          <view v-if="isLectureMode" class="stop-btn" @tap="stopLecture">
            <text>⏹ 停止</text>
          </view>
        </view>
      </view>

      <!-- Memory Methods Section (Purple) -->
      <view class="section memory-section" v-if="showMemory && wordData.memory_methods">
        <view class="section-header">
          <text class="section-icon">🧠</text>
          <text class="section-title">记忆妙法</text>
        </view>
        <view class="section-content">{{ wordData.memory_methods }}</view>
      </view>

      <!-- Usage Notes Section (Amber) -->
      <view class="section usage-section" v-if="showMemory && wordData.usage_notes">
        <view class="section-header">
          <text class="section-icon">💡</text>
          <text class="section-title">用法提示</text>
        </view>
        <view class="section-content">{{ wordData.usage_notes }}</view>
      </view>

      <!-- Examples Section (Blue) -->
      <view class="section example-section" v-if="showMemory && examples.length > 0">
        <view class="section-header">
          <text class="section-icon">📖</text>
          <text class="section-title">重点例句</text>
        </view>
        <view class="examples-vertical">
          <view class="example-card" v-for="(ex, idx) in examples" :key="idx">
            <view class="example-text">{{ ex.sentence }}</view>
            <view class="example-translation">{{ ex.translation }}</view>
          </view>
        </view>
      </view>

      <!-- Common Mistakes Section (Red) -->
      <view class="section mistake-section" v-if="showMemory && wordData.common_mistakes">
        <view class="section-header">
          <text class="section-icon">⚠️</text>
          <text class="section-title">易错分析</text>
        </view>
        <view class="section-content">{{ wordData.common_mistakes }}</view>
      </view>
    </scroll-view>

    <!-- Bottom Action Bar -->
    <view class="bottom-bar">
      <view class="mastery-toggle" @tap="toggleMastery">
        <text :class="['mastery-btn', isLearned ? 'mastered' : '']">
          {{ isLearned ? '✓ 已掌握' : '☆ 掌握' }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { ttsService } from '@/services/tts'
import fullWordsData from '@/static/data/words.json'

interface WordData {
  word: string
  phonetic: string
  type: string
  meaning: string
  memory_methods?: string
  usage_notes?: string
  common_mistakes?: string
  example_sentences?: {
    exam?: string[]
    spoken?: string[]
  }
  example_translations?: string[]
}

interface WordListItem {
  word: string
  phonetic: string
  translation: string
}

interface Example {
  sentence: string
  translation: string
}

const wordData = ref<WordData>({
  word: '',
  phonetic: '',
  type: '',
  meaning: ''
})

// Word list for swipe navigation
const wordList = ref<WordListItem[]>([])
const currentIndex = ref(0)

const showAnswer = ref(false)
const showMemory = ref(false)
const isSpeaking = ref(false)
const isLectureMode = ref(false)
const isLearned = ref(false)

// Swipe handling
let touchStartX = 0
let touchEndX = 0

const examples = computed<Example[]>(() => {
  const exSentences = wordData.value.example_sentences || {}
  const exam = exSentences.exam || []
  const spoken = exSentences.spoken || []
  const translations = wordData.value.example_translations || []
  
  const result: Example[] = []
  const allSentences = [...exam, ...spoken]
  
  allSentences.forEach((sentence, idx) => {
    result.push({
      sentence: sentence,
      translation: translations[idx] || ''
    })
  })
  
  return result.slice(0, 10)
})

onLoad(async (options: any) => {
  // Use imported data directly
  if (options.word && options.index !== undefined) {
    const wordName = decodeURIComponent(options.word)
    currentIndex.value = parseInt(options.index) || 0
    
    if (fullWordsData && Array.isArray(fullWordsData)) {
      // Populate cache for all words
      fullWordsData.forEach((w: any) => {
        fullWordsCache.set(w.word, w)
      })
      
      // Create word list for navigation
      wordList.value = fullWordsData.map((w: any) => ({
        word: w.word || '',
        phonetic: w.phonetic || '',
        type: w.type || '',
        meaning: w.meaning || ''
      }))
      
      // Find and load full details for current word
      const fullWord = fullWordsData.find((w: any) => w.word === wordName)
      if (fullWord) {
        wordData.value = {
          word: fullWord.word || '',
          phonetic: fullWord.phonetic || '',
          type: fullWord.type || '',
          meaning: fullWord.meaning || '',
          memory_methods: typeof fullWord.memory_methods === 'string' ? fullWord.memory_methods : JSON.stringify(fullWord.memory_methods),
          usage_notes: typeof fullWord.usage_notes === 'string' ? fullWord.usage_notes : JSON.stringify(fullWord.usage_notes),
          common_mistakes: typeof fullWord.common_mistakes === 'string' ? fullWord.common_mistakes : JSON.stringify(fullWord.common_mistakes),
          example_sentences: fullWord.example_sentences,
          example_translations: fullWord.example_translations
        }
      }
      
      // Check if already learned
      const learnedWords = uni.getStorageSync('learned_words') || []
      isLearned.value = learnedWords.includes(wordName)
    }
    return
  }
  
  // Handle wordList parameter (from grade.vue, hundred/index.vue)
  if (options.wordKey) {
    // Load from localStorage
    try {
      const stored = uni.getStorageSync(options.wordKey)
      if (stored && Array.isArray(stored)) {
        wordList.value = stored
      }
    } catch (e) {
      console.error('Load from storage error:', e)
    }
    
    currentIndex.value = parseInt(options.currentIndex) || 0
    
    // Populate wordData from wordList
    if (wordList.value.length > 0 && currentIndex.value < wordList.value.length) {
      const currentWord = wordList.value[currentIndex.value]
      // Convert string back to array for memory_methods (||| separator)
      const memoryMethods = typeof currentWord.memory_methods === 'string' 
        ? currentWord.memory_methods.split('|||').filter(Boolean)
        : currentWord.memory_methods
      
      wordData.value = {
        word: currentWord.word || '',
        phonetic: currentWord.phonetic || '',
        type: currentWord.type || '',
        meaning: currentWord.meaning || '',
        memory_methods: Array.isArray(memoryMethods) ? memoryMethods[0] : memoryMethods,
        usage_notes: currentWord.usage_notes,
        common_mistakes: currentWord.common_mistakes,
        example_sentences: currentWord.example_sentences,
        example_translations: currentWord.example_translations
      }
    }
  }
  // Legacy support: wordList parameter (from older implementations)
  else if (options.wordList) {
    try {
      // Try multiple decoding strategies
      let jsonStr = ''
      try {
        jsonStr = decodeURIComponent(options.wordList)
      } catch (e) {
        try {
          // Try double decoding
          jsonStr = decodeURIComponent(decodeURIComponent(options.wordList))
        } catch (e2) {
          // Try replacing + with space and then decode
          jsonStr = decodeURIComponent(options.wordList.replace(/\+/g, ' '))
        }
      }
      
      wordList.value = JSON.parse(jsonStr)
      currentIndex.value = parseInt(options.currentIndex) || 0
      
      // Populate wordData from wordList
      if (wordList.value.length > 0 && currentIndex.value < wordList.value.length) {
        const currentWord = wordList.value[currentIndex.value]
        // Convert string back to array for memory_methods (||| separator)
        const memoryMethods = typeof currentWord.memory_methods === 'string' 
          ? currentWord.memory_methods.split('|||').filter(Boolean)
          : currentWord.memory_methods
        
        wordData.value = {
          word: currentWord.word || '',
          phonetic: currentWord.phonetic || '',
          type: currentWord.type || '',
          meaning: currentWord.meaning || '',
          memory_methods: Array.isArray(memoryMethods) ? memoryMethods[0] : memoryMethods,
          usage_notes: currentWord.usage_notes,
          common_mistakes: currentWord.common_mistakes,
          example_sentences: currentWord.example_sentences,
          example_translations: currentWord.example_translations
        }
        
        // Check if already learned
        const learnedWords = uni.getStorageSync('learned_words') || []
        isLearned.value = learnedWords.includes(currentWord.word)
      }
    } catch (e) {
      console.error('Parse word list error:', e, 'Raw:', options.wordList?.slice(0, 200))
    }
  } 
  // Handle single word parameter (from diagnostic/word.vue)
  else if (options.word) {
    const wordText = decodeURIComponent(options.word)
    console.log('Loading single word:', wordText)
    
    if (fullWordsData && Array.isArray(fullWordsData)) {
      const word = fullWordsData.find((w: any) => w.word.toLowerCase() === wordText.toLowerCase())
      if (word) {
        wordList.value = [{ word: word.word || '' }]
        currentIndex.value = 0
        wordData.value = {
          word: word.word || '',
          phonetic: word.phonetic || '',
          type: word.type || '',
          meaning: word.meaning || word.translation || '',
          memory_methods: typeof word.memory_methods === 'string' ? word.memory_methods : 
            Array.isArray(word.memory_methods) ? word.memory_methods[0] : '',
          usage_notes: word.usage_notes,
          common_mistakes: word.common_mistakes,
          example_sentences: word.example_sentences,
          example_translations: word.example_translations
        }
        
        // Check if already learned
        const learnedWords = uni.getStorageSync('learned_words') || []
        isLearned.value = learnedWords.includes(word.word)
        
        console.log('Loaded word data:', wordData.value)
      } else {
        console.warn('Word not found in words.json:', wordText)
      }
    }
  }
})
     
function stopLecture() {
  isLectureMode.value = false
  isSpeaking.value = false
  ttsService.stop()
}

async function updateWordData() {
  if (wordList.value.length > 0 && currentIndex.value < wordList.value.length) {
    const currentWord = wordList.value[currentIndex.value]
    const wordName = currentWord.word
    
    // Check if we have full details in cache
    const fullWord = fullWordsCache.get(wordName)
    
    if (fullWord) {
      wordData.value = {
        word: fullWord.word || '',
        phonetic: fullWord.phonetic || '',
        type: fullWord.type || '',
        meaning: fullWord.meaning || '',
        memory_methods: typeof fullWord.memory_methods === 'string' ? fullWord.memory_methods : JSON.stringify(fullWord.memory_methods),
        usage_notes: typeof fullWord.usage_notes === 'string' ? fullWord.usage_notes : JSON.stringify(fullWord.usage_notes),
        common_mistakes: typeof fullWord.common_mistakes === 'string' ? fullWord.common_mistakes : JSON.stringify(fullWord.common_mistakes),
        example_sentences: fullWord.example_sentences,
        example_translations: fullWord.example_translations
      }
    } else {
      // Fallback to minimal data
      wordData.value = {
        word: currentWord.word || '',
        phonetic: currentWord.phonetic || '',
        type: currentWord.type || '',
        meaning: currentWord.meaning || '',
        memory_methods: undefined,
        usage_notes: undefined,
        common_mistakes: undefined,
        example_sentences: undefined,
        example_translations: undefined
      }
      
      // Load full details in background
      await loadFullWordDetails()
      const cachedWord = fullWordsCache.get(wordName)
      if (cachedWord) {
        wordData.value = {
          word: cachedWord.word || '',
          phonetic: cachedWord.phonetic || '',
          type: cachedWord.type || '',
          meaning: cachedWord.meaning || '',
          memory_methods: typeof cachedWord.memory_methods === 'string' ? cachedWord.memory_methods : JSON.stringify(cachedWord.memory_methods),
          usage_notes: typeof cachedWord.usage_notes === 'string' ? cachedWord.usage_notes : JSON.stringify(cachedWord.usage_notes),
          common_mistakes: typeof cachedWord.common_mistakes === 'string' ? cachedWord.common_mistakes : JSON.stringify(cachedWord.common_mistakes),
          example_sentences: cachedWord.example_sentences,
          example_translations: cachedWord.example_translations
        }
      }
    }
    
    // Check if already learned
    const learnedWords = uni.getStorageSync('learned_words') || []
    isLearned.value = learnedWords.includes(wordName)
    
    // Reset display states
    showAnswer.value = false
    showMemory.value = false
  }
}

function goToPrevWord() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    updateWordData()
  }
}

function goToNextWord() {
  if (currentIndex.value < wordList.value.length - 1) {
    currentIndex.value++
    updateWordData()
  }
}

// Touch handling for swipe
function onTouchStart(e: any) {
  touchStartX = e.touches[0].clientX
}

function onTouchEnd(e: any) {
  touchEndX = e.changedTouches[0].clientX
  const diff = touchStartX - touchEndX
  
  if (Math.abs(diff) > 50) {
    if (diff > 0) {
      // Swipe left - next word
      goToNextWord()
    } else {
      // Swipe right - previous word
      goToPrevWord()
    }
  }
}

function toggleMastery() {
  let learnedWords = uni.getStorageSync('learned_words') || []
  
  if (isLearned.value) {
    learnedWords = learnedWords.filter((w: string) => w !== wordData.value.word)
  } else {
    if (!learnedWords.includes(wordData.value.word)) {
      learnedWords.push(wordData.value.word)
    }
  }
  
  uni.setStorageSync('learned_words', learnedWords)
  isLearned.value = !isLearned.value
  
  uni.showToast({
    title: isLearned.value ? '已掌握' : '取消掌握',
    icon: 'none'
  })
}

function toggleAnswer() {
  showAnswer.value = !showAnswer.value
}

// Full word data cache for lazy loading
let fullWordsCache: Map<string, any> = new Map()

async function loadFullWordDetails() {
  if (fullWordsCache.size > 0) return
  
  if (fullWordsData && Array.isArray(fullWordsData)) {
    fullWordsData.forEach((w: any) => {
      fullWordsCache.set(w.word, w)
    })
  }
}

async function toggleMemory() {
  if (!showMemory.value) {
    showMemory.value = true
    
    // Lazy load full details if not available
    if (!wordData.value.memory_methods) {
      await loadFullWordDetails()
      const fullWord = fullWordsCache.get(wordData.value.word)
      if (fullWord) {
        wordData.value = {
          ...wordData.value,
          memory_methods: typeof fullWord.memory_methods === 'string' ? fullWord.memory_methods : JSON.stringify(fullWord.memory_methods),
          usage_notes: typeof fullWord.usage_notes === 'string' ? fullWord.usage_notes : JSON.stringify(fullWord.usage_notes),
          common_mistakes: typeof fullWord.common_mistakes === 'string' ? fullWord.common_mistakes : JSON.stringify(fullWord.common_mistakes),
          example_sentences: fullWord.example_sentences,
          example_translations: fullWord.example_translations
        }
      }
    }
  } else {
    showMemory.value = false
  }
}

function speakWord() {
  if (!wordData.value.word) return
  
  isSpeaking.value = true
  
  // Use TTS service if available
  if (ttsService) {
    ttsService.speak(wordData.value.word, () => {
      isSpeaking.value = false
    })
  } else {
    // Fallback: just show toast
    uni.showToast({
      title: `朗读: ${wordData.value.word}`,
      icon: 'none'
    })
    setTimeout(() => {
      isSpeaking.value = false
    }, 1000)
  }
}

function startLecture() {
  if (!wordData.value.word) return
  
  isLectureMode.value = true
  showMemory.value = true
  
  // Auto-speak the word first
  speakWord()
  
  // Then read the memory methods, usage notes, etc.
  setTimeout(() => {
    let lectureText = wordData.value.word + '. '
    if (wordData.value.meaning) {
      lectureText += wordData.value.meaning + '. '
    }
    if (wordData.value.memory_methods) {
      lectureText += wordData.value.memory_methods + '. '
    }
    if (wordData.value.usage_notes) {
      lectureText += wordData.value.usage_notes
    }
    
    if (ttsService && lectureText.length > 10) {
      ttsService.speak(lectureText, () => {
        // Lecture complete
      })
    }
  }, 2000)
}
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.detail-page .content {
  padding: 16px 20px 16px 16px;
  overflow: hidden;
  box-sizing: border-box;
}

.content {
  flex: 1;
  height: calc(100vh - 60px);
}

.word-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px 20px;
  color: #fff;
}

.word-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.word-main {
  flex: 1;
}

.word-text {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
}

.phonetic-row {
  margin-bottom: 8px;
}

.phonetic {
  font-size: 16px;
  opacity: 0.9;
}

.meaning-row {
  margin-bottom: 4px;
}

.meaning-text {
  font-size: 16px;
  opacity: 0.95;
}

.meaning-hidden {
  font-size: 16px;
  letter-spacing: 2px;
  opacity: 0.5;
}

.hint-text {
  font-size: 12px;
  opacity: 0.6;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 12px;
}

.action-btn.active {
  background: #fff;
  color: #667eea;
}

.action-icon {
  font-size: 16px;
}

.action-label {
  font-size: 12px;
}

.speak-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.speak-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
}

.loading-icon {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.speak-text {
  font-size: 13px;
}

.stop-btn {
  padding: 8px 12px;
  background: #ff4d4f;
  border-radius: 20px;
  font-size: 12px;
}

/* Section Styles */
.section {
  margin: 12px;
  border-radius: 12px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  font-weight: bold;
}

.section-icon {
  font-size: 18px;
}

.section-title {
  font-size: 16px;
}

.section-content {
  padding: 0 16px 16px;
  font-size: 14px;
  line-height: 1.8;
}

/* Memory Section - Purple */
.memory-section {
  background: #f3e8ff;
  border: 1px solid #d8b4fe;
}

.memory-section .section-header {
  color: #7c3aed;
}

/* Usage Section - Amber */
.usage-section {
  background: #fef3c7;
  border: 1px solid #fcd34d;
}

.usage-section .section-header {
  color: #d97706;
}

/* Example Section - Blue */
.example-section {
  background: #dbeafe;
  border: 1px solid #93c5fd;
}

.example-section .section-header {
  color: #2563eb;
}

.examples-vertical {
  padding: 0 16px;
}

.examples-vertical .example-card {
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
}

.examples-vertical .example-card:last-child {
  margin-bottom: 0;
}

.example-text {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 8px;
}

.example-translation {
  font-size: 12px;
  color: #666;
}

/* Mistake Section - Red */
.mistake-section {
  background: #fee2e2;
  border: 1px solid #fca5a5;
}

.mistake-section .section-header {
  color: #dc2626;
}

/* Bottom Bar */
.bottom-bar {
  background: #fff;
  padding: 12px 20px;
  border-top: 1px solid #eee;
}

.mastery-toggle {
  text-align: center;
}

.mastery-btn {
  display: inline-block;
  padding: 12px 40px;
  background: #f5f5f5;
  border-radius: 25px;
  font-size: 16px;
  color: #666;
}

.mastery-btn.mastered {
  background: #52c41a;
  color: #fff;
}

/* Swipe Navigation Hint */
.swipe-hint {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.swipe-hint .hint-left,
.swipe-hint .hint-right {
  color: #667eea;
  font-size: 14px;
  padding: 4px 8px;
}

.swipe-hint .hint-center {
  font-size: 12px;
  color: #999;
}
</style>