<template>
  <view class="diagnostic-page">
    <view class="header">
      <view class="title">AI 智能诊断</view>
      <view class="subtitle">基于您的学习数据，AI 将分析您的薄弱环节</view>
    </view>

    <view class="start-section" v-if="!isAnalyzing && !report">
      <view class="feature-list">
        <view class="feature-item">
          <text class="icon">📊</text>
          <text>词汇掌握分析</text>
        </view>
        <view class="feature-item">
          <text class="icon">🎯</text>
          <text>语法薄弱点定位</text>
        </view>
        <view class="feature-item">
          <text class="icon">📝</text>
          <text>解题技巧建议</text>
        </view>
      </view>
      <button class="start-btn" @tap="startAnalysis" :disabled="isLoading">
        {{ isLoading ? '分析中...' : '开始 AI 诊断' }}
      </button>
    </view>

    <view class="analyzing" v-if="isAnalyzing">
      <view class="spinner"></view>
      <view class="analyzing-text">AI 正在分析您的学习数据...</view>
      <view class="progress-steps">
        <view :class="['step', { active: step >= 1 }]">分析词汇</view>
        <view :class="['step', { active: step >= 2 }]">分析语法</view>
        <view :class="['step', { active: step >= 3 }]">生成报告</view>
      </view>
    </view>

    <view class="report" v-if="report">
      <view class="report-header">
        <view class="score">{{ report.overallScore }}</view>
        <view class="score-label">综合得分</view>
      </view>

      <view class="report-section">
        <view class="section-title">薄弱知识点</view>
        <view class="weak-points">
          <view 
            v-for="point in report.weakPoints" 
            :key="point.name"
            class="weak-point"
          >
            <view class="point-name">{{ point.name }}</view>
            <view class="point-desc">{{ point.description }}</view>
            <view class="point-suggestion">{{ point.suggestion }}</view>
          </view>
        </view>
      </view>

      <view class="report-section">
        <view class="section-title">学习建议</view>
        <view class="suggestions">
          <view 
            v-for="(s, i) in report.suggestions" 
            :key="i"
            class="suggestion-item"
          >
            {{ s }}
          </view>
        </view>
      </view>

      <button class="start-btn" @tap="startAnalysis">重新诊断</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isAnalyzing = ref(false)
const isLoading = ref(false)
const step = ref(0)
const report = ref<any>(null)

function startAnalysis() {
  uni.navigateTo({ url: '/pages/diagnostic/test' })
}

function simulateAnalysis() {
  step.value = 1
  
  setTimeout(() => {
    step.value = 2
    
    setTimeout(() => {
      step.value = 3
      
      setTimeout(() => {
        isAnalyzing.value = false
        isLoading.value = false
        report.value = {
          overallScore: 75,
          weakPoints: [
            { 
              name: '现在完成时', 
              description: '正确率 45%，需要加强练习',
              suggestion: '建议每天复习5道相关题目'
            },
            { 
              name: '定语从句', 
              description: '正确率 52%，关系词使用混淆',
              suggestion: '重点区分that/which/who的用法'
            },
            { 
              name: '非谓语动词', 
              description: '正确率 58%，动名词和不定式混淆',
              suggestion: '掌握to do和doing的区别'
            }
          ],
          suggestions: [
            '每天坚持背单词，建议使用百日计划功能',
            '本周重点复习现在完成时相关知识点',
            '建议增加听力练习时间，提高语感',
            '定期回顾错题本，强化记忆'
          ]
        }
      }, 1500)
    }, 1500)
  }, 1500)
}
</script>

<style scoped>
.diagnostic-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
  color: #fff;
  text-align: center;
}

.title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.start-section {
  padding: 40px 20px;
}

.feature-list {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.feature-item:last-child {
  border-bottom: none;
}

.feature-item .icon {
  font-size: 24px;
}

.start-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 16px;
  border-radius: 30px;
  font-size: 18px;
  border: none;
}

.analyzing {
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  margin: 0 auto 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.analyzing-text {
  font-size: 16px;
  color: #666;
  margin-bottom: 24px;
}

.progress-steps {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.step {
  font-size: 12px;
  color: #ccc;
}

.step.active {
  color: #667eea;
  font-weight: bold;
}

.report {
  padding: 20px;
}

.report-header {
  text-align: center;
  padding: 30px;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 20px;
}

.score {
  font-size: 64px;
  font-weight: bold;
  color: #667eea;
}

.score-label {
  font-size: 14px;
  color: #999;
}

.report-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.weak-point {
  padding: 16px;
  background: #fff9e6;
  border-radius: 8px;
  margin-bottom: 12px;
}

.point-name {
  font-size: 14px;
  font-weight: bold;
  color: #ff9800;
  margin-bottom: 8px;
}

.point-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.point-suggestion {
  font-size: 12px;
  color: #999;
}

.suggestion-item {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}
</style>
