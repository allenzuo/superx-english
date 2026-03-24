<template>
  <view class="home">
    <scroll-view class="scroll-view" scroll-y>
      <view class="content-wrapper">
      <view class="header-card">
        <view class="user-row">
          <view class="avatar" :style="{ background: levelColor }">
            {{ profile.name?.substring(0, 1) || '学' }}
          </view>
          <view class="user-info">
            <text class="username">{{ profile.name || '学生' }} Lv.{{ profile.level }}</text>
          </view>
          <view class="exp-info">
            <text class="exp-text">{{ profile.exp }}/{{ nextLevelExp }} XP</text>
          </view>
        </view>
        <view class="progress-row">
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: levelProgress * 100 + '%', background: levelColor }"></view>
          </view>
          <text class="progress-text">距下一级还需 {{ expToNextLevel }} 经验</text>
        </view>
      </view>

      <view class="section">
        <view class="section-header">
          <text class="section-title">今日任务</text>
          <text class="section-progress">{{ taskStats.completed }}/{{ taskStats.total }}</text>
        </view>
        <view class="task-grid">
          <view class="task-card" :class="{ completed: dailyTasks[0]?.completed }" @tap="goToPractice('single', dailyTasks[0]?.target || 5)">
            <text class="task-icon">✓</text>
            <text class="task-name">单选题</text>
            <text class="task-progress">{{ dailyTasks[0]?.progress || 0 }}/{{ dailyTasks[0]?.target || 5 }}</text>
          </view>
          <view class="task-card" :class="{ completed: dailyTasks[1]?.completed }" @tap="goToPractice('reading', dailyTasks[1]?.target || 2)">
            <text class="task-icon">📖</text>
            <text class="task-name">阅读理解</text>
            <text class="task-progress">{{ dailyTasks[1]?.progress || 0 }}/{{ dailyTasks[1]?.target || 2 }}</text>
          </view>
          <view class="task-card" :class="{ completed: dailyTasks[2]?.completed }" @tap="goToPractice('cloze', dailyTasks[2]?.target || 3)">
            <text class="task-icon">✏️</text>
            <text class="task-name">完形填空</text>
            <text class="task-progress">{{ dailyTasks[2]?.progress || 0 }}/{{ dailyTasks[2]?.target || 3 }}</text>
          </view>
          <view class="task-card" :class="{ completed: dailyTasks[3]?.completed }" @tap="goTo('/pages/daily/words')">
            <text class="task-icon">💯</text>
            <text class="task-name">每日单词</text>
            <text class="task-progress">{{ dailyTasks[3]?.progress || 0 }}/{{ dailyTasks[3]?.target || 30 }}</text>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section-header">
          <text class="section-title">我爱背单词</text>
          <text class="section-subtitle">小小单词，轻松拿捏</text>
        </view>
        <view class="word-entrance">
          <view class="word-btn" @tap="goTo('/pages/hundred/index')">
            <text class="word-icon" style="color: #ff6b6b;">📅</text>
            <text class="word-label">单词百日斩</text>
          </view>
          <view class="word-btn" @tap="goTo('/pages/words/grade')">
            <text class="word-icon" style="color: #a18cd1;">📚</text>
            <text class="word-label">选择年级</text>
          </view>
          <view class="word-btn" @tap="goTo('/pages/scan/word')">
            <text class="word-icon" style="color: #3a86ff;">📷</text>
            <text class="word-label">AI识单词</text>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section-header">
          <text class="section-title">🏆 决胜中考</text>
        </view>
        <view class="zhongkao-grid">
          <view 
            v-for="item in zhongkaoModules" 
            :key="item.id"
            class="zhongkao-card"
            @tap="goToGrammar(item.id)"
          >
            <text class="zhongkao-icon" :style="{ color: item.color }">{{ item.icon }}</text>
            <text class="zhongkao-name">{{ item.name }}</text>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="practice-header">
          <view class="practice-badge">
            <text class="practice-badge-text">做题小能手</text>
          </view>
        </view>
        <view class="practice-grid">
          <view class="practice-btn" @tap="goTo('/pages/practice/type')">
            <text class="practice-icon">📋</text>
            <text class="practice-label">按题型</text>
          </view>
          <view class="practice-btn" @tap="goTo('/pages/practice/year')">
            <text class="practice-icon">📅</text>
            <text class="practice-label">按年份</text>
          </view>
          <view class="practice-btn" @tap="goTo('/pages/reading/practice?type=writing')">
            <text class="practice-icon">✍️</text>
            <text class="practice-label">作文专区</text>
          </view>
          <view class="practice-btn" @tap="goTo('/pages/scan/question')">
            <text class="practice-icon" style="color: #ff9a44;">📷</text>
            <text class="practice-label">AI识题</text>
          </view>
        </view>
      </view>

      <view class="section" v-if="weakPoints.length > 0">
        <view class="section-header">
          <text class="section-title">薄弱点强化</text>
        </view>
        <view class="weak-point-card" @tap="goToWeakPoint">
          <view class="weak-point-info">
            <text class="weak-point-tag">{{ weakPoints[0].tag }}</text>
            <text class="weak-point-stats">错误{{ weakPoints[0].error_count }}次 • 正确率{{ Math.round(weakPoints[0].correct_rate * 100) }}%</text>
          </view>
          <view class="weak-point-btn">去练习</view>
        </view>
        <view class="weak-point-list" v-if="weakPoints.length > 1">
          <view 
            class="weak-point-item" 
            v-for="wp in weakPoints.slice(1, 3)" 
            :key="wp.id"
            @tap="goToWeakPointTag(wp.tag)"
          >
            <text class="item-tag">{{ wp.tag }}</text>
            <text class="item-stats">错误{{ wp.error_count }}次 • {{ Math.round(wp.correct_rate * 100) }}%</text>
          </view>
        </view>
      </view>

      <view class="section" v-else>
        <view class="section-header">
          <text class="section-title">薄弱点强化</text>
        </view>
        <view class="no-weak-point">
          <text class="no-weak-icon">✅</text>
          <text class="no-weak-text">暂无薄弱点</text>
          <text class="no-weak-hint">继续加油，多做题来发现薄弱点</text>
        </view>
      </view>

      <view class="bottom-space"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { userService, dailyTaskService, weakPointService, wrongQuestionService } from '@/services/user'
import type { DailyTask, WeakPoint, UserProfile } from '@/services/types'

const profile = ref<UserProfile>({
  id: 1,
  name: '学生',
  avatar: '',
  level: 1,
  exp: 0,
  grade: '七年级',
  school: '',
  target_school: '',
  study_goal: '',
  total_study_time: 0,
  total_questions: 0,
  correct_rate: 0,
  streak_days: 0,
  last_study_date: '',
  created_at: '',
  tags: [],
  word_tags: {}
})

const dailyTasks = ref<DailyTask[]>([])
const weakPoints = ref<WeakPoint[]>([])

const levelColors = ['#ff6b6b', '#ff9a44', '#ffbe0b', '#06d6a0', '#3a86ff', '#a18cd1', '#f72585']

const levelColor = computed(() => levelColors[Math.min(profile.value.level - 1, 6)])

const levelProgress = computed(() => {
  const currentLevelExp = Math.pow(profile.value.level - 1, 2) * 100
  const nextLevelExp = Math.pow(profile.value.level, 2) * 100
  const progress = (profile.value.exp - currentLevelExp) / (nextLevelExp - currentLevelExp)
  return Math.min(1, Math.max(0, progress))
})

const expToNextLevel = computed(() => {
  const nextLevelExp = Math.pow(profile.value.level, 2) * 100
  return nextLevelExp - profile.value.exp
})

const taskStats = computed(() => {
  const completed = dailyTasks.value.filter(t => t.completed).length
  return { completed, total: dailyTasks.value.length }
})

const zhongkaoModules = [
  { id: 'grammar', name: '满分语法', icon: '📖', color: '#ff6b6b' },
  { id: 'listening', name: '赢在听力', icon: '🎧', color: '#ff9a44' },
  { id: 'phrases', name: '玩转短语', icon: '💬', color: '#ffbe0b' },
  { id: 'sentences', name: '长难句', icon: '📝', color: '#a18cd1' },
  { id: 'cloze', name: '完型填空', icon: '✍️', color: '#45b7d1' },
  { id: 'reading', name: '阅读理解', icon: '📄', color: '#3a86ff' },
  { id: 'writing', name: '高分作文', icon: '🏆', color: '#06d6a0' },
  { id: 'dialogue', name: '情景对话', icon: '🗣️', color: '#ff8c00' }
]

onMounted(() => {
  loadData()
})

function loadData() {
  profile.value = userService.getProfile()
  dailyTasks.value = dailyTaskService.getTodayTasks()
  weakPoints.value = weakPointService.getTopWeakPoints(3)
}

function goTo(path: string) {
  uni.navigateTo({ url: path })
}

function goToPractice(type: string, limit: number) {
  uni.navigateTo({ url: `/pages/exam/practice?type=${type}&limit=${limit}` })
}

function goToListening() {
  uni.navigateTo({ url: '/pages/listening/type' })
}

function goToGrammar(moduleId: string) {
  // Special handling for listening
  if (moduleId === 'listening') {
    uni.navigateTo({ url: '/pages/listening/type' })
    return
  }
  
  // Show all grammar categories for 满分语法
  if (moduleId === 'grammar') {
    uni.navigateTo({ url: '/pages/grammar/index' })
    return
  }
  
  const moduleMap: { [key: string]: string } = {
    'listening': 'grammar_lessons_tingli.json',
    'phrases': 'grammar_lessons_duanyu.json',
    'sentences': 'grammar_lessons_changnanju.json',
    'cloze': 'grammar_lessons_wanxingtiankong.json',
    'reading': 'grammar_lessons_yuedulijie.json',
    'writing': 'grammar_lessons_zuowen.json',
    'dialogue': 'grammar_lessons_qingjingduihua.json'
  }
  const file = moduleMap[moduleId]
  uni.navigateTo({ url: `/pages/grammar/index?module=${moduleId}&file=${file}` })
}

function goToWeakPoint() {
  if (weakPoints.value.length > 0) {
    uni.navigateTo({ 
      url: `/pages/exam/practice?weakPoint=${weakPoints.value[0].tag}` 
    })
  }
}

function goToWeakPointTag(tag: string) {
  uni.navigateTo({ 
    url: `/pages/exam/practice?weakPoint=${tag}` 
  })
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: #f5f5f5;
}

.scroll-view {
  height: 100vh;
}

.content-wrapper {
  padding: 16px 20px 16px 16px;
  overflow: hidden;
  box-sizing: border-box;
}

.section {
  margin-bottom: 16px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #eee;
}

.header-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid #eee;
}

.user-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  margin-right: 12px;
  min-width: 44px;
  min-height: 44px;
}

.user-info {
  flex: 1;
  display: flex;
  align-items: center;
}

.username {
  font-size: 18px;
  font-weight: bold;
  color: #000;
  display: block;
}

.exp-info {
  text-align: right;
}

.exp-text {
  font-size: 14px;
  color: #666;
}

.progress-row {
  margin-top: 12px;
}

.progress-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 12px;
  color: #999;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #000;
}

.section-subtitle {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}

.section-progress {
  font-size: 14px;
  color: #666;
}

.section-more {
  font-size: 14px;
  color: #999;
}



.word-entrance {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.word-btn {
  height: 80px;
  background: #fff;
  border-radius: 12px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #eee;
}

.word-btn:active {
  background: #f5f5f5;
}

.word-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 4px;
}

.word-label {
  font-size: 12px;
  font-weight: bold;
  color: #000;
  display: block;
}

.practice-header {
  margin-bottom: 12px;
}

.practice-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ffe66d 100%);
}

.practice-badge-text {
  color: #fff;
  font-weight: bold;
  font-size: 14px;
}

.practice-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.practice-btn {
  height: 80px;
  background: #fff;
  border-radius: 12px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #eee;
}

.practice-btn:active {
  background: #f5f5f5;
}

.practice-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 4px;
}

.practice-label {
  font-size: 12px;
  font-weight: bold;
  color: #000;
  display: block;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.task-card {
  height: 80px;
  background: #fff;
  border-radius: 12px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #eee;
}

.task-card:active {
  background: #f5f5f5;
}

.task-card.completed {
  background: #e8f5e9;
}

.task-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 4px;
}

.task-name {
  font-size: 12px;
  font-weight: bold;
  color: #000;
  display: block;
  margin-bottom: 2px;
}

.task-progress {
  font-size: 11px;
  color: #666;
}

.zhongkao-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.zhongkao-card {
  height: 80px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid #eee;
}

.zhongkao-card:active {
  background: #f5f5f5;
}

.zhongkao-icon {
  font-size: 28px;
  margin-bottom: 4px;
}

.zhongkao-name {
  font-size: 12px;
  font-weight: bold;
  color: #000;
}

.weak-point-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #eee;
}

.weak-point-card .weak-point-tag {
  color: #000;
}

.weak-point-card .weak-point-stats {
  color: #666;
}

.weak-point-card:active {
  background: #f5f5f5;
}

.weak-point-info {
  flex: 1;
}

.weak-point-tag {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 4px;
}

.weak-point-stats {
  font-size: 13px;
  color: #666;
}

.weak-point-btn {
  background: #1890ff;
  color: #fff;
  padding: 8px 16px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: bold;
}

.weak-point-list {
  margin-top: 8px;
}

.weak-point-item {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  border: 1px solid #eee;
}

.weak-point-item:active {
  background: #f5f5f5;
}

.item-tag {
  font-size: 14px;
  color: #000;
  font-weight: bold;
}

.item-stats {
  font-size: 13px;
  color: #666;
}

.no-weak-point {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  border: 1px solid #eee;
}

.no-weak-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}

.no-weak-text {
  font-size: 16px;
  font-weight: bold;
  color: #4caf50;
  display: block;
  margin-bottom: 4px;
}

.no-weak-hint {
  font-size: 13px;
  color: #81c784;
}

.ai-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.ai-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px 8px;
  text-align: center;
  border: 1px solid #eee;
}

.ai-card:active {
  background: #f5f5f5;
}

.ai-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 8px;
}

.ai-name {
  font-size: 13px;
  color: #000;
  font-weight: bold;
}

.bottom-space {
  height: 100px;
}
</style>
