<template>
  <view class="listening-practice">
    <view class="header">
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
      </view>
      <view class="progress-info">
        <text>{{ currentIndex + 1 }}/{{ questions.length }}</text>
        <text class="score">正确: {{ correctCount }}</text>
      </view>
    </view>

    <scroll-view class="content" scroll-y v-if="currentQuestion">
      <view class="question-card">
        <view class="question-type">{{ getTypeLabel(currentQuestion.type) }}</view>
        
        <view class="audio-section">
          <view class="audio-controls">
            <view class="play-btn" @tap="playAudio" :class="{ playing: isPlaying }">
              <text>{{ isPlaying ? '⏸' : '▶' }}</text>
            </view>
            <text class="play-hint">{{ isPlaying ? '播放中...' : '点击播放听力材料' }}</text>
          </view>
          <view class="show-text-btn" @tap="showAudioText">
            <text>{{ showAudioTextFlag ? '隐藏原文' : '显示原文' }}</text>
          </view>
        </view>

        <view class="audio-text" v-if="showAudioTextFlag && currentAudioText">
          <text class="audio-text-label">听力原文：</text>
          <text class="audio-text-content">{{ currentAudioText }}</text>
        </view>

        <view class="skill-hint" v-if="skillHint" @tap="showSkillHint">
          <text class="hint-icon">💡</text>
          <text class="hint-text">答题技巧提示</text>
        </view>

        <view class="question-text" v-if="currentQuestion.question">
          {{ currentQuestion.question }}
        </view>

        <view class="options" v-if="currentQuestion.options && currentQuestion.options.length > 0">
          <view 
            v-for="(option, idx) in currentQuestion.options" 
            :key="idx"
            :class="['option', { 
              selected: selectedAnswer === idx,
              correct: showResult && idx === (currentQuestion.correctIndex || currentQuestion.correct_answer),
              wrong: showResult && selectedAnswer === idx && idx !== (currentQuestion.correctIndex || currentQuestion.correct_answer)
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
        {{ currentIndex < questions.length - 1 ? '下一题' : '查看结果' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { listeningService } from '@/services/listening'
import { ttsService } from '@/services/tts'

interface ListeningQuestion {
  id: string
  type: string
  topic: string
  audio_text: string
  audioText: string
  question: string
  options: string[]
  correct_answer: number
  analysis: string
  difficulty: number
  year: number
  tags: string[]
}

const questions = ref<ListeningQuestion[]>([])
const currentIndex = ref(0)
const selectedAnswer = ref<number | null>(null)
const showResult = ref(false)
const isPlaying = ref(false)
const showAudioTextFlag = ref(false)
const correctCount = ref(0)
const isLoading = ref(true)

let practiceType = ''
let practiceTopic = ''
let practiceLimit = 10

onLoad((options: any) => {
  practiceType = options.type || ''
  practiceTopic = options.topic || ''
  practiceLimit = parseInt(options.limit) || 10
})

const currentQuestion = computed(() => questions.value[currentIndex.value] || null)

const isCorrect = computed(() => {
  if (!currentQuestion.value) return false
  const correctIdx = currentQuestion.value.correct_answer
  return selectedAnswer.value === correctIdx
})

const progressPercent = computed(() => {
  if (questions.value.length === 0) return 0
  return Math.round(((currentIndex.value + 1) / questions.value.length) * 100)
})

const skillHint = computed(() => {
  if (!currentQuestion.value) return ''
  return getSkillHintForQuestion(currentQuestion.value.question || '')
})

const currentAudioText = computed(() => {
  if (!currentQuestion.value) return ''
  return currentQuestion.value.audio_text || currentQuestion.value.audioText || ''
})

function showAudioText() {
  showAudioTextFlag.value = !showAudioTextFlag.value
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'short_dialogue': '短对话',
    'long_dialogue': '长对话',
    'monologue': '独白',
    'dictation': '听力填空'
  }
  return labels[type] || '听力'
}

function getSkillHintForQuestion(question: string): string {
  const hints: string[] = [
    '注意听关键词，特别是转折词后面的话',
    '关注数字和时间相关的信息',
    '理解说话人的态度和情感',
    '注意听对话发生的场景和地点',
    '把握文章主旨大意'
  ]
  const idx = Math.floor(Math.random() * hints.length)
  return hints[idx]
}

function showSkillHint() {
  uni.showModal({
    title: '答题技巧',
    content: skillHint.value,
    showCancel: false
  })
}

onMounted(async () => {
  await loadQuestions()
})

async function loadQuestions() {
  isLoading.value = true
  uni.showLoading({ title: '加载题目...' })
  
  try {
    await listeningService.loadQuestions()
    
    let filtered = listeningService.getQuestions({
      type: practiceType || undefined,
      topic: practiceTopic || undefined,
      limit: practiceLimit
    })
    
    if (filtered.length === 0) {
      filtered = listeningService.getRandomQuestions(practiceLimit)
    }
    
    questions.value = filtered
    isLoading.value = false
    uni.hideLoading()
  } catch (e) {
    isLoading.value = false
    uni.hideLoading()
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

function playAudio() {
  if (!currentQuestion.value?.audio_text) return
  
  if (isPlaying.value) {
    ttsService.stop()
    isPlaying.value = false
    return
  }
  
  isPlaying.value = true
  
  const audioText = currentQuestion.value.audio_text || currentQuestion.value.audioText || ''
  if (!audioText) {
    isPlaying.value = false
    uni.showToast({ title: '暂无听力内容', icon: 'none' })
    return
  }
  
  ttsService.speak(audioText, {
    success: () => {
      isPlaying.value = false
    },
    fail: () => {
      isPlaying.value = false
    }
  })
}

function selectAnswer(index: number) {
  if (showResult.value) return
  selectedAnswer.value = index
}

function submitAnswer() {
  if (selectedAnswer.value === null) return
  
  if (isCorrect.value) {
    correctCount.value++
  }
  
  showResult.value = true
}

function nextQuestion() {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    selectedAnswer.value = null
    showResult.value = false
  } else {
    uni.showModal({
      title: '练习完成',
      content: `正确 ${correctCount.value} / ${questions.value.length}`,
      showCancel: false,
      success: () => {
        uni.navigateBack()
      }
    })
  }
}
</script>

<style scoped>
.listening-practice {
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

.progress-bar {
  height: 6px;
  background: #eee;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #45B7D1 0%, #2C3E50 100%);
  transition: width 0.3s;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
}

.score {
  color: #4caf50;
  font-weight: bold;
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

.question-type {
  display: inline-block;
  padding: 4px 12px;
  background: #45B7D1;
  color: #fff;
  border-radius: 12px;
  font-size: 12px;
  margin-bottom: 16px;
}

.audio-section {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 12px;
  margin-bottom: 20px;
}

.audio-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.play-btn {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #45B7D1 0%, #2C3E50 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #fff;
  margin-bottom: 12px;
}

.play-btn.playing {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.play-hint {
  font-size: 14px;
  color: #999;
}

.skill-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: #fff8e1;
  border-radius: 8px;
  margin-bottom: 16px;
}

.hint-icon {
  margin-right: 8px;
}

.hint-text {
  font-size: 14px;
  color: #f57c00;
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
  border-color: #45B7D1;
  background: #e3f2fd;
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
  background: #45B7D1;
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
  background: linear-gradient(135deg, #45B7D1 0%, #2C3E50 100%);
  color: #fff;
  border: none;
  border-radius: 25px;
  padding: 14px;
  font-size: 16px;
}

.show-text-btn {
  margin-left: auto;
  padding: 6px 12px;
  background: #667eea;
  border-radius: 15px;
  font-size: 12px;
  color: #fff;
}

.audio-text {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  margin-top: 12px;
}

.audio-text-label {
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

.audio-text-content {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  white-space: pre-wrap;
}
</style>
