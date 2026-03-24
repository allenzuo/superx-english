<template>
  <view class="practice-page">
    <view class="section">
      <view class="section-title">做题小能手</view>
      <view class="practice-types">
        <view class="type-card" @tap="startPractice('random')">
          <text class="type-icon">🎲</text>
          <text class="type-name">随机练习</text>
          <text class="type-count">{{ stats.total }}题已做</text>
        </view>
        <view class="type-card" @tap="goToTypeSelection">
          <text class="type-icon">📋</text>
          <text class="type-name">按题型</text>
          <text class="type-count">专项练习</text>
        </view>
        <view class="type-card" @tap="goToYearSelection">
          <text class="type-icon">📅</text>
          <text class="type-name">按年份</text>
          <text class="type-count">历年真题</text>
        </view>
        <view class="type-card" @tap="goToWriting">
          <text class="type-icon">✍️</text>
          <text class="type-name">作文专区</text>
          <text class="type-count">高分突破</text>
        </view>
      </view>
    </view>

    <view class="section" v-if="recentYears.length > 0">
      <view class="section-title">历年真题</view>
      <view class="years">
        <view 
          v-for="year in recentYears" 
          :key="year"
          class="year-item"
          @tap="startPracticeByYear(year)"
        >
          <text class="year-label">{{ year }}年</text>
          <text class="year-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">薄弱专项</view>
      <view class="weak-points">
        <view 
          v-for="point in weakPoints" 
          :key="point.name"
          class="weak-item"
          @tap="practiceWeakPoint(point.name)"
        >
          <view class="weak-info">
            <text class="weak-name">{{ point.name }}</text>
            <text class="weak-count">{{ point.count }}题</text>
          </view>
          <text class="weak-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">我的记录</view>
      <view class="stats-card">
        <view class="stat-item">
          <text class="stat-value">{{ stats.total }}</text>
          <text class="stat-label">累计做题</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ stats.correct }}</text>
          <text class="stat-label">正确数</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ stats.accuracy }}%</text>
          <text class="stat-label">正确率</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { questionService } from '@/services/question'
import { wrongQuestionService } from '@/services/wrongQuestion'

const questionTypes = ref<{id: string, name: string, icon: string, count: number}[]>([])

const recentYears = ref<string[]>([])

const weakPoints = ref<{name: string, count: number}[]>([])

const stats = ref({
  total: 0,
  correct: 0,
  accuracy: 0
})

onMounted(async () => {
  await loadQuestionTypes()
  loadRecentYears()
  loadWeakPoints()
  loadStats()
})

async function loadQuestionTypes() {
  await questionService.loadAll()
  
  const typeCounts = questionService.getQuestionCountsByType()
  const years = questionService.getYears()
  
  recentYears.value = years.slice(0, 5).map(y => String(y))
  
  questionTypes.value = typeCounts.map(t => ({
    id: t.id,
    name: t.name,
    icon: getTypeIcon(t.id),
    count: t.count
  }))
}

function getTypeIcon(typeId: string): string {
  const icons: Record<string, string> = {
    'single': '✓',
    'reading': '📖',
    '完形填空': '✍️',
    'dialogue': '💬'
  }
  return icons[typeId] || '📝'
}

function loadRecentYears() {
  const years = questionService.getYears()
  recentYears.value = years.slice(0, 5).map(y => String(y))
}

function loadWeakPoints() {
  wrongQuestionService.loadQuestions()
  const wrongQuestions = wrongQuestionService.getQuestions()
  
  const tagCounts: Record<string, number> = {}
  wrongQuestions.forEach(q => {
    if (q.tags) {
      q.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    }
  })
  
  weakPoints.value = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))
}

function loadStats() {
  const saved = uni.getStorageSync('practice_stats')
  if (saved) {
    stats.value = saved
    if (stats.value.total > 0) {
      stats.value.accuracy = Math.round((stats.value.correct / stats.value.total) * 100)
    }
  }
}

function startPractice(type: string) {
  uni.navigateTo({
    url: `/pages/exam/practice?type=${type}&limit=10`
  })
}

function startPracticeByType(typeId: string) {
  uni.navigateTo({
    url: `/pages/exam/practice?type=${typeId}&limit=10`
  })
}

function startPracticeByYear(year: number) {
  uni.navigateTo({
    url: `/pages/exam/practice?type=year&year=${year}&limit=10`
  })
}

function practiceWeakPoint(name: string) {
  uni.navigateTo({
    url: `/pages/exam/practice?type=weakPoint&weakPoint=${encodeURIComponent(name)}&limit=10`
  })
}

function goToTypeSelection() {
  uni.showActionSheet({
    itemList: questionTypes.value.map(t => `${t.name} (${t.count}题)`),
    success: (res) => {
      const type = questionTypes.value[res.tapIndex]
      startPracticeByType(type.id)
    }
  })
}

function goToYearSelection() {
  uni.showActionSheet({
    itemList: recentYears.map(y => y + '年'),
    success: (res) => {
      startPracticeByYear(parseInt(recentYears[res.tapIndex]))
    }
  })
}

function goToWriting() {
  uni.navigateTo({
    url: '/pages/writing/index'
  })
}
</script>

<style scoped>
.practice-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 16px;
}

.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.practice-types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.type-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.type-icon {
  font-size: 36px;
  display: block;
  margin-bottom: 8px;
}

.type-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  display: block;
}

.type-count {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  display: block;
}

.years {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.year-item {
  background: #fff;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
}

.weak-points {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.weak-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.weak-item:last-child {
  border-bottom: none;
}

.weak-info {
  display: flex;
  flex-direction: column;
}

.weak-name {
  font-size: 14px;
  color: #333;
}

.weak-count {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.weak-arrow {
  font-size: 20px;
  color: #ccc;
}

.stats-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
  display: block;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
