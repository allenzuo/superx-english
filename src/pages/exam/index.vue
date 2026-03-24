<template>
  <view class="exam-page">
    <view class="tabs">
      <view 
        v-for="tab in tabs" 
        :key="tab.value"
        :class="['tab', { active: currentTab === tab.value }]"
        @tap="switchTab(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>

    <scroll-view class="exam-list" scroll-y>
      <view 
        v-for="exam in exams" 
        :key="exam.year"
        class="exam-card"
        @tap="startExam(exam)"
      >
        <view class="exam-header">
          <text class="year">{{ exam.year }}年</text>
          <text class="city">{{ exam.city }}</text>
        </view>
        <view class="exam-info">
          <view class="info-item">
            <text class="label">选择题</text>
            <text class="value">{{ exam.choiceCount }}题</text>
          </view>
          <view class="info-item">
            <text class="label">听力</text>
            <text class="value">{{ exam.listeningCount }}题</text>
          </view>
          <view class="info-item">
            <text class="label">写作</text>
            <text class="value">{{ exam.writingCount }}题</text>
          </view>
        </view>
        <view class="exam-actions">
          <button size="mini" @tap.stop="doChoice(exam)">选择题</button>
          <button size="mini" @tap.stop="doListening(exam)">听力</button>
          <button size="mini" @tap.stop="doWriting(exam)">写作</button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const currentTab = ref('all')

const tabs = [
  { label: '全部', value: 'all' },
  { label: '上海', value: 'shanghai' },
  { label: '北京', value: 'beijing' },
  { label: '广州', value: 'guangzhou' }
]

const exams = ref([
  { year: '2024', city: '上海', choiceCount: 85, listeningCount: 20, writingCount: 1 },
  { year: '2023', city: '上海', choiceCount: 85, listeningCount: 20, writingCount: 1 },
  { year: '2022', city: '上海', choiceCount: 85, listeningCount: 20, writingCount: 1 },
  { year: '2021', city: '上海', choiceCount: 85, listeningCount: 20, writingCount: 1 },
  { year: '2020', city: '上海', choiceCount: 85, listeningCount: 20, writingCount: 1 }
])

function switchTab(tab: string) {
  currentTab.value = tab
}

function startExam(exam: any) {
  uni.showActionSheet({
    itemList: ['选择题', '听力', '写作'],
    success: (res) => {
      if (res.tapIndex === 0) doChoice(exam)
      else if (res.tapIndex === 1) doListening(exam)
      else doWriting(exam)
    }
  })
}

function doChoice(exam: any) {
  uni.setStorageSync('practice_type', 'year')
  uni.setStorageSync('practice_year', parseInt(exam.year))
  uni.navigateTo({
    url: '/pages/exam/practice'
  })
}

function doListening(exam: any) {
  uni.switchTab({
    url: '/pages/listening/index'
  })
}

function doWriting(exam: any) {
  uni.navigateTo({
    url: '/pages/writing/index'
  })
}
</script>

<style scoped>
.exam-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.tabs {
  display: flex;
  background: #fff;
  padding: 12px 16px;
  gap: 8px;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 10px;
  font-size: 14px;
  color: #666;
  border-radius: 8px;
}

.tab.active {
  background: #667eea;
  color: #fff;
}

.exam-list {
  padding: 12px;
  height: calc(100vh - 60px);
}

.exam-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.year {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.city {
  font-size: 14px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
}

.exam-info {
  display: flex;
  justify-content: space-around;
  margin-bottom: 12px;
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item {
  text-align: center;
}

.info-item .label {
  font-size: 12px;
  color: #999;
  display: block;
}

.info-item .value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.exam-actions {
  display: flex;
  gap: 8px;
}

.exam-actions button {
  flex: 1;
  background: #667eea;
  color: #fff;
}
</style>
