<template>
  <view class="daily-page">
    <view class="date-header">
      <text class="date">{{ currentDate }}</text>
      <text class="streak">连续学习 {{ store.profile.streakDays }} 天</text>
    </view>

    <view class="task-list">
      <view 
        v-for="task in dailyTasks" 
        :key="task.id"
        :class="['task-item', { completed: task.completed }]"
        @tap="toggleTask(task)"
      >
        <view class="checkbox">
          <text v-if="task.completed">✓</text>
        </view>
        <view class="task-content">
          <text class="task-name">{{ task.name }}</text>
          <text class="task-desc">{{ task.desc }}</text>
        </view>
      </view>
    </view>

    <view class="progress-section">
      <view class="progress-text">
        今日进度：{{ completedCount }}/{{ dailyTasks.length }}
      </view>
      <view class="progress-bar">
        <view class="progress" :style="{ width: progressPercent + '%' }"></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { store } from '@/store'

interface Task {
  id: number
  name: string
  desc: string
  completed: boolean
}

const currentDate = ref('')
const dailyTasks = ref<Task[]>([
  { id: 1, name: '背单词', desc: '复习20个单词', completed: false },
  { id: 2, name: '听力练习', desc: '完成1套听力', completed: false },
  { id: 3, name: '阅读理解', desc: '练习2篇阅读', completed: false },
  { id: 4, name: '错题复习', desc: '复习5道错题', completed: false },
  { id: 5, name: '写作练习', desc: '完成1篇作文', completed: false }
])

const completedCount = computed(() => dailyTasks.value.filter(t => t.completed).length)
const progressPercent = computed(() => Math.round((completedCount.value / dailyTasks.value.length) * 100))

onMounted(() => {
  initDate()
  loadTasks()
})

function initDate() {
  const now = new Date()
  const months = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']
  const days = ['日', '一', '二', '三', '四', '五', '六']
  currentDate.value = `${months[now.getMonth()]}月${now.getDate()}日 周${days[now.getDay()]}`
}

function loadTasks() {
  const saved = uni.getStorageSync('daily_tasks')
  if (saved) {
    dailyTasks.value = saved
  }
}

function toggleTask(task: Task) {
  task.completed = !task.completed
  uni.setStorageSync('daily_tasks', dailyTasks.value)
  
  if (task.completed) {
    uni.showToast({ title: '任务完成！', icon: 'success' })
  }
}
</script>

<style scoped>
.daily-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 16px;
}

.date-header {
  text-align: center;
  margin-bottom: 24px;
}

.date {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

.streak {
  font-size: 14px;
  color: #667eea;
}

.task-list {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
}

.task-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.task-item:last-child {
  border-bottom: none;
}

.task-item.completed {
  background: #f0f9ff;
}

.checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid #ddd;
  border-radius: 50%;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #fff;
}

.task-item.completed .checkbox {
  background: #667eea;
  border-color: #667eea;
}

.task-content {
  flex: 1;
}

.task-name {
  font-size: 16px;
  color: #333;
  display: block;
  margin-bottom: 4px;
}

.task-item.completed .task-name {
  text-decoration: line-through;
  color: #999;
}

.task-desc {
  font-size: 12px;
  color: #999;
}

.progress-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}

.progress-text {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  text-align: center;
}

.progress-bar {
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s;
}
</style>
