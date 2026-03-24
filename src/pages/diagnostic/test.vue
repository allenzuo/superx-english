<template>
  <view class="diagnostic-test">
    <view class="header">
      <view class="progress-info">
        <text class="progress-text">{{ currentIndex + 1 }}/{{ totalQuestions }}</text>
        <text class="section-text">{{ currentSection }}</text>
      </view>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
      </view>
    </view>

    <scroll-view class="content" scroll-y v-if="!isCompleted && currentQuestion">
      <view class="question-card">
        <view class="question-type-badge" :style="{ background: sectionColor }">
          {{ getSectionLabel(currentSection) }}
        </view>
        
        <view class="question-text">{{ currentQuestion.content || currentQuestion.question }}</view>
        
        <view class="options" v-if="currentQuestion.options && currentQuestion.options.length > 0">
          <view 
            v-for="(option, idx) in currentQuestion.options" 
            :key="idx"
            :class="['option', { 
              selected: selectedAnswer === idx,
              correct: showResult && idx === (currentQuestion.correctIndex || 0),
              wrong: showResult && selectedAnswer === idx && idx !== (currentQuestion.correctIndex || 0)
            }]"
            @tap="selectAnswer(idx)"
          >
            <view class="option-label">{{ String.fromCharCode(65 + idx) }}</view>
            <view class="option-text">{{ option }}</view>
          </view>
        </view>

        <view class="result" v-if="showResult">
          <view :class="['result-badge', isCorrect ? 'correct' : 'wrong']">
            {{ isCorrect ? '回答正确 ✓' : '回答错误 ✗' }}
          </view>
          <view class="explanation" v-if="currentQuestion.analysis">
            <text class="explanation-title">解析：</text>
            <text class="explanation-text">{{ currentQuestion.analysis }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="bottom-actions">
      <button v-if="!showResult" type="primary" :disabled="selectedAnswer === null" @tap="submitAnswer">
        提交答案
      </button>
      <button v-else type="primary" @tap="nextQuestion">
        {{ currentIndex < totalQuestions - 1 ? '下一题' : '查看结果' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { questionService } from '@/services/question'
import { listeningService } from '@/services/listening'
import { grammarExerciseService } from '@/services/grammarExercise'
import type { Question } from '@/services/types'

const questions = ref<(Question | any)[]>([])
const currentIndex = ref(0)
const selectedAnswer = ref<number | null>(null)
const showResult = ref(false)
const isCompleted = ref(false)
const isLoading = ref(true)

const sectionConfig = [
  { name: 'listening', count: 8, label: '听力' },
  { name: 'single', count: 12, label: '单选题' },
  { name: 'cloze', count: 10, label: '完形填空' },
  { name: 'reading', count: 10, label: '阅读理解' },
  { name: 'grammar', count: 10, label: '语法' }
]

const totalQuestions = computed(() => questions.value.length)
const currentQuestion = computed(() => questions.value[currentIndex.value] || null)
const currentSection = computed(() => {
  let count = 0
  for (const section of sectionConfig) {
    count += section.count
    if (currentIndex.value < count) {
      return section.name
    }
  }
  return 'single'
})

const isCorrect = computed(() => selectedAnswer.value === (currentQuestion.value?.correctIndex || 0))

const progressPercent = computed(() => {
  if (totalQuestions.value === 0) return 0
  return Math.round(((currentIndex.value + 1) / totalQuestions.value) * 100)
})

const sectionColors: Record<string, string> = {
  listening: '#45B7D1',
  single: '#667eea',
  cloze: '#FF006E',
  reading: '#3A86FF',
  grammar: '#FFBE0B'
}

const sectionColor = computed(() => sectionColors[currentSection.value] || '#667eea')

function getSectionLabel(section: string): string {
  const config = sectionConfig.find(s => s.name === section)
  return config?.label || section
}

onMounted(async () => {
  await loadDiagnosticQuestions()
})

async function loadDiagnosticQuestions() {
  isLoading.value = true
  uni.showLoading({ title: '加载题目...' })
  
  try {
    await questionService.loadAll()
    await listeningService.loadQuestions()
    await grammarExerciseService.loadAllExercises()
    
    const allQuestions: (Question | any)[] = []
    
    const listening = listeningService.getRandomQuestions(8)
    allQuestions.push(...listening.map(q => ({
      ...q,
      content: q.audio_text || q.question,
      correctIndex: q.correct_answer
    })))
    
    const single = questionService.getQuestionsByType('single')
    const singleRandom = [...single].sort(() => Math.random() - 0.5).slice(0, 8)
    allQuestions.push(...singleRandom)
    
    const grammarEx = grammarExerciseService.getRandomExercises(10)
    allQuestions.push(...grammarEx.map(q => ({
      ...q,
      content: q.question
    })))
    
    const cloze = questionService.getQuestionsByType('完形填空')
    const clozeRandom = [...cloze].sort(() => Math.random() - 0.5).slice(0, 8)
    allQuestions.push(...clozeRandom)
    
    const reading = questionService.getQuestionsByType('reading')
    const readingRandom = [...reading].sort(() => Math.random() - 0.5).slice(0, 8)
    allQuestions.push(...readingRandom)
    
    questions.value = allQuestions
    
    if (questions.value.length < 40) {
      const moreGrammar = grammarExerciseService.getRandomExercises(20)
      questions.value.push(...moreGrammar.map(q => ({
        ...q,
        content: q.question
      })))
    }
    
    isLoading.value = false
    uni.hideLoading()
  } catch (e) {
    isLoading.value = false
    uni.hideLoading()
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

function selectAnswer(index: number) {
  if (showResult.value) return
  selectedAnswer.value = index
}

function submitAnswer() {
  if (selectedAnswer.value === null) return
  showResult.value = true
}

function nextQuestion() {
  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value++
    selectedAnswer.value = null
    showResult.value = false
  } else {
    isCompleted.value = true
    saveResults()
    uni.navigateTo({ url: '/pages/diagnostic/result' })
  }
}

function saveResults() {
  const results = {
    total: totalQuestions.value,
    correct: questions.value.filter((q, idx) => {
      const correctIdx = q.correctIndex || 0
      return false
    }).length,
    date: new Date().toISOString()
  }
  uni.setStorageSync('diagnostic_result', results)
}
</script>

<style scoped>
.diagnostic-test {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.header {
  background: #fff;
  padding: 16px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-text {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.section-text {
  font-size: 14px;
  color: #667eea;
}

.progress-bar {
  height: 6px;
  background: #eee;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
  transition: width 0.3s;
}

.content {
  flex: 1;
  padding: 16px;
}

.question-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}

.question-type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  color: #fff;
  font-size: 12px;
  margin-bottom: 16px;
}

.question-text {
  font-size: 18px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 20px;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option {
  display: flex;
  align-items: flex-start;
  padding: 14px;
  background: #f5f5f5;
  border-radius: 8px;
  border: 2px solid transparent;
}

.option.selected {
  border-color: #667eea;
  background: #f0f4ff;
}

.option.correct {
  border-color: #4caf50;
  background: #e8f5e9;
}

.option.wrong {
  border-color: #f44336;
  background: #ffebee;
}

.option-label {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 12px;
  flex-shrink: 0;
}

.option.selected .option-label {
  background: #667eea;
  color: #fff;
}

.option.correct .option-label {
  background: #4caf50;
  color: #fff;
}

.option.wrong .option-label {
  background: #f44336;
  color: #fff;
}

.option-text {
  flex: 1;
  font-size: 15px;
  color: #333;
  line-height: 1.5;
}

.result {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.result-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
}

.result-badge.correct {
  background: #e8f5e9;
  color: #4caf50;
}

.result-badge.wrong {
  background: #ffebee;
  color: #f44336;
}

.explanation {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
}

.explanation-title {
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

.explanation-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.bottom-actions {
  background: #fff;
  padding: 16px;
  border-top: 1px solid #eee;
}

.bottom-actions button {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 25px;
  padding: 14px;
  font-size: 16px;
}

.bottom-actions button[disabled] {
  background: #ccc;
}
</style>
