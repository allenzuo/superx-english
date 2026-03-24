<template>
  <view class="listening-type-page">
    <view class="header">
      <text class="title">听力专项训练</text>
      <text class="subtitle">选择题型和话题开始练习</text>
    </view>

    <view class="section">
      <view class="section-title">题型选择</view>
      <view class="type-grid">
        <view 
          :class="['type-item', { active: selectedType === '' }]"
          @tap="selectType('')"
        >
          <text class="type-icon">📋</text>
          <text class="type-name">全部</text>
        </view>
        <view 
          v-for="type in types" 
          :key="type.value"
          :class="['type-item', { active: selectedType === type.value }]"
          @tap="selectType(type.value)"
        >
          <text class="type-icon">{{ type.icon }}</text>
          <text class="type-name">{{ type.label }}</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">话题选择</view>
      <view class="topic-list">
        <view 
          :class="['topic-item', { active: selectedTopic === '' }]"
          @tap="selectTopic('')"
        >
          全部
        </view>
        <view 
          v-for="topic in availableTopics" 
          :key="topic"
          :class="['topic-item', { active: selectedTopic === topic }]"
          @tap="selectTopic(topic)"
        >
          {{ topic }}
        </view>
      </view>
    </view>

    <view class="question-count-section">
      <view class="count-display">
        <text class="count-label">可练习题目</text>
        <text class="count-value">{{ availableCount }}</text>
        <text class="count-unit">题</text>
      </view>
    </view>

    <view class="section">
      <view class="section-title">答题技巧</view>
      <view class="skill-card" @tap="showSkills">
        <text class="skill-icon">💡</text>
        <view class="skill-info">
          <text class="skill-title">听力技巧</text>
          <text class="skill-desc">点击查看听力技巧</text>
        </view>
        <text class="skill-arrow">›</text>
      </view>
    </view>

    <view class="start-section">
      <button class="start-btn" @tap="startPractice" :disabled="availableCount === 0">
        {{ availableCount === 0 ? '暂无题目' : '开始练习' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { listeningService } from '@/services/listening'

const types = [
  { value: 'listening_short_dialogue', label: '短对话', icon: '💬' },
  { value: 'listening_long_dialogue', label: '长对话', icon: '🗣️' },
  { value: 'listening_monologue', label: '独白', icon: '🎤' },
  { value: 'listening_dictation', label: '听力填空', icon: '✍️' }
]

const typeLabels: Record<string, string> = {
  'listening_short_dialogue': '短对话',
  'listening_long_dialogue': '长对话',
  'listening_monologue': '独白',
  'listening_dictation': '听力填空'
}

const selectedType = ref('')
const selectedTopic = ref('')
const allTopics = ref<string[]>([])
const allQuestions = ref<any[]>([])

const availableTopics = computed(() => {
  if (!selectedType.value) {
    return allTopics.value
  }
  // Get topics that have questions with the selected type
  const topics = new Set<string>()
  allQuestions.value
    .filter(q => q.type === selectedType.value)
    .forEach(q => {
      if (q.topic) topics.add(q.topic)
    })
  return Array.from(topics).sort()
})

const availableCount = computed(() => {
  let filtered = allQuestions.value
  
  if (selectedType.value) {
    filtered = filtered.filter(q => q.type === selectedType.value)
  }
  
  if (selectedTopic.value) {
    filtered = filtered.filter(q => q.topic === selectedTopic.value)
  }
  
  return filtered.length
})

onMounted(async () => {
  await listeningService.loadQuestions()
  allTopics.value = listeningService.getTopics()
  // Get all questions from service
  allQuestions.value = listeningService.getQuestions()
})

function selectType(type: string) {
  selectedType.value = type
  // Reset topic when type changes
  selectedTopic.value = ''
}

function selectTopic(topic: string) {
  selectedTopic.value = topic
}

function showSkills() {
  uni.showModal({
    title: '听力技巧',
    content: '1. 提前看题，预测内容\n2. 捕捉关键词，注意转折\n3. 记录数字和时间\n4. 理解主旨大意\n5. 注意语气和态度',
    showCancel: false
  })
}

function startPractice() {
  const limit = availableCount.value > 0 ? availableCount.value : 10
  uni.navigateTo({
    url: `/pages/listening/practice?type=${selectedType.value}&topic=${selectedTopic.value}&limit=${limit}`
  })
}
</script>

<style scoped>
.listening-type-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

.header {
  background: linear-gradient(135deg, #45B7D1 0%, #2C3E50 100%);
  border-radius: 16px;
  padding: 30px 20px;
  color: #fff;
  margin-bottom: 20px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  display: block;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 12px;
  border: 2px solid transparent;
}

.type-item.active {
  background: #e3f2fd;
  border-color: #45B7D1;
}

.type-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.type-name {
  font-size: 14px;
  color: #333;
}

.topic-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.topic-item {
  padding: 8px 16px;
  background: #f5f5f5;
  border-radius: 16px;
  font-size: 13px;
  color: #666;
}

.topic-item.active {
  background: #45B7D1;
  color: #fff;
}

.question-count-section {
  background: linear-gradient(135deg, #45B7D1 0%, #2C3E50 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
  text-align: center;
}

.count-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.count-label {
  font-size: 14px;
  color: rgba(255,255,255,0.8);
  margin-right: 8px;
}

.count-value {
  font-size: 48px;
  font-weight: bold;
  color: #fff;
}

.count-unit {
  font-size: 16px;
  color: rgba(255,255,255,0.8);
  margin-left: 4px;
}

.skill-card {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #fff8e1;
  border-radius: 8px;
}

.skill-icon {
  font-size: 24px;
  margin-right: 12px;
}

.skill-info {
  flex: 1;
}

.skill-title {
  font-size: 14px;
  font-weight: bold;
  color: #f57c00;
  display: block;
}

.skill-desc {
  font-size: 12px;
  color: #ff9800;
}

.skill-arrow {
  font-size: 20px;
  color: #ff9800;
}

.start-section {
  margin-top: 20px;
}

.start-btn {
  width: 100%;
  background: linear-gradient(135deg, #45B7D1 0%, #2C3E50 100%);
  color: #fff;
  padding: 16px;
  border-radius: 30px;
  font-size: 18px;
  border: none;
}

.start-btn[disabled] {
  background: #ccc;
}
</style>
