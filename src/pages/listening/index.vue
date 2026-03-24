<template>
  <view class="listening-page">
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

    <scroll-view class="listening-list" scroll-y>
      <view 
        v-for="item in listeningItems" 
        :key="item.id"
        class="listening-card"
        @tap="startListening(item)"
      >
        <view class="card-header">
          <text class="tag">{{ item.type }}</text>
          <text class="year">{{ item.year }}</text>
        </view>
        <view class="card-title">{{ item.title }}</view>
        <view class="card-info">
          <text>共{{ item.questionCount }}题</text>
          <text class="duration">约{{ item.duration }}分钟</text>
        </view>
        <view class="play-btn">
          <text class="icon">▶</text>
          <text>开始练习</text>
        </view>
      </view>
    </scroll-view>

    <view class="player-bar" v-if="currentQuestion" :class="{ playing: isPlaying }">
      <view class="player-info">
        <text class="question-num">第{{ currentIndex + 1 }}题</text>
        <text class="question-text">{{ currentQuestion.question }}</text>
      </view>
      <view class="player-controls">
        <view class="control-btn" @tap="togglePlay">
          <text>{{ isPlaying ? '⏸' : '▶' }}</text>
        </view>
        <view class="control-btn" @tap="stopListening">
          <text>⏹</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { listeningService } from '@/services/listening'

interface ListeningItem {
  id: number
  title: string
  type: string
  year: string
  questionCount: number
  duration: number
  audioUrl?: string
  questions?: any[]
}

const currentTab = ref('short')
const listeningItems = ref<ListeningItem[]>([])
const currentQuestion = ref<any>(null)
const currentIndex = ref(0)
const isPlaying = ref(false)

let audioContext: any = null

const tabs = [
  { label: '短对话', value: 'short' },
  { label: '长对话', value: 'long' },
  { label: '短文理解', value: 'passage' },
  { label: '听短文填空', value: 'cloze' }
]

onMounted(async () => {
  await listeningService.loadQuestions()
  loadListeningItems()
})

function loadListeningItems() {
  const questions = listeningService.getQuestions()
  
  // Group questions by year and type
  const yearTypeMap = new Map<string, any[]>()
  
  questions.forEach((q: any) => {
    const key = `${q.year}_${q.type}`
    if (!yearTypeMap.has(key)) {
      yearTypeMap.set(key, [])
    }
    yearTypeMap.get(key)!.push(q)
  })
  
  // Convert to listening items
  const items: ListeningItem[] = []
  let id = 1
  
  const typeLabels: Record<string, string> = {
    'short': '短对话',
    'long': '长对话',
    'passage': '短文理解',
    'cloze': '听短文填空'
  }
  
  yearTypeMap.forEach((qs, key) => {
    const [year, type] = key.split('_')
    items.push({
      id: id++,
      title: `${year}年上海市中考英语听力`,
      type: typeLabels[type] || type,
      year: year,
      questionCount: qs.length,
      duration: Math.ceil(qs.length * 0.6),
      questions: qs
    })
  })
  
  // Sort by year descending
  items.sort((a, b) => parseInt(b.year) - parseInt(a.year))
  
  listeningItems.value = items
}

function switchTab(tab: string) {
  currentTab.value = tab
}

function startListening(item: ListeningItem) {
  const questions = item.questions || []
  
  if (questions.length === 0) {
    uni.showToast({ title: '暂无题目数据', icon: 'none' })
    return
  }
  
  currentQuestion.value = questions[0]
  currentIndex.value = 0
  isPlaying.value = true
  
  playAudio()
}

function getQuestions(type: string): any[] {
  // Use current item's questions filtered by type
  const allQuestions = listeningService.getQuestions()
  return allQuestions.filter((q: any) => q.type === type)
}

function playAudio() {
  // #ifdef MP-WEIXIN
  audioContext = uni.createInnerAudioContext()
  
  // In a real app, we'd have audio files. For now, show the question text
  audioContext.autoplay = true
  
  audioContext.onPlay(() => {
    isPlaying.value = true
  })
  
  audioContext.onEnded(() => {
    isPlaying.value = false
    // Move to next question
    const currentItem = listeningItems.value.find(item => 
      item.questions && item.questions.some((q: any) => q.question === currentQuestion.value?.question)
    )
    if (currentItem && currentItem.questions) {
      if (currentIndex.value < currentItem.questions.length - 1) {
        setTimeout(() => {
          currentIndex.value++
          currentQuestion.value = currentItem.questions[currentIndex.value]
          playAudio()
        }, 2000)
      } else {
        uni.showToast({ title: '听力练习完成！', icon: 'success' })
      }
    }
  })
  
  audioContext.onError((err: any) => {
    console.error('Audio error:', err)
    isPlaying.value = false
    // Continue with questions even without audio
    if (currentIndex.value < 4) {
      setTimeout(() => {
        currentIndex.value++
        const currentItem = listeningItems.value.find(item => 
          item.questions && item.questions.some((q: any) => q.question === currentQuestion.value?.question)
        )
        if (currentItem && currentItem.questions && currentIndex.value < currentItem.questions.length) {
          currentQuestion.value = currentItem.questions[currentIndex.value]
        }
      }, 2000)
    }
  })
  
  // Note: Audio files would be loaded here in production
  // audioContext.src = 'https://example.com/audio.mp3'
  // #endif
  
  // Show question text even without audio
  uni.showToast({ title: '播放听力材料...', icon: 'none' })
}

function togglePlay() {
  if (isPlaying.value) {
    audioContext?.pause()
    isPlaying.value = false
  } else {
    audioContext?.play()
    isPlaying.value = true
  }
}

function stopListening() {
  audioContext?.stop()
  audioContext?.destroy()
  audioContext = null
  currentQuestion.value = null
  isPlaying.value = false
}
</script>

<style scoped>
.listening-page {
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

.listening-list {
  padding: 12px;
  height: calc(100vh - 180px);
}

.listening-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.card-header {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.tag {
  font-size: 12px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.year {
  font-size: 12px;
  color: #999;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.card-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
}

.play-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: #667eea;
  color: #fff;
  border-radius: 8px;
}

.player-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 16px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.player-bar.playing {
  background: #667eea;
  color: #fff;
}

.player-info {
  margin-bottom: 12px;
}

.question-num {
  font-size: 12px;
  opacity: 0.8;
  display: block;
  margin-bottom: 4px;
}

.question-text {
  font-size: 16px;
}

.player-controls {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.control-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
</style>
