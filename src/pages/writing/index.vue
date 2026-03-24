<template>
  <view class="writing-page">
    <view class="tabs">
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 0 }" 
        @tap="activeTab = 0"
      >
        写作技巧
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 1 }" 
        @tap="activeTab = 1"
      >
        真题范文
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 2 }" 
        @tap="activeTab = 2"
      >
        AI批改
      </view>
    </view>

    <!-- 写作技巧 Tab -->
    <view class="tab-content" v-if="activeTab === 0">
      <view class="tips-list">
        <view 
          v-for="(tip, index) in writingTips" 
          :key="index"
          class="tip-card"
          @tap="toggleTip(index)"
        >
          <view class="tip-header">
            <view class="tip-icon-wrapper">
              <text class="tip-icon">{{ getTipIcon(tip.icon) }}</text>
            </view>
            <text class="tip-title">{{ tip.title }}</text>
            <text class="tip-arrow" :class="{ expanded: expandedTips.includes(index) }">›</text>
          </view>
          <view class="tip-content" v-if="expandedTips.includes(index)">
            <text class="tip-text">{{ tip.content }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 真题范文 Tab -->
    <view class="tab-content" v-if="activeTab === 1">
      <view class="essays-list">
        <view 
          v-for="(essay, index) in sampleEssays" 
          :key="index"
          class="essay-card"
          @tap="showEssay(essay)"
        >
          <view class="essay-header">
            <text class="essay-title">{{ essay.scene }}</text>
            <text class="essay-arrow">›</text>
          </view>
          <view class="essay-meta">
            <text class="essay-year">{{ essay.year }}年上海中考</text>
          </view>
        </view>
      </view>
    </view>

    <!-- AI批改 Tab -->
    <view class="tab-content" v-if="activeTab === 2">
      <view class="ai-intro">
        <view class="ai-icon">✨</view>
        <text class="ai-title">AI 智能批改</text>
        <text class="ai-desc">输入你的作文，AI将为你提供：</text>
        <text class="ai-feature">• 文章结构分析</text>
        <text class="ai-feature">• 语法错误纠正</text>
        <text class="ai-feature">• 词汇使用建议</text>
        <text class="ai-feature">• 分数预测</text>
      </view>

      <view class="input-section">
        <text class="input-label">请输入你的作文：</text>
        <textarea 
          class="essay-input" 
          v-model="userEssay" 
          placeholder="在此输入你的英语作文..."
          maxlength="500"
        ></textarea>
        <text class="word-count">{{ userEssay.length }}/500</text>
      </view>

      <button 
        class="submit-btn" 
        :disabled="isCorrecting || !userEssay"
        @tap="startCorrection"
      >
        {{ isCorrecting ? '正在批改...' : '开始批改' }}
      </button>

      <view class="result-section" v-if="correctionResult">
        <text class="result-title">批改结果：</text>
        <view class="result-content">
          <text>{{ correctionResult }}</text>
        </view>
      </view>
    </view>

    <!-- 范文弹窗 -->
    <view class="modal-overlay" v-if="showModal" @tap="showModal = false">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ currentEssay?.scene }}</text>
          <text class="modal-close" @tap="showModal = false">✕</text>
        </view>
        <scroll-view class="modal-body" scroll-y>
          <view class="essay-requirement">
            <text class="req-label">题目要求：</text>
            <text class="req-text">{{ currentEssay?.requirements }}</text>
          </view>
          <view class="essay-sample" v-if="currentEssaySample">
            <text class="sample-label">优秀范文 ({{ currentEssaySample.score }}分)：</text>
            <text class="sample-content">{{ currentEssaySample.content }}</text>
            <view class="sample-analysis">
              <text class="analysis-label">分析：</text>
              <text class="analysis-text">{{ currentEssaySample.analysis }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { writingService } from '@/services/writing'
import { aiService } from '@/services/ai'

interface WritingTip {
  title: string
  content: string
  icon: string
}

interface SampleEssay {
  scene: string
  title: string
  requirements: string
  essays: {
    level: string
    score: number
    content: string
    analysis: string
  }[]
}

const activeTab = ref(0)
const expandedTips = ref<number[]>([])
const writingTips = ref<WritingTip[]>([])
const sampleEssays = ref<SampleEssay[]>([])
const userEssay = ref('')
const isCorrecting = ref(false)
const correctionResult = ref('')
const showModal = ref(false)
const currentEssay = ref<SampleEssay | null>(null)
const currentEssaySample = ref<any>(null)

onMounted(async () => {
  await writingService.loadData()
  writingTips.value = writingService.getWritingTips()
  sampleEssays.value = writingService.getSampleEssays()
})

async function startCorrection() {
  if (!userEssay.value.trim()) return
  
  isCorrecting.value = true
  correctionResult.value = ''
  
  try {
    correctionResult.value = await aiService.correctEssay(userEssay.value)
  } catch (e: any) {
    uni.showToast({ title: e.message || '批改失败', icon: 'none' })
  } finally {
    isCorrecting.value = false
  }
}

function getTipIcon(icon: string): string {
  const iconMap: Record<string, string> = {
    '📝': '📝',
    '📖': '📖',
    '💡': '💡',
    '✨': '✨',
    '🔤': '🔤'
  }
  return iconMap[icon] || '📝'
}
</script>

<style scoped>
.writing-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.tabs {
  display: flex;
  background: #fff;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;
}

.tab-item {
  flex: 1;
  text-align: center;
  font-size: 15px;
  color: #666;
  padding: 10px 0;
  position: relative;
}

.tab-item.active {
  color: #667eea;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background: #667eea;
  border-radius: 2px;
}

.tab-content {
  padding: 16px;
  min-height: calc(100vh - 60px);
}

/* 写作技巧 */
.tips-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.tip-header {
  display: flex;
  align-items: center;
  padding: 16px;
}

.tip-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: rgba(102, 126, 234, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.tip-icon {
  font-size: 20px;
}

.tip-title {
  flex: 1;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.tip-arrow {
  font-size: 18px;
  color: #999;
  transition: transform 0.3s;
}

.tip-arrow.expanded {
  transform: rotate(90deg);
}

.tip-content {
  padding: 0 16px 16px 68px;
}

.tip-text {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  white-space: pre-line;
}

/* 真题范文 */
.essays-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.essay-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.essay-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.essay-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.essay-arrow {
  font-size: 18px;
  color: #999;
}

.essay-meta {
  font-size: 13px;
  color: #999;
}

/* AI批改 */
.ai-intro {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  text-align: center;
}

.ai-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.ai-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 12px;
}

.ai-desc {
  font-size: 14px;
  color: #666;
  display: block;
  margin-bottom: 8px;
}

.ai-feature {
  font-size: 13px;
  color: #999;
  display: block;
  line-height: 1.6;
}

.input-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.input-label {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 12px;
}

.essay-input {
  width: 100%;
  height: 150px;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  box-sizing: border-box;
}

.word-count {
  font-size: 12px;
  color: #999;
  text-align: right;
  display: block;
  margin-top: 8px;
}

.submit-btn {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  font-weight: bold;
}

.submit-btn[disabled] {
  opacity: 0.6;
}

.result-section {
  margin-top: 20px;
}

.result-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 12px;
}

.result-content {
  background: #e3f2fd;
  border-radius: 12px;
  padding: 16px;
}

.result-content text {
  font-size: 14px;
  color: #333;
  line-height: 1.8;
  white-space: pre-line;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: flex-end;
  z-index: 100;
}

.modal-content {
  background: #fff;
  width: 100%;
  max-height: 85vh;
  border-radius: 20px 20px 0 0;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 20px;
  color: #999;
  padding: 4px;
}

.modal-body {
  padding: 20px;
  max-height: calc(85vh - 70px);
}

.essay-requirement {
  margin-bottom: 20px;
}

.req-label {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

.req-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  display: block;
}

.essay-sample {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 16px;
}

.sample-label {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 12px;
}

.sample-content {
  font-size: 14px;
  color: #333;
  line-height: 1.8;
  display: block;
  white-space: pre-line;
}

.sample-analysis {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #ddd;
}

.analysis-label {
  font-size: 14px;
  font-weight: bold;
  color: #667eea;
  display: block;
  margin-bottom: 8px;
}

.analysis-text {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  display: block;
}
</style>
