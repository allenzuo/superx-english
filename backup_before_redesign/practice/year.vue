<template>
  <view class="year-page">
    <view class="header">
      <text class="title">你想练习哪一年的真题？</text>
      <text class="subtitle">选择年份开始真题练习</text>
    </view>

    <view class="hot-badge">
      <text class="hot-icon">🔥</text>
      <text class="hot-text">标记为热门年份</text>
    </view>

    <view class="year-grid" v-if="!isLoading">
      <view 
        v-for="year in years" 
        :key="year"
        class="year-card"
        :class="{ hot: isHotYear(year) }"
        @tap="startPracticeByYear(year)"
      >
        <text class="year-num">{{ year }}</text>
        <text class="year-label">年</text>
        <text class="year-count">{{ getYearCount(year) }}题</text>
        <view class="hot-tag" v-if="isHotYear(year)">热门</view>
      </view>
    </view>

    <view class="loading" v-else>
      <text>加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { questionService } from '@/services/question'

interface YearItem {
  year: number
  count: number
  isHot: boolean
}

const years = ref<YearItem[]>([])
const isLoading = ref(true)
const yearQuestionCounts = ref<Record<number, number>>({})

onMounted(async () => {
  await questionService.loadAll()
  loadYears()
})

function loadYears() {
  const allYears = questionService.getYears()
  
  // 统计每年的题目数量
  const questions = questionService.getQuestions()
  const counts: Record<number, number> = {}
  questions.forEach(q => {
    counts[q.year] = (counts[q.year] || 0) + 1
  })
  yearQuestionCounts.value = counts

  // 构建年份列表
  years.value = allYears.map(year => ({
    year,
    count: counts[year] || 0,
    isHot: year >= 2022
  }))

  isLoading.value = false
}

function isHotYear(year: number): boolean {
  return year >= 2022
}

function getYearCount(year: number): number {
  return yearQuestionCounts.value[year] || 0
}

function startPracticeByYear(year: number) {
  uni.navigateTo({
    url: `/pages/exam/practice?type=year&year=${year}`
  })
}
</script>

<style scoped>
.year-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

.header {
  margin-bottom: 16px;
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

.hot-badge {
  display: inline-flex;
  align-items: center;
  background: rgba(255, 152, 0, 0.1);
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.hot-icon {
  font-size: 16px;
  margin-right: 4px;
}

.hot-text {
  font-size: 12px;
  color: #ff9800;
  font-weight: 500;
}

.year-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.year-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  position: relative;
}

.year-card.hot {
  border: 2px solid #ff9800;
}

.year-num {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  display: block;
}

.year-label {
  font-size: 14px;
  color: #999;
}

.year-count {
  font-size: 12px;
  color: #667eea;
  display: block;
  margin-top: 4px;
}

.hot-tag {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #ff9800;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
