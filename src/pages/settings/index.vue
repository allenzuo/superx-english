<template>
  <view class="settings-page">
    <view class="section">
      <view class="section-title">🤖 大模型配置</view>
      <view class="setting-item">
        <text class="setting-label">服务商</text>
        <picker :value="aiProviderIndex" :range="aiProviders" @change="onProviderChange">
          <view class="picker-value">
            {{ aiProviders[aiProviderIndex] }}
            <text class="arrow">›</text>
          </view>
        </picker>
      </view>
      <view class="setting-item">
        <text class="setting-label">模型</text>
        <picker :value="modelIndex" :range="modelOptions" @change="onModelChange">
          <view class="picker-value">
            {{ modelOptions[modelIndex] }}
            <text class="arrow">›</text>
          </view>
        </picker>
      </view>
      <view class="setting-item">
        <text class="setting-label">API Key</text>
        <input 
          type="text" 
          v-model="apiKey" 
          placeholder="sk-xxxxxxxxxxxxxxxx" 
          password
          @blur="saveApiKey"
        />
      </view>
      <view class="setting-item">
        <text class="setting-label">API 地址</text>
        <input 
          type="text" 
          v-model="apiBaseUrl" 
          placeholder="https://api.deepseek.com（留空使用默认）"
          @blur="saveApiKey"
        />
      </view>
      <view class="setting-item">
        <text class="setting-label">连接状态</text>
        <text :class="['status-badge', connectionStatus]">{{ statusText }}</text>
      </view>
      <view class="setting-item">
        <button class="test-btn" size="mini" @tap="testConnection" :disabled="testing">
          {{ testing ? '测试中...' : '🔗 测试连接' }}
        </button>
        <button class="save-btn" size="mini" type="primary" @tap="saveApiKey">
          保存配置
        </button>
      </view>
      <view class="setting-tips">
        <text class="tips-title">💡 如何获取 DeepSeek API Key：</text>
        <text class="tips-text">1. 访问 deepseek.com 注册账号\n2. 进入控制台 → API Keys → 创建新Key\n3. 将Key粘贴到上方输入框\n4. 点击"测试连接"验证配置</text>
      </view>
    </view>

    <view class="section">
      <view class="section-title">语音设置</view>
      <view class="setting-item">
        <text class="setting-label">语音引擎</text>
        <picker :value="ttsEngineIndex" :range="ttsEngines" @change="onTtsEngineChange">
          <view class="picker-value">
            {{ ttsEngines[ttsEngineIndex] || '系统默认' }}
            <text class="arrow">›</text>
          </view>
        </picker>
      </view>
      <view class="setting-item">
        <text class="setting-label">语速</text>
        <slider 
          :value="speechRate" 
          :min="0" 
          :max="100" 
          :step="5"
          @change="onSpeechRateChange"
          show-value
        />
      </view>
      <button class="test-btn" @tap="testTts">测试朗读</button>
    </view>

    <view class="section">
      <view class="section-title">学习设置</view>
      <view class="setting-item">
        <text class="setting-label">每日新词数</text>
        <picker :value="dailyWordsIndex" :range="dailyWordsOptions" @change="onDailyWordsChange">
          <view class="picker-value">
            {{ dailyWordsOptions[dailyWordsIndex] }}
            <text class="arrow">›</text>
          </view>
        </picker>
      </view>
      <view class="setting-item">
        <text class="setting-label">复习提醒</text>
        <switch :checked="reminderEnabled" @change="onReminderChange" />
      </view>
    </view>

    <view class="section">
      <view class="section-title">数据管理</view>
      <view class="setting-item">
        <text class="setting-label">备份数据</text>
        <button size="mini" @tap="backupData">导出</button>
      </view>
      <view class="setting-item">
        <text class="setting-label">恢复数据</text>
        <button size="mini" @tap="restoreData">导入</button>
      </view>
      <view class="setting-item">
        <text class="setting-label">清除缓存</text>
        <button size="mini" @tap="clearCache">清除</button>
      </view>
    </view>

    <view class="section">
      <view class="section-title">关于</view>
      <view class="setting-item">
        <text class="setting-label">版本</text>
        <text class="setting-value">1.0.0</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const aiProviders = ['DeepSeek', '通义千问', '自定义']
const aiProviderIndex = ref(0)

const modelOptions = ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner']
const modelIndex = ref(0)

const apiKey = ref('')
const apiBaseUrl = ref('')

const testing = ref(false)
const connectionStatus = ref<'unknown' | 'success' | 'error'>('unknown')

const statusText = computed(() => {
  switch (connectionStatus.value) {
    case 'success': return '✅ 已连接'
    case 'error': return '❌ 连接失败'
    default: return '未测试'
  }
})

const ttsEngines = ['系统默认', '百度语音', '讯飞语音']
const ttsEngineIndex = ref(0)

const speechRate = ref(50)

const dailyWordsOptions = ['5', '10', '15', '20', '30']
const dailyWordsIndex = ref(1)
const reminderEnabled = ref(false)

onMounted(() => {
  loadSettings()
})

function loadSettings() {
  const settings = uni.getStorageSync('app_settings') || {}
  aiProviderIndex.value = settings.aiProviderIndex ?? 0
  modelIndex.value = settings.modelIndex ?? 0
  apiKey.value = settings.apiKey || ''
  apiBaseUrl.value = settings.apiBaseUrl || ''
  ttsEngineIndex.value = settings.ttsEngineIndex || 0
  speechRate.value = settings.speechRate || 50
  dailyWordsIndex.value = settings.dailyWordsIndex || 1
  reminderEnabled.value = settings.reminderEnabled || false
  connectionStatus.value = settings.connectionStatus || 'unknown'
}

function saveSettings() {
  uni.setStorageSync('app_settings', {
    ...(uni.getStorageSync('app_settings') || {}),
    aiProviderIndex: aiProviderIndex.value,
    modelIndex: modelIndex.value,
    apiKey: apiKey.value,
    apiBaseUrl: apiBaseUrl.value,
    ttsEngineIndex: ttsEngineIndex.value,
    speechRate: speechRate.value,
    dailyWordsIndex: dailyWordsIndex.value,
    reminderEnabled: reminderEnabled.value,
    connectionStatus: connectionStatus.value
  })
}

function onProviderChange(e: any) {
  aiProviderIndex.value = parseInt(e.detail.value)
  if (aiProviderIndex.value === 0) {
    modelOptions.splice(0, modelOptions.length, 'deepseek-chat', 'deepseek-coder', 'deepseek-reasoner')
    apiBaseUrl.value = 'https://api.deepseek.com/v1'
  } else if (aiProviderIndex.value === 1) {
    modelOptions.splice(0, modelOptions.length, 'qwen-plus', 'qwen-turbo', 'qwen-max')
    apiBaseUrl.value = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
  }
  saveSettings()
}

function onModelChange(e: any) {
  modelIndex.value = parseInt(e.detail.value)
  saveSettings()
}

async function testConnection() {
  if (!apiKey.value.trim()) {
    uni.showToast({ title: '请先填写API Key', icon: 'none' })
    return
  }
  
  testing.value = true
  connectionStatus.value = 'unknown'
  
  try {
    const baseUrl = apiBaseUrl.value.trim() || (aiProviderIndex.value === 0 
      ? 'https://api.deepseek.com/v1' 
      : 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation')
    const model = modelOptions[modelIndex.value]
    
    const response = await uni.request({
      url: baseUrl + '/chat/completions',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.value.trim()}`
      },
      data: {
        model: model,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 5
      },
      timeout: 15000
    })
    
    if (response.statusCode === 200) {
      connectionStatus.value = 'success'
      uni.setStorageSync('app_settings', {
        ...(uni.getStorageSync('app_settings') || {}),
        connectionStatus: 'success'
      })
      uni.showToast({ title: '连接成功！', icon: 'success' })
    } else {
      connectionStatus.value = 'error'
      uni.showToast({ title: `连接失败: ${response.statusCode}`, icon: 'none' })
    }
  } catch (e: any) {
    connectionStatus.value = 'error'
    uni.showToast({ 
      title: '连接失败: ' + (e.message || '请检查Key和地址'), 
      icon: 'none',
      duration: 3000
    })
  }
  
  testing.value = false
}

function saveApiKey() {
  saveSettings()
  connectionStatus.value = 'unknown'
  uni.showToast({ title: '配置已保存', icon: 'success' })
}

function onTtsEngineChange(e: any) {
  ttsEngineIndex.value = e.detail.value
  saveSettings()
}

function onSpeechRateChange(e: any) {
  speechRate.value = e.detail.value
  saveSettings()
}

function onDailyWordsChange(e: any) {
  dailyWordsIndex.value = e.detail.value
  saveSettings()
}

function onReminderChange(e: any) {
  reminderEnabled.value = e.detail.value
  saveSettings()
}

function testTts() {
  uni.showToast({ title: '语音功能开发中', icon: 'none' })
}

function backupData() {
  const data = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    userProfile: uni.getStorageSync('user_profile'),
    appSettings: uni.getStorageSync('app_settings'),
    learnedWords: uni.getStorageSync('learned_words'),
    wrongQuestions: uni.getStorageSync('wrong_questions'),
    dailyTasks: uni.getStorageSync('daily_tasks'),
    dailyWordsDay: uni.getStorageSync('day_words_day'),
    hundredDaysProgress: uni.getStorageSync('hundred_days_progress'),
    myTags: uni.getStorageSync('my_tags'),
    learningRecords: uni.getStorageSync('learning_records')
  }
  
  const fileName = `backup_${new Date().getTime()}.json`
  
  // 保存到本地文件
  const fs = uni.getFileSystemManager()
  const filePath = `${uni.env.USER_DATA_PATH}/${fileName}`
  
  fs.writeFile({
    filePath: filePath,
    data: JSON.stringify(data),
    success: () => {
      uni.showModal({
        title: '备份成功',
        content: `数据已备份到: ${fileName}`,
        showCancel: false
      })
    },
    fail: () => {
      // 降级到直接显示JSON
      uni.showModal({
        title: '备份数据',
        content: JSON.stringify(data).substring(0, 500) + '...',
        showCancel: false
      })
    }
  })
}

function restoreData() {
  uni.showModal({
    title: '恢复数据',
    content: '请选择备份文件（功能开发中）\n\n当前支持手动恢复：\n1. 点击"清除缓存"前的数据\n2. 联系开发者协助恢复',
    showCancel: false
  })
}

function clearCache() {
  uni.showModal({
    title: '清除缓存',
    content: '确定要清除所有缓存数据吗？',
    success: (res) => {
      if (res.confirm) {
        uni.clearStorageSync()
        uni.showToast({ title: '已清除', icon: 'success' })
      }
    }
  })
}
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.section {
  background: #fff;
  margin-bottom: 12px;
}

.section-title {
  font-size: 14px;
  color: #999;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: 16px;
  color: #333;
}

.setting-value {
  font-size: 14px;
  color: #999;
}

.picker-value {
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
}

.arrow {
  font-size: 18px;
  color: #ccc;
  margin-left: 8px;
}

.setting-item input {
  flex: 1;
  text-align: right;
  font-size: 14px;
  color: #666;
}

.setting-tips {
  padding: 12px 16px;
  background: #fff9e6;
}

.tips-title {
  font-size: 12px;
  color: #ff9800;
  display: block;
}

.tips-text {
  font-size: 12px;
  color: #666;
}

.test-btn {
  background: #f5f5f5;
  color: #666;
  font-size: 13px;
  border: 1rpx solid #ddd;
  padding: 4px 12px;
  border-radius: 4px;
}

.save-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 4px;
}

.status-badge {
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 12px;
}
.status-badge.unknown { color: #999; background: #f5f5f5; }
.status-badge.success { color: #52c41a; background: rgba(82,196,26,0.1); }
.status-badge.error { color: #ff4d4f; background: rgba(255,77,79,0.1); }
</style>
