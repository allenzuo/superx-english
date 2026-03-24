<template>
  <view class="practice-page">
    <view class="header">
      <view class="header-top">
        <text class="title">{{ title }}</text>
        <text class="progress">{{ currentIndex + 1 }}/{{ questions.length }}</text>
      </view>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
      </view>
    </view>

    <scroll-view class="content" scroll-y v-if="!isCompleted && questions.length > 0">
      <view class="question-card">
        <view class="question-meta">
          <text class="question-type">{{ getTypeLabel(currentQuestion.type) }}</text>
          <text class="question-difficulty">{{ getDifficultyLabel(currentQuestion.difficulty) }}</text>
          <text class="question-year">{{ currentQuestion.year }}年</text>
        </view>
        <view class="question-text">{{ currentQuestion.question }}</view>
        
        <view class="options" v-if="currentQuestion.options && currentQuestion.options.length > 0">
          <view 
            v-for="(option, idx) in currentQuestion.options" 
            :key="idx"
            :class="['option', { 
              selected: selectedAnswer === idx,
              correct: showResult && idx === currentQuestion.correctIndex,
              wrong: showResult && selectedAnswer === idx && idx !== currentQuestion.correctIndex
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
          <view class="explanation" v-if="currentQuestion.analysis || currentQuestion.explanation">
            <text class="explanation-title">解析：</text>
            <text class="explanation-text">{{ currentQuestion.analysis || currentQuestion.explanation }}</text>
          </view>
          <view class="ai-explain-btn" v-if="!aiExplanation" @tap="askAIExplanation">
            🤖 AI详细解析
          </view>
          <view class="ai-explain" v-if="aiExplanation">
            <view class="ai-badge">🤖 AI深度解析</view>
            <view class="ai-section" v-if="aiExplanation.knowledgePoint">
              <view class="ai-section-label">📚 知识点</view>
              <view class="ai-section-text">{{ aiExplanation.knowledgePoint }}</view>
            </view>
            <view class="ai-section" v-if="aiExplanation.explanation">
              <view class="ai-section-label">🔍 详细解析</view>
              <view class="ai-section-text">{{ aiExplanation.explanation }}</view>
            </view>
            <view class="ai-section" v-if="aiExplanation.memoryTip">
              <view class="ai-section-label">🧠 记忆技巧</view>
              <view class="ai-section-text">{{ aiExplanation.memoryTip }}</view>
            </view>
            <view class="ai-section" v-if="aiExplanation.relatedGrammar">
              <view class="ai-section-label">📖 相关语法</view>
              <view class="ai-section-text">{{ aiExplanation.relatedGrammar }}</view>
            </view>
            <view class="ai-section" v-if="aiExplanation.similarQuestion">
              <view class="ai-section-label">📝 同类题目</view>
              <view class="ai-section-text">{{ aiExplanation.similarQuestion }}</view>
            </view>
            <view class="ai-section" v-if="aiExplanation.wrongOptionAnalysis && aiExplanation.wrongOptionAnalysis.length > 0">
              <view class="ai-section-label">❌ 错项分析</view>
              <view class="ai-section-text" v-for="(opt, idx) in aiExplanation.wrongOptionAnalysis" :key="idx">
                {{ opt.option }}: {{ opt.whyWrong }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="isLoading" class="loading">
      <text>加载题目中...</text>
    </view>

    <view class="empty" v-if="!isLoading && questions.length === 0">
      <text>暂无题目</text>
    </view>

    <view class="completed" v-if="isCompleted">
      <view class="completed-icon">🎉</view>
      <view class="completed-title">练习完成！</view>
      <view class="completed-stats">
        <view class="stat">
          <text class="stat-value">{{ correctCount }}</text>
          <text class="stat-label">正确数</text>
        </view>
        <view class="stat">
          <text class="stat-value">{{ questions.length - correctCount }}</text>
          <text class="stat-label">错误数</text>
        </view>
        <view class="stat">
          <text class="stat-value">{{ accuracy }}%</text>
          <text class="stat-label">正确率</text>
        </view>
      </view>
      <view class="completed-actions">
        <button @tap="retryAll">重新练习</button>
        <button type="primary" @tap="goBack">返回</button>
      </view>
    </view>

    <view class="bottom-actions" v-if="!isCompleted && questions.length > 0">
      <button v-if="!showResult" type="primary" :disabled="selectedAnswer === null" @tap="submitAnswer">
        提交答案
      </button>
      <button v-else type="primary" @tap="nextQuestion">
        {{ currentIndex < questions.length - 1 ? '下一题' : '查看结果' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { questionService } from '@/services/question'
import { grammarExerciseService } from '@/services/grammarExercise'
import { wrongQuestionService } from '@/services/wrongQuestion'
import { aiService } from '@/services/ai'
import type { Question } from '@/services/types'

const title = ref('语法选择题')
const practiceType = ref('random')
const questions = ref<Question[]>([])
const currentIndex = ref(0)
const selectedAnswer = ref<number | null>(null)
const showResult = ref(false)
const isCompleted = ref(false)
const correctCount = ref(0)
const isLoading = ref(true)
const answers = ref<number[]>([])
const aiExplanation = ref<any>(null)
const aiLoading = ref(false)

const currentQuestion = computed(() => questions.value[currentIndex.value] || {} as Question)
const isCorrect = computed(() => selectedAnswer.value === currentQuestion.value.correctIndex)
const progressPercent = computed(() => {
  if (questions.value.length === 0) return 0
  return Math.round(((currentIndex.value + 1) / questions.value.length) * 100)
})
const accuracy = computed(() => {
  if (questions.value.length === 0) return 0
  return Math.round((correctCount.value / questions.value.length) * 100)
})

onMounted(async () => {
  await loadQuestions()
})

async function loadQuestions() {
  isLoading.value = true
  uni.showLoading({ title: '加载题目...' })
  
  try {
    await questionService.loadAll()
    await grammarExerciseService.loadAllExercises()
    
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const options = (currentPage as any).options || {}
    
    const practiceTypeValue = options.type || 'random'
    practiceType.value = practiceTypeValue
    const limit = options.limit ? parseInt(options.limit) : null  // null means no limit
    const weakPoint = options.weakPoint || ''
    const practiceYear = options.year ? parseInt(options.year) : null
    const questionDataStr = options.data || ''
    
    let q: Question[] = []
    
    // Handle single wrong question retry
    if (practiceTypeValue === 'wrongQuestion' && questionDataStr) {
      try {
        const questionData = JSON.parse(decodeURIComponent(questionDataStr))
        q = [{
          id: questionData.questionId || 'wrong_' + Date.now(),
          year: 0,
          type: questionData.type || 'single',
          difficulty: 'medium',
          question: questionData.question || '',
          content: questionData.question || '',
          options: questionData.options || [],
          answer: questionData.correctAnswer || '',
          analysis: questionData.explanation || questionData.analysis || '',
          tags: [],
          source: '错题本',
          correctIndex: questionData.options?.findIndex((o: string) => o === questionData.correctAnswer) || 0
        }]
        title.value = '错题重练'
      } catch (e) {
        console.error('Parse question data error:', e)
        q = []
      }
    } else if (practiceTypeValue === 'random') {
      const fromQuestion = questionService.getRandomQuestions(limit || 10)
      const fromGrammar = grammarExerciseService.getRandomExercises(limit || 10)
      q = [...fromQuestion, ...fromGrammar].sort(() => Math.random() - 0.5).slice(0, limit || 10)
      title.value = '随机练习'
    } else if (practiceTypeValue === 'year' && practiceYear) {
      const byYear = questionService.getQuestionsByYear(practiceYear)
      q = limit ? byYear.slice(0, limit) : byYear
      title.value = `${practiceYear}年真题练习`
    } else if (practiceTypeValue === 'single') {
      const all = questionService.getQuestionsByType('single')
      q = limit ? all.slice(0, limit) : all
      title.value = '单选题练习'
    } else if (practiceTypeValue === 'reading') {
      const all = questionService.getQuestionsByType('reading')
      q = limit ? all.slice(0, limit) : all
      title.value = '阅读理解'
    } else if (practiceTypeValue === 'cloze') {
      const all = questionService.getQuestionsByType('cloze')
      q = limit ? all.slice(0, limit) : all
      title.value = '完形填空'
    } else if (practiceTypeValue === 'dialogue') {
      const all = questionService.getQuestionsByType('dialogue')
      q = limit ? all.slice(0, limit) : all
      title.value = '情景对话'
    } else if (practiceTypeValue === 'listening') {
      const all = questionService.getQuestionsByType('listening')
      q = limit ? all.slice(0, limit) : all
      title.value = '听力练习'
    } else if (practiceTypeValue === 'weakPoint' && weakPoint) {
      const fromQuestion = questionService.getQuestionsByTopic(weakPoint).slice(0, limit || 10)
      const fromGrammar = grammarExerciseService.getExercises({ tag: weakPoint, limit: limit || 10 })
      q = [...fromQuestion, ...fromGrammar].slice(0, limit || 10)
      title.value = `薄弱点: ${weakPoint}`
    } else {
      const fromQuestion = questionService.getRandomQuestions(limit || 10)
      const fromGrammar = grammarExerciseService.getRandomExercises(limit || 10)
      q = [...fromQuestion, ...fromGrammar].sort(() => Math.random() - 0.5).slice(0, limit || 10)
      title.value = '真题练习'
    }
    
    questions.value = q
    
    console.log('Loaded questions:', questions.value.length, 'type:', practiceType)
    
    if (questions.value.length < 1) {
      questions.value = grammarExerciseService.getRandomExercises(10)
      title.value = '语法练习'
    }
    
    isLoading.value = false
    uni.hideLoading()
  } catch (e) {
    isLoading.value = false
    uni.hideLoading()
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'single': '单选题',
    '完形填空': '完形填空',
    'reading': '阅读理解',
    'dialogue': '情景对话',
    'grammar': '语法',
    'vocabulary': '词汇',
    'listening': '听力',
    'writing': '写作'
  }
  return labels[type] || '选择题'
}

function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    'easy': '简单',
    'medium': '中等',
    'hard': '困难'
  }
  return labels[difficulty] || '中等'
}

function selectAnswer(index: number) {
  if (showResult.value) return
  selectedAnswer.value = index
}

function submitAnswer() {
  if (selectedAnswer.value === null) return
  showResult.value = true
  answers.value.push(selectedAnswer.value)
  
  if (isCorrect.value) {
    correctCount.value++
    // If this was a wrong question retry and answered correctly, mark as mastered
    if (practiceType.value === 'wrongQuestion' && currentQuestion.value) {
      wrongQuestionService.markAsMastered(currentQuestion.value.id)
    }
  } else {
    addToWrongQuestions(currentQuestion.value, selectedAnswer.value)
  }
}

function addToWrongQuestions(question: Question, userAnswer: number) {
  wrongQuestionService.addWrongQuestion(question, question.options?.[userAnswer] || '')
}

function removeFromWrongQuestions(questionId: string) {
  wrongQuestionService.deleteWrongQuestion(questionId)
}

function nextQuestion() {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    selectedAnswer.value = null
    showResult.value = false
    aiExplanation.value = null
  } else {
    isCompleted.value = true
    updateStats()
  }
}

function updateStats() {
  const stats = uni.getStorageSync('practice_stats') || { total: 0, correct: 0 }
  stats.total += questions.value.length
  stats.correct += correctCount.value
  uni.setStorageSync('practice_stats', stats)
}

async function askAIExplanation() {
  if (aiLoading.value) return
  aiLoading.value = true
  uni.showLoading({ title: 'AI分析中...' })
  try {
    const q = currentQuestion.value
    const correctAnswer = q.options?.[q.correctIndex] || q.answer || ''
    const userAnswer = selectedAnswer.value !== null ? q.options?.[selectedAnswer.value] : ''
    aiExplanation.value = await aiService.explainQuestion(
      q.question || q.content || '',
      q.options || [],
      correctAnswer,
      userAnswer,
      q.type || 'single'
    )
  } catch (e) {
    console.error('AI explanation error:', e)
    uni.showToast({ title: 'AI解析失败', icon: 'none' })
  }
  aiLoading.value = false
  uni.hideLoading()
}

function retryAll() {
  questions.value = questionService.getRandomQuestions(questions.value.length)
  currentIndex.value = 0
  selectedAnswer.value = null
  showResult.value = false
  isCompleted.value = false
  correctCount.value = 0
  answers.value = []
  aiExplanation.value = null
}

function goBack() {
  uni.navigateBack()
}
</script>

<style scoped>
.practice-page {
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

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.progress {
  font-size: 14px;
  color: #667eea;
}

.progress-bar {
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
  transition: width 0.3s;
}

.content {
  flex: 1;
  padding: 16px;
  padding-bottom: 100px;
}

.question-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}

.question-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.question-type {
  font-size: 12px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
}

.question-difficulty {
  font-size: 12px;
  color: #faad14;
  background: rgba(250, 173, 20, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
}

.question-year {
  font-size: 12px;
  color: #999;
  background: #f5f5f5;
  padding: 4px 12px;
  border-radius: 12px;
}

.question-text {
  font-size: 16px;
  color: #333;
  line-height: 1.8;
  margin-bottom: 20px;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: #f5f5f5;
  border-radius: 10px;
  border: 2px solid transparent;
}

.option.selected {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.option.correct {
  border-color: #52c41a;
  background: rgba(82, 196, 26, 0.1);
}

.option.wrong {
  border-color: #ff4d4f;
  background: rgba(255, 77, 79, 0.1);
}

.option-label {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #666;
  margin-right: 12px;
}

.option.selected .option-label {
  background: #667eea;
  color: #fff;
}

.option.correct .option-label {
  background: #52c41a;
  color: #fff;
}

.option.wrong .option-label {
  background: #ff4d4f;
  color: #fff;
}

.option-text {
  flex: 1;
  font-size: 15px;
  color: #333;
}

.result {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.result-badge {
  display: inline-block;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 16px;
}

.result-badge.correct {
  background: rgba(82, 196, 26, 0.1);
  color: #52c41a;
}

.result-badge.wrong {
  background: rgba(255, 77, 79, 0.1);
  color: #ff4d4f;
}

.explanation {
  background: #fffbe6;
  padding: 16px;
  border-radius: 10px;
}

.explanation-title {
  font-weight: bold;
  color: #faad14;
  font-size: 14px;
}

.explanation-text {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin-top: 8px;
}

.loading, .empty {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #999;
  font-size: 14px;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 16px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.bottom-actions button {
  width: 100%;
  height: 48px;
  font-size: 16px;
}

.completed {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.completed-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.completed-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 30px;
}

.completed-stats {
  display: flex;
  gap: 40px;
  margin-bottom: 40px;
}

.completed-stats .stat {
  text-align: center;
}

.completed-stats .stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #667eea;
  display: block;
}

.completed-stats .stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 8px;
}

.completed-actions {
  display: flex;
  gap: 16px;
  width: 100%;
}

.completed-actions button {
  flex: 1;
  height: 48px;
}

.ai-explain-btn {
  margin-top: 20rpx;
  padding: 16rpx 32rpx;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border-radius: 24rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: bold;
}

.ai-explain {
  margin-top: 20rpx;
  padding: 24rpx;
  background: #f8f9ff;
  border-radius: 16rpx;
  border: 1rpx solid #e8e8ff;
}

.ai-badge {
  display: inline-block;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
}

.ai-section {
  margin-bottom: 16rpx;
}

.ai-section-label {
  font-size: 24rpx;
  color: #667eea;
  font-weight: bold;
  margin-bottom: 6rpx;
}

.ai-section-text {
  font-size: 26rpx;
  color: #555;
  line-height: 1.7;
}
</style>
