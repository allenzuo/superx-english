<template>
  <view class="practice-page">
    <view class="header">
      <view class="header-top">
        <image class="back-btn" src="/static/tabbar/back.png" @tap="goBack"></image>
        <text class="title">{{ pageTitle }}</text>
        <text class="progress">{{ currentIndex + 1 }}/{{ totalItems }}</text>
      </view>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
      </view>
    </view>

    <scroll-view class="content" scroll-y v-if="!isLoading">
      <!-- Reading Passage -->
      <view v-if="practiceType === 'reading' || practiceType === 'cloze' || practiceType === 'multimodal'">
        <view class="passage-header">
          <text class="passage-title">{{ currentPassage?.title }}</text>
          <view class="tags">
            <text class="tag">{{ currentPassage?.year }}年</text>
            <text class="tag" v-if="currentPassage?.wordCount">{{ currentPassage?.wordCount }}词</text>
          </view>
        </view>
        
        <!-- Chart for multimodal -->
        <view v-if="practiceType === 'multimodal' && currentPassage?.media" class="chart-container">
          <view class="chart-title">{{ currentPassage.media.title || '图表' }}</view>
          <view class="chart-data">
            <view v-for="(value, key) in currentPassage.media.data" :key="key" class="chart-item">
              <text class="chart-label">{{ key }}</text>
              <view class="chart-bar-container">
                <view class="chart-bar" :style="{ width: (value / maxChartValue * 100) + '%' }"></view>
              </view>
              <text class="chart-value">{{ value }}</text>
            </view>
          </view>
          <view class="chart-labels" v-if="currentPassage.media.xAxisLabel || currentPassage.media.yAxisLabel">
            <text>{{ currentPassage.media.xAxisLabel }}</text>
            <text>{{ currentPassage.media.yAxisLabel }}</text>
          </view>
        </view>
        
        <!-- Description for multimodal -->
        <view v-if="practiceType === 'multimodal' && currentPassage?.description" class="description-box">
          <text>{{ currentPassage.description }}</text>
        </view>
        
        <view class="passage-content" v-if="currentPassage?.passage">
          <text>{{ currentPassage?.passage }}</text>
        </view>
      </view>

      <!-- Questions (for reading/cloze/multimodal with options) -->
      <view class="questions-section" v-if="currentQuestions.length > 0 && practiceType !== 'reading_qa' && practiceType !== 'writing'">
        <view 
          v-for="(q, qIndex) in currentQuestions" 
          :key="qIndex"
          class="question-card"
        >
          <view class="question-header">
            <text class="question-number">第{{ qIndex + 1 }}题</text>
            <text class="question-text">{{ getQuestionContent(q) }}</text>
          </view>
          
          <view class="options">
            <view 
              v-for="(value, key) in q.options" 
              :key="key"
              :class="['option', { 
                selected: userAnswers[`${currentIndex}_${qIndex}`] === key,
                correct: showResult && key === q.answer,
                wrong: showResult && userAnswers[`${currentIndex}_${qIndex}`] === key && key !== q.answer
              }]"
              @tap="selectAnswer(qIndex, key)"
            >
              <text class="option-key">{{ key }}</text>
              <text class="option-value">{{ value }}</text>
            </view>
          </view>

          <view class="analysis" v-if="showResult && userAnswers[`${currentIndex}_${qIndex}`]">
            <text :class="['result-tag', userAnswers[`${currentIndex}_${qIndex}`] === q.answer ? 'correct' : 'wrong']">
              {{ userAnswers[`${currentIndex}_${qIndex}`] === q.answer ? '回答正确' : '回答错误' }}
            </text>
            <text class="analysis-text">解析: {{ q.analysis }}</text>
          </view>
        </view>
      </view>

      <!-- Reading QA -->
      <view v-if="practiceType === 'reading_qa'">
        <view class="passage-header">
          <text class="passage-title">{{ currentPassage?.title }}</text>
          <view class="tags">
            <text class="tag">{{ currentPassage?.year }}年</text>
          </view>
        </view>
        <view class="passage-content">
          <text>{{ currentPassage?.passage }}</text>
        </view>
        <view class="questions-section">
          <view 
            v-for="(q, qIndex) in currentQuestions" 
            :key="qIndex"
            class="question-card"
          >
            <view class="question-header">
              <text class="question-number">第{{ q.number || qIndex + 1 }}题</text>
              <text class="question-text">{{ q.content }}</text>
            </view>
            <textarea 
              class="answer-input" 
              v-model="textAnswers[`${currentIndex}_${qIndex}`]"
              placeholder="请输入你的答案..."
              :disabled="showResult"
            ></textarea>
            <view class="analysis" v-if="showResult">
              <text class="result-label">参考答案:</text>
              <text class="sample-answer">{{ q.sampleAnswer }}</text>
              <text class="analysis-text">解析: {{ q.analysis }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Writing -->
      <view v-if="practiceType === 'writing'">
        <view class="writing-card">
          <text class="writing-title">{{ currentWriting?.scene }}</text>
          <view class="requirements">
            <text class="req-label">题目要求:</text>
            <text class="req-text">{{ currentWriting?.requirements }}</text>
          </view>
          <view class="input-section">
            <text class="input-label">你的作文:</text>
            <textarea 
              class="writing-input" 
              v-model="writingContent"
              placeholder="请输入你的作文..."
              :disabled="showResult"
            ></textarea>
          </view>
          <view class="sample-section">
            <view class="toggle-btn" @tap="showResult = !showResult">
              <text>{{ showResult ? '隐藏范文' : '查看范文' }}</text>
            </view>
            <view v-if="showResult && currentWriting?.essays" class="sample-essays">
              <view v-for="(essay, eIndex) in currentWriting.essays" :key="eIndex" class="essay-card">
                <view class="essay-header">
                  <text class="essay-level">{{ essay.level }}</text>
                  <text class="essay-score">{{ essay.score }}分</text>
                </view>
                <text class="essay-content">{{ essay.content }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="loading" v-if="isLoading">
      <text>加载中...</text>
    </view>

    <view class="bottom-bar" v-if="!isLoading">
      <view class="nav-buttons">
        <button class="nav-btn prev" :disabled="currentIndex === 0" @tap="prevItem">上一题</button>
        <button class="nav-btn next" @tap="nextItem">
          {{ currentIndex === totalItems - 1 ? '完成' : '下一题' }}
        </button>
      </view>
      <button class="submit-btn" @tap="toggleResult" v-if="!showResult">
        {{ examMode ? '交卷' : '查看答案' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { readingPracticeService, type ReadingPassage, type ClozePassage, type ReadingQAPassage, type MultimodalPassage, type WritingScene } from '@/services/readingPractice'

const practiceType = ref('reading')
const isLoading = ref(true)
const currentIndex = ref(0)
const showResult = ref(false)
const examMode = ref(false)
const writingContent = ref('')

const readingData = ref<ReadingPassage[]>([])
const clozeData = ref<ClozePassage[]>([])
const readingQAData = ref<ReadingQAPassage[]>([])
const multimodalData = ref<MultimodalPassage[]>([])
const writingData = ref<WritingScene[]>([])

const userAnswers = ref<Record<string, string>>({})
const textAnswers = ref<Record<string, string>>({})

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    reading: '阅读理解-新',
    cloze: '完形填空-新',
    reading_qa: '阅读问答',
    multimodal: '多模态阅读',
    writing: '作文'
  }
  return titles[practiceType.value] || '练习'
})

const totalItems = computed(() => {
  switch (practiceType.value) {
    case 'reading': return readingData.value.length
    case 'cloze': return clozeData.value.length
    case 'reading_qa': return readingQAData.value.length
    case 'multimodal': return multimodalData.value.length
    case 'writing': return writingData.value.length
    default: return 0
  }
})

const progressPercent = computed(() => {
  if (totalItems.value === 0) return 0
  return ((currentIndex.value + 1) / totalItems.value) * 100
})

const currentPassage = computed(() => {
  switch (practiceType.value) {
    case 'reading': return readingData.value[currentIndex.value]
    case 'cloze': return clozeData.value[currentIndex.value]
    case 'reading_qa': return readingQAData.value[currentIndex.value]
    case 'multimodal': return multimodalData.value[currentIndex.value]
    default: return null
  }
})

const maxChartValue = computed(() => {
  if (!currentPassage.value?.media?.data) return 10
  const values = Object.values(currentPassage.value.media.data) as number[]
  return Math.max(...values, 10)
})

const currentQuestions = computed(() => {
  if (!currentPassage.value) return []
  return currentPassage.value.questions || []
})

const currentWriting = computed(() => {
  return writingData.value[currentIndex.value]
})

onLoad((options: any) => {
  let type = 'reading'
  if (options.type) {
    type = options.type
  }
  practiceType.value = type
})

onMounted(async () => {
  await loadData()
  isLoading.value = false
})

async function loadData() {
  readingPracticeService.clearCache()
  try {
    switch (practiceType.value) {
      case 'reading':
        readingData.value = await readingPracticeService.loadReadingData()
        break
      case 'cloze':
        clozeData.value = await readingPracticeService.loadClozeData()
        break
      case 'reading_qa':
        readingQAData.value = await readingPracticeService.loadReadingQAData()
        break
      case 'multimodal':
        multimodalData.value = await readingPracticeService.loadMultimodalData()
        break
      case 'writing':
        writingData.value = await readingPracticeService.loadWritingData()
        break
    }
  } catch (e) {
    console.error('Error loading data:', e)
  }
}

function getQuestionContent(q: any): string {
  if (practiceType.value === 'cloze') {
    return `请选择空白处(${q.position})的正确形式`
  }
  return q.content || ''
}

function selectAnswer(qIndex: number, answer: string) {
  if (showResult.value) return
  userAnswers.value[`${currentIndex.value}_${qIndex}`] = answer
}

function toggleResult() {
  showResult.value = !showResult.value
}

function prevItem() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    showResult.value = false
    if (practiceType.value === 'writing') {
      writingContent.value = ''
    }
  }
}

function nextItem() {
  if (practiceType.value === 'writing') {
    const key = `${currentIndex.value}`
    textAnswers.value[key] = writingContent.value
  }
  
  if (currentIndex.value < totalItems.value - 1) {
    currentIndex.value++
    showResult.value = false
    if (practiceType.value === 'writing') {
      writingContent.value = textAnswers.value[`${currentIndex.value}`] || ''
    }
  } else {
    uni.showModal({
      title: '练习完成',
      content: `你已完成全部 ${totalItems.value} 题练习！`,
      showCancel: true,
      confirmText: '再做一组',
      cancelText: '确定',
      success: (res) => {
        if (res.confirm) {
          currentIndex.value = 0
          showResult.value = false
          userAnswers.value = {}
          textAnswers.value = {}
          writingContent.value = ''
          loadData()
        } else {
          goBack()
        }
      }
    })
  }
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
  padding-bottom: 12px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-top {
  display: flex;
  align-items: center;
  padding: 16px;
}

.back-btn {
  width: 24px;
  height: 24px;
}

.title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
}

.progress {
  font-size: 14px;
  color: #667eea;
}

.progress-bar {
  height: 4px;
  background: #eee;
}

.progress-fill {
  height: 100%;
  background: #667eea;
  transition: width 0.3s;
}

.content {
  flex: 1;
  padding: 16px;
  padding-bottom: 120px;
}

.passage-header {
  margin-bottom: 16px;
}

.passage-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

.tags {
  display: flex;
  gap: 8px;
}

.tag {
  font-size: 12px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}

.passage-content {
  background: #fff;
  padding: 16px;
  border-radius: 12px;
  line-height: 1.8;
  font-size: 16px;
  color: #333;
  margin-bottom: 20px;
}

.chart-container {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.chart-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.chart-data {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chart-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-label {
  width: 60px;
  font-size: 14px;
  color: #666;
}

.chart-bar-container {
  flex: 1;
  height: 20px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.chart-bar {
  height: 100%;
  background: #667eea;
  border-radius: 4px;
  transition: width 0.3s;
}

.chart-value {
  width: 40px;
  font-size: 14px;
  color: #333;
  text-align: right;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.description-box {
  background: #e8eaf6;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.questions-section {
  margin-top: 20px;
}

.question-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.question-header {
  margin-bottom: 12px;
}

.question-number {
  font-size: 14px;
  color: #667eea;
  font-weight: bold;
  display: block;
  margin-bottom: 8px;
}

.question-text {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fff;
}

.option.selected {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.option.correct {
  border-color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
}

.option.wrong {
  border-color: #f44336;
  background: rgba(244, 67, 54, 0.1);
}

.option-key {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f5f5f5;
  font-weight: bold;
  margin-right: 12px;
  flex-shrink: 0;
}

.option.selected .option-key {
  background: #667eea;
  color: #fff;
}

.option.correct .option-key {
  background: #4caf50;
  color: #fff;
}

.option.wrong .option-key {
  background: #f44336;
  color: #fff;
}

.option-value {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.analysis {
  margin-top: 12px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.result-tag {
  font-weight: bold;
  display: block;
  margin-bottom: 8px;
}

.result-tag.correct {
  color: #4caf50;
}

.result-tag.wrong {
  color: #f44336;
}

.analysis-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.answer-input {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  font-size: 14px;
  margin: 12px 0;
}

.sample-answer {
  display: block;
  color: #4caf50;
  font-weight: bold;
  margin: 8px 0;
}

.writing-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
}

.writing-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 16px;
}

.requirements {
  background: #e3f2fd;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.req-label {
  font-weight: bold;
  color: #1976d2;
  display: block;
  margin-bottom: 8px;
}

.req-text {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.input-section {
  margin-bottom: 16px;
}

.input-label {
  font-weight: bold;
  color: #ff9800;
  display: block;
  margin-bottom: 8px;
}

.writing-input {
  width: 100%;
  min-height: 150px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  font-size: 14px;
}

.toggle-btn {
  background: #667eea;
  color: #fff;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 12px;
}

.sample-essays {
  margin-top: 12px;
}

.essay-card {
  background: #fff3e0;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.essay-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.essay-level {
  font-weight: bold;
  color: #ff9800;
}

.essay-score {
  font-weight: bold;
  background: #ff9800;
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
}

.essay-content {
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 12px 16px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
}

.nav-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.nav-btn {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
}

.nav-btn.prev {
  background: #f5f5f5;
  color: #666;
}

.nav-btn.prev[disabled] {
  opacity: 0.5;
}

.nav-btn.next {
  background: #667eea;
  color: #fff;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: #4caf50;
  color: #fff;
  border-radius: 8px;
  font-size: 16px;
}
</style>
