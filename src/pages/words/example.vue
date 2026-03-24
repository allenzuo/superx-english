<template>
  <view class="example-test-page">
    <view class="header">
      <view class="title">例句测试</view>
      <view class="progress">{{ currentIndex + 1 }}/{{ sentences.length }}</view>
    </view>

    <view class="sentence-card" v-if="sentences.length > 0">
      <view class="category-tag">
        <text :class="currentSentence.category">{{ currentSentence.categoryLabel }}</text>
      </view>
      <view class="sentence">{{ currentSentence.sentence }}</view>
      <view class="translation">{{ currentSentence.translation }}</view>
      
      <view class="actions">
        <button @tap="playAudio">🔊 朗读</button>
        <button @tap="showAnswer = !showAnswer">
          {{ showAnswer ? '隐藏答案' : '显示答案' }}
        </button>
      </view>

      <view class="answer-section" v-if="showAnswer">
        <view class="fill-blank" v-if="currentSentence.type === 'fill'">
          <text class="label">填空：</text>
          <text class="answer">{{ currentSentence.blank }}</text>
        </view>
        <view class="choice-section" v-if="currentSentence.type === 'choice'">
          <view 
            v-for="(opt, i) in currentSentence.options" 
            :key="i"
            :class="['option', { 
              selected: selectedAnswer === i,
              correct: showResult && i === currentSentence.answer,
              wrong: showResult && selectedAnswer === i && i !== currentSentence.answer
            }]"
            @tap="selectAnswer(i)"
          >
            {{ opt }}
          </view>
        </view>
      </view>
    </view>

    <view class="navigation">
      <button @tap="previousSentence" :disabled="currentIndex === 0">上一句</button>
      <button type="primary" @tap="nextSentence" :disabled="currentIndex >= sentences.length - 1">下一句</button>
    </view>

    <view class="result-bar" v-if="showResult">
      <text class="correct">正确: {{ correctCount }}</text>
      <text class="wrong">错误: {{ wrongCount }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ttsService } from '@/services/tts'

interface Sentence {
  sentence: string
  translation: string
  category: 'exam' | 'spoken'
  categoryLabel: string
  type: 'fill' | 'choice'
  blank?: string
  options?: string[]
  answer?: number
}

const sentences = ref<Sentence[]>([])
const currentIndex = ref(0)
const showAnswer = ref(false)
const showResult = ref(false)
const selectedAnswer = ref(-1)
const correctCount = ref(0)
const wrongCount = ref(0)

const currentSentence = computed(() => sentences.value[currentIndex.value] || {
  sentence: '',
  translation: '',
  category: 'exam',
  categoryLabel: '',
  type: 'fill'
})

onMounted(() => {
  loadSentences()
})

function loadSentences() {
  sentences.value = [
    {
      sentence: 'This test measures your analytic ability.',
      translation: '这个测试评估你的分析能力。',
      category: 'exam',
      categoryLabel: '【考试常考】',
      type: 'choice',
      options: ['ability', 'ability', 'ability', 'ability'],
      answer: 0
    },
    {
      sentence: 'I can speak multiple languages.',
      translation: '我会说多种语言。',
      category: 'spoken',
      categoryLabel: '【口语】',
      type: 'fill',
      blank: 'speak'
    },
    {
      sentence: 'The government has announced new measures.',
      translation: '政府宣布了新措施。',
      category: 'exam',
      categoryLabel: '【考试常考】',
      type: 'choice',
      options: ['announced', 'announced', 'announced', 'announced'],
      answer: 0
    },
    {
      sentence: 'What do you usually do on weekends?',
      translation: '你周末通常做什么？',
      category: 'spoken',
      categoryLabel: '【口语】',
      type: 'fill',
      blank: 'usually'
    },
    {
      sentence: 'It is necessary for students to learn English.',
      translation: '学生学习英语是必要的。',
      category: 'exam',
      categoryLabel: '【考试常考】',
      type: 'choice',
      options: ['necessary', 'necessary', 'necessary', 'necessary'],
      answer: 0
    }
  ]
}

function playAudio() {
  ttsService.speak(currentSentence.value.sentence)
}

function selectAnswer(index: number) {
  if (!showResult.value) {
    selectedAnswer.value = index
    
    if (index === currentSentence.value.answer) {
      correctCount.value++
    } else {
      wrongCount.value++
    }
    showResult.value = true
  }
}

function previousSentence() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    resetState()
  }
}

function nextSentence() {
  if (currentIndex.value < sentences.value.length - 1) {
    currentIndex.value++
    resetState()
  }
}

function resetState() {
  showAnswer.value = false
  showResult.value = false
  selectedAnswer.value = -1
}
</script>

<style scoped>
.example-test-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.title {
  font-size: 20px;
  font-weight: bold;
}

.progress {
  font-size: 16px;
}

.sentence-card {
  background: #fff;
  margin: 16px;
  border-radius: 12px;
  padding: 20px;
}

.category-tag {
  margin-bottom: 16px;
}

.category-tag text {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 4px;
}

.category-tag .exam {
  background: #fff1f0;
  color: #ff4d4f;
}

.category-tag .spoken {
  background: #fff7e6;
  color: #fa8c16;
}

.sentence {
  font-size: 20px;
  color: #333;
  line-height: 1.8;
  margin-bottom: 16px;
}

.translation {
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 12px;
}

.actions button {
  flex: 1;
}

.answer-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.fill-blank {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
}

.fill-blank .label {
  color: #666;
  margin-right: 8px;
}

.fill-blank .answer {
  color: #667eea;
  font-weight: bold;
}

.choice-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option {
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
}

.option.selected {
  background: #e6e6ff;
  color: #667eea;
}

.option.correct {
  background: #f6ffed;
  color: #52c41a;
}

.option.wrong {
  background: #fff1f0;
  color: #ff4d4f;
}

.navigation {
  display: flex;
  gap: 12px;
  padding: 16px;
}

.navigation button {
  flex: 1;
}

.result-bar {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 16px;
  background: #fff;
}

.result-bar .correct {
  color: #52c41a;
}

.result-bar .wrong {
  color: #ff4d4f;
}
</style>
