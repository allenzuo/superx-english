<template>
  <view class="type-page">
    <view class="header">
      <text class="title">你想练习什么题型？</text>
      <text class="subtitle">选择一种题型开始专项练习</text>
    </view>

    <!-- 传统题型 -->
    <view class="section">
      <view class="section-title">📝 传统题型</view>
      <view class="type-list">
        <view 
          v-for="type in traditionalTypes" 
          :key="type.id"
          class="type-card"
          :style="{ borderLeftColor: type.color }"
          @tap="startPractice(type.id)"
        >
          <view class="type-icon" :style="{ background: type.color }">
            <text>{{ type.icon }}</text>
          </view>
          <view class="type-info">
            <text class="type-name">{{ type.name }}</text>
            <text class="type-desc">{{ type.description }}</text>
          </view>
          <view class="type-count">
            <text class="count-num">{{ type.count }}</text>
            <text class="count-label">题</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 创新题型 -->
    <view class="section">
      <view class="section-title">🚀 创新题型</view>
      <view class="type-list">
        <view 
          v-for="type in innovationTypes" 
          :key="type.id"
          class="type-card"
          :style="{ borderLeftColor: type.color }"
          @tap="startPractice(type.id)"
        >
          <view class="type-icon" :style="{ background: type.color }">
            <text>{{ type.icon }}</text>
          </view>
          <view class="type-info">
            <text class="type-name">{{ type.name }}</text>
            <text class="type-desc">{{ type.description }}</text>
          </view>
          <view class="type-count">
            <text class="count-num">{{ type.count }}</text>
            <text class="count-label">篇</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { questionService } from '@/services/question'
import { readingService } from '@/services/reading'
import { writingService } from '@/services/writing'

interface QuestionType {
  id: string
  name: string
  icon: string
  color: string
  description: string
  count: string
}

const traditionalTypes = ref<QuestionType[]>([])
const innovationTypes = ref<QuestionType[]>([])

const typeColors: Record<string, string> = {
  'single': '#2196F3',
  'cloze': '#9C27B0',
  'reading': '#4CAF50',
  'dialogue': '#FF9800',
  'reading_new': '#009688',
  'cloze_new': '#673AB7',
  'reading_qa': '#00BCD4',
  'multimodal': '#3F51B5',
  'writing': '#FF5722'
}

const typeIcons: Record<string, string> = {
  'single': '✓',
  'cloze': '✍️',
  'reading': '📖',
  'dialogue': '💬',
  'reading_new': '📖',
  'cloze_new': '✍️',
  'reading_qa': '❓',
  'multimodal': '📊',
  'writing': '✏️'
}

const typeNames: Record<string, string> = {
  'single': '语法单选',
  'cloze': '完形填空',
  'reading': '阅读理解',
  'dialogue': '情景对话',
  'reading_new': '阅读理解-新',
  'cloze_new': '完形填空-新',
  'reading_qa': '阅读问答',
  'multimodal': '多模态阅读',
  'writing': '作文'
}

const typeDescs: Record<string, string> = {
  'single': '冠词、代词、时态、从句等语法点',
  'cloze': '综合语法和词汇运用',
  'reading': '理解文章主旨和细节',
  'dialogue': '口语交际与情景反应',
  'reading_new': '一篇文章，同页多题练习',
  'cloze_new': '一篇文章，同页多题练习',
  'reading_qa': '根据文章回答问题',
  'multimodal': '图表、图片等多元信息阅读',
  'writing': '命题作文技巧与范文'
}

onMounted(async () => {
  await questionService.loadAll()
  await readingService.loadData()
  await writingService.loadData()
  loadTypes()
})

function loadTypes() {
  const counts = questionService.getQuestionCountsByType()
  const countMap: Record<string, number> = {}
  counts.forEach(c => {
    countMap[c.id] = c.count
  })

  const traditional = ['single', 'cloze', 'reading', 'dialogue']
  traditionalTypes.value = traditional.map(id => ({
    id,
    name: typeNames[id] || id,
    icon: typeIcons[id] || '📝',
    color: typeColors[id] || '#666',
    description: typeDescs[id] || '',
    count: formatCount(countMap[id] || 0)
  }))

  const innovation = [
    { id: 'reading_new', count: readingService.getReadingStandardCount() },
    { id: 'cloze_new', count: readingService.getClozeGrammarCount() },
    { id: 'reading_qa', count: readingService.getReadingQACount() },
    { id: 'multimodal', count: readingService.getReadingMultimodalCount() },
    { id: 'writing', count: writingService.getSampleEssaysCount() }
  ]
  
  innovationTypes.value = innovation.map(item => ({
    id: item.id,
    name: typeNames[item.id] || item.id,
    icon: typeIcons[item.id] || '📝',
    color: typeColors[item.id] || '#666',
    description: typeDescs[item.id] || '',
    count: formatCount(item.count)
  }))
}

function formatCount(count: number): string {
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k+'
  }
  return String(count)
}

function startPractice(typeId: string) {
  const urlMap: Record<string, string> = {
    'single': '/pages/exam/practice?type=single',
    'cloze': '/pages/exam/practice?type=cloze',
    'reading': '/pages/exam/practice?type=reading',
    'dialogue': '/pages/exam/practice?type=dialogue',
    'listening': '/pages/exam/practice?type=listening',
    'reading_new': '/pages/reading/index?type=standard',
    'cloze_new': '/pages/reading/index?type=cloze_grammar',
    'reading_qa': '/pages/reading/index?type=qa',
    'multimodal': '/pages/reading/index?type=multimodal',
    'writing': '/pages/writing/index'
  }
  
  const url = urlMap[typeId]
  if (url) {
    uni.navigateTo({ url })
  }
}
</script>

<style scoped>
.type-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

.header {
  margin-bottom: 24px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 16px;
  color: #666;
}

.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.type-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  border-left: 4px solid;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.type-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 12px;
  color: #fff;
}

.type-info {
  flex: 1;
}

.type-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 4px;
}

.type-desc {
  font-size: 13px;
  color: #999;
}

.type-count {
  text-align: right;
}

.count-num {
  font-size: 20px;
  font-weight: bold;
  color: #667eea;
}

.count-label {
  font-size: 12px;
  color: #999;
  margin-left: 2px;
}
</style>
