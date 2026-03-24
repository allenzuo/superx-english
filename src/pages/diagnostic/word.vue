<template>
  <view class="diagnostic-word-page">
    <view class="header">
      <view class="title">单词诊断</view>
      <view class="subtitle">测试你对单词的掌握程度</view>
    </view>

    <view class="stats-bar" v-if="results.length > 0">
      <view class="stat">
        <text class="value">{{ total }}</text>
        <text class="label">总题数</text>
      </view>
      <view class="stat correct">
        <text class="value">{{ correctCount }}</text>
        <text class="label">正确</text>
      </view>
      <view class="stat wrong">
        <text class="value">{{ wrongCount }}</text>
        <text class="label">错误</text>
      </view>
      <view class="stat">
        <text class="value">{{ accuracy }}%</text>
        <text class="label">正确率</text>
      </view>
    </view>

    <view class="question-card" v-if="!isFinished && currentQuestion">
      <view class="progress">{{ currentIndex + 1 }}/{{ questions.length }}</view>
      
      <view class="word-display">
        <view class="word">{{ currentQuestion.word }}</view>
        <view class="phonetic">{{ currentQuestion.phonetic }}</view>
      </view>

      <view class="meaning-blank" v-if="showAnswer">
        {{ currentQuestion.translation }}
      </view>
      <view class="meaning-blank hidden" v-else>
        点击显示答案
      </view>

      <view class="actions">
        <button class="btn-wrong" @tap="answer(false)">不认识</button>
        <button class="btn-correct" @tap="answer(true)">认识</button>
      </view>
    </view>

    <view class="result-card" v-if="isFinished">
      <view class="result-title">诊断完成！</view>
      <view class="result-score">{{ accuracy }}%</view>
      <view class="result-message">{{ resultMessage }}</view>
      
      <view class="weak-words" v-if="weakWords.length > 0">
        <view class="section-title">需要加强的单词</view>
        <view 
          v-for="word in weakWords" 
          :key="word"
          class="weak-word"
          @tap="reviewWord(word)"
        >
          {{ word }}
        </view>
      </view>

      <view class="result-actions">
        <button @tap="restart">重新测试</button>
        <button type="primary" @tap="goToReview">查看错词本</button>
      </view>
    </view>

    <view class="start-section" v-if="questions.length === 0">
      <view class="info">
        <view>测试说明：</view>
        <view>1. 系统会随机抽取20个单词</view>
        <view>2. 认识点击"认识"，不认识点击"不认识"</view>
        <view>3. 测试完成后显示诊断结果</view>
      </view>
      <button type="primary" @tap="startTest">开始诊断</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Question {
  word: string
  phonetic: string
  translation: string
  known: boolean
}

const questions = ref<Question[]>([])
const currentIndex = ref(0)
const showAnswer = ref(false)
const isFinished = ref(false)
const results = ref<boolean[]>([])

const currentQuestion = computed(() => questions.value[currentIndex.value])
const total = computed(() => results.value.length)
const correctCount = computed(() => results.value.filter(r => r).length)
const wrongCount = computed(() => results.value.filter(r => !r).length)
const accuracy = computed(() => total.value === 0 ? 0 : Math.round((correctCount.value / total.value) * 100))
const weakWords = computed(() => questions.value.filter((q, i) => i < results.value.length && !results.value[i]).map(q => q.word))
const resultMessage = computed(() => {
  const acc = accuracy.value
  if (acc >= 90) return '太棒了！你的词汇量很扎实！'
  if (acc >= 70) return '不错！继续加油！'
  if (acc >= 50) return '需要加强背单词了！'
  return '建议从基础词汇开始重新学习！'
})

onMounted(() => {
  loadQuestions()
})

function loadQuestions() {
  questions.value = [
    { word: 'abandon', phonetic: '/əˈbændən/', translation: 'v. 放弃，遗弃', known: false },
    { word: 'ability', phonetic: '/əˈbɪləti/', translation: 'n. 能力', known: false },
    { word: 'able', phonetic: '/ˈeɪbl/', translation: 'adj. 能够的', known: false },
    { word: 'about', phonetic: '/əˈbaʊt/', translation: 'prep. 关于', known: false },
    { word: 'above', phonetic: '/əˈbʌv/', translation: 'prep. 在...上面', known: false },
    { word: 'abroad', phonetic: '/əˈbrɔːd/', translation: 'adv. 在国外', known: false },
    { word: 'accept', phonetic: '/əkˈsept/', translation: 'v. 接受', known: false },
    { word: 'according', phonetic: '/əˈkɔːdɪŋ/', translation: 'adj. 根据的', known: false },
    { word: 'account', phonetic: '/əˈkaʊnt/', translation: 'n. 账户', known: false },
    { word: 'achieve', phonetic: '/əˈtʃiːv/', translation: 'v. 达到', known: false },
    { word: 'across', phonetic: '/əˈkrɒs/', translation: 'prep. 穿过', known: false },
    { word: 'action', phonetic: '/ˈækʃn/', translation: 'n. 行动', known: false },
    { word: 'active', phonetic: '/ˈæktɪv/', translation: 'adj. 积极的', known: false },
    { word: 'activity', phonetic: '/ækˈtɪvəti/', translation: 'n. 活动', known: false },
    { word: 'actor', phonetic: '/ˈæktər/', translation: 'n. 演员', known: false },
    { word: 'actress', phonetic: '/ˈæktrəs/', translation: 'n. 女演员', known: false },
    { word: 'actual', phonetic: '/ˈæktʃuəl/', translation: 'adj. 实际的', known: false },
    { word: 'add', phonetic: '/æd/', translation: 'v. 添加', known: false },
    { word: 'address', phonetic: '/əˈdres/', translation: 'n. 地址', known: false },
    { word: 'advise', phonetic: '/ədˈvaɪz/', translation: 'v. 建议', known: false }
  ]
}

function startTest() {
  currentIndex.value = 0
  showAnswer.value = false
  isFinished.value = false
  results.value = []
  
  shuffleArray(questions.value)
}

function answer(known: boolean) {
  results.value.push(known)
  
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    showAnswer.value = false
  } else {
    isFinished.value = true
    saveResults()
  }
}

function showAnswerToggle() {
  showAnswer.value = !showAnswer.value
}

function restart() {
  startTest()
}

function goToReview() {
  uni.switchTab({ url: '/pages/words/index' })
}

function reviewWord(word: string) {
  uni.navigateTo({
    url: `/pages/words/detail?word=${encodeURIComponent(word)}`
  })
}

function saveResults() {
  const weakWordsList = weakWords.value
  let savedWrong = uni.getStorageSync('diagnostic_wrong') || []
  savedWrong = [...new Set([...savedWrong, ...weakWordsList])]
  uni.setStorageSync('diagnostic_wrong', savedWrong)
}

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}
</script>

<style scoped>
.diagnostic-word-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px 20px;
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
}

.stats-bar {
  display: flex;
  background: #fff;
  padding: 16px;
  margin-bottom: 12px;
}

.stat {
  flex: 1;
  text-align: center;
}

.stat .value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  display: block;
}

.stat .label {
  font-size: 12px;
  color: #999;
}

.stat.correct .value {
  color: #52c41a;
}

.stat.wrong .value {
  color: #ff4d4f;
}

.question-card {
  background: #fff;
  margin: 16px;
  border-radius: 12px;
  padding: 24px;
}

.progress {
  text-align: center;
  color: #999;
  margin-bottom: 20px;
}

.word-display {
  text-align: center;
  margin-bottom: 24px;
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

.meaning-blank {
  text-align: center;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 18px;
  color: #333;
  margin-bottom: 24px;
}

.meaning-blank.hidden {
  color: #999;
  cursor: pointer;
}

.actions {
  display: flex;
  gap: 12px;
}

.btn-wrong {
  flex: 1;
  background: #ff4d4f;
  color: #fff;
}

.btn-correct {
  flex: 1;
  background: #52c41a;
  color: #fff;
}

.result-card {
  background: #fff;
  margin: 16px;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
}

.result-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.result-score {
  font-size: 64px;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 16px;
}

.result-message {
  font-size: 16px;
  color: #666;
  margin-bottom: 24px;
}

.weak-words {
  text-align: left;
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.weak-word {
  display: inline-block;
  padding: 6px 12px;
  background: #fff1f0;
  color: #ff4d4f;
  border-radius: 4px;
  margin: 4px;
  font-size: 14px;
}

.result-actions {
  display: flex;
  gap: 12px;
}

.result-actions button {
  flex: 1;
}

.start-section {
  padding: 40px 20px;
}

.info {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  font-size: 14px;
  color: #666;
  line-height: 2;
}
</style>
