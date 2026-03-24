<template>
  <view class="knowledge-page">
    <view class="map-container">
      <view class="center-node" @tap="goToTopic('all')">
        <text>中考英语</text>
      </view>
      
      <view class="branch branch-1">
        <view class="node" @tap="goToTopic('words')">
          <text>词汇</text>
        </view>
      </view>
      
      <view class="branch branch-2">
        <view class="node" @tap="goToTopic('grammar')">
          <text>语法</text>
        </view>
      </view>
      
      <view class="branch branch-3">
        <view class="node" @tap="goToTopic('listening')">
          <text>听力</text>
        </view>
      </view>
      
      <view class="branch branch-4">
        <view class="node" @tap="goToTopic('reading')">
          <text>阅读</text>
        </view>
      </view>
      
      <view class="branch branch-5">
        <view class="node" @tap="goToTopic('writing')">
          <text>写作</text>
        </view>
      </view>
    </view>

    <view class="stats-panel">
      <view class="panel-title">掌握情况</view>
      <view class="stats-grid">
        <view class="stat-item" v-for="item in stats" :key="item.name">
          <view class="progress-ring" :style="{ '--progress': item.progress + '%' }">
            <text class="value">{{ item.progress }}%</text>
          </view>
          <text class="label">{{ item.name }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const stats = ref([
  { name: '词汇', progress: 65 },
  { name: '语法', progress: 45 },
  { name: '听力', progress: 70 },
  { name: '阅读', progress: 55 },
  { name: '写作', progress: 40 }
])

function goToTopic(topic: string) {
  const pageMap: Record<string, string> = {
    'words': '/pages/words/index',
    'grammar': '/pages/grammar/index',
    'listening': '/pages/listening/index',
    'reading': '/pages/reading/index',
    'writing': '/pages/writing/index',
    'all': '/pages/home/index'
  }
  
  if (pageMap[topic]) {
    uni.switchTab({ url: pageMap[topic] })
  }
}
</script>

<style scoped>
.knowledge-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

.map-container {
  position: relative;
  height: 400px;
  background: #fff;
  border-radius: 16px;
  margin-bottom: 20px;
}

.center-node {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
}

.branch {
  position: absolute;
}

.branch-1 { top: 20px; left: 50%; transform: translateX(-50%); }
.branch-2 { top: 80px; right: 30px; }
.branch-3 { bottom: 80px; right: 30px; }
.branch-4 { bottom: 20px; left: 50%; transform: translateX(-50%); }
.branch-5 { top: 80px; left: 30px; }

.node {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid #667eea;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: #667eea;
  box-shadow: 0 2px 10px rgba(102, 126, 234, 0.2);
}

.stats-panel {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
}

.stats-grid {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.progress-ring {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: conic-gradient(#667eea var(--progress), #eee 0);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.progress-ring .value {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.stat-item .label {
  font-size: 12px;
  color: #666;
}
</style>
