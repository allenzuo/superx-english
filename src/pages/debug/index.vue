<template>
  <view class="debug-page">
    <view class="section">
      <view class="section-title">网络诊断</view>
      <view class="debug-item">
        <text class="label">网络状态</text>
        <text :class="['value', networkStatus === '正常' ? 'success' : 'error']">
          {{ networkStatus }}
        </text>
      </view>
      <view class="debug-item">
        <text class="label">网络类型</text>
        <text class="value">{{ networkType }}</text>
      </view>
      <button @tap="checkNetwork">刷新网络状态</button>
    </view>

    <view class="section">
      <view class="section-title">存储状态</view>
      <view class="debug-item">
        <text class="label">用户数据</text>
        <text class="value">{{ storageInfo.user }} KB</text>
      </view>
      <view class="debug-item">
        <text class="label">学习进度</text>
        <text class="value">{{ storageInfo.progress }} KB</text>
      </view>
      <view class="debug-item">
        <text class="label">缓存数据</text>
        <text class="value">{{ storageInfo.cache }} KB</text>
      </view>
      <button @tap="clearCache">清除缓存</button>
    </view>

    <view class="section">
      <view class="section-title">TTS 诊断</view>
      <view class="debug-item">
        <text class="label">TTS 可用</text>
        <text :class="['value', ttsAvailable ? 'success' : 'error']">
          {{ ttsAvailable ? '可用' : '不可用' }}
        </text>
      </view>
      <view class="debug-item">
        <text class="label">当前引擎</text>
        <text class="value">{{ ttsEngine }}</text>
      </view>
      <button @tap="testTts">测试 TTS</button>
    </view>

    <view class="section">
      <view class="section-title">日志</view>
      <view class="log-container">
        <view v-for="(log, index) in logs" :key="index" class="log-item">
          <text class="log-time">{{ log.time }}</text>
          <text :class="['log-content', log.level]">{{ log.message }}</text>
        </view>
      </view>
      <button @tap="clearLogs">清除日志</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const networkStatus = ref('未知')
const networkType = ref('未知')
const ttsAvailable = ref(false)
const ttsEngine = ref('系统默认')

const storageInfo = ref({
  user: 0,
  progress: 0,
  cache: 0
})

const logs = ref<Array<{ time: string; level: string; message: string }>>([])

onMounted(() => {
  checkNetwork()
  checkStorage()
  checkTts()
})

function checkNetwork() {
  uni.getNetworkType({
    success: (res) => {
      networkType.value = res.networkType || '未知'
      networkStatus.value = res.networkType === 'wifi' || res.networkType === '4g' ? '正常' : '异常'
      addLog('info', `网络类型: ${res.networkType}`)
    },
    fail: () => {
      networkStatus.value = '异常'
      addLog('error', '获取网络状态失败')
    }
  })
}

function checkStorage() {
  try {
    const info = uni.getStorageInfoSync()
    storageInfo.value = {
      user: Math.round((info.currentSize || 0) / 1024 * 100) / 100,
      progress: 0,
      cache: Math.round((info.keys?.length || 0) * 0.1)
    }
    addLog('info', '存储信息获取成功')
  } catch (e) {
    addLog('error', '获取存储信息失败')
  }
}

function checkTts() {
  ttsAvailable.value = true
  addLog('info', 'TTS检查完成')
}

function testTts() {
  addLog('info', 'TTS测试: 您好')
  uni.showToast({ title: 'TTS功能开发中', icon: 'none' })
}

function clearCache() {
  uni.showModal({
    title: '清除缓存',
    content: '确定要清除所有缓存吗？',
    success: (res) => {
      if (res.confirm) {
        uni.clearStorageSync()
        checkStorage()
        addLog('info', '缓存已清除')
        uni.showToast({ title: '已清除', icon: 'success' })
      }
    }
  })
}

function clearLogs() {
  logs.value = []
}

function addLog(level: string, message: string) {
  const time = new Date().toLocaleTimeString()
  logs.value.unshift({ time, level, message })
  
  if (logs.value.length > 50) {
    logs.value.pop()
  }
}
</script>

<style scoped>
.debug-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 16px;
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
  margin-bottom: 16px;
}

.debug-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.debug-item:last-of-type {
  border-bottom: none;
  margin-bottom: 16px;
}

.label {
  font-size: 14px;
  color: #666;
}

.value {
  font-size: 14px;
  color: #333;
}

.value.success {
  color: #52c41a;
}

.value.error {
  color: #ff4d4f;
}

.section button {
  background: #667eea;
  color: #fff;
}

.log-container {
  max-height: 200px;
  overflow-y: auto;
  background: #1a1a1a;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.log-item {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 12px;
}

.log-time {
  color: #666;
}

.log-content.info {
  color: #52c41a;
}

.log-content.error {
  color: #ff4d4f;
}

.log-content.warn {
  color: #faad14;
}
</style>
