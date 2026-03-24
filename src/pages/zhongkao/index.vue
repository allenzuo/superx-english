<template>
  <view class="zhongkao-page">
    <view class="header">
      <text class="title">决胜中考</text>
      <text class="subtitle">八大模块，全面提升</text>
    </view>

    <scroll-view class="module-grid" scroll-y>
      <view 
        v-for="module in modules" 
        :key="module.id"
        class="module-card"
        :style="{ background: module.color }"
        @tap="goToModule(module)"
      >
        <view class="module-icon">{{ module.icon }}</view>
        <view class="module-info">
          <text class="module-name">{{ module.name }}</text>
          <text class="module-desc">{{ module.desc }}</text>
        </view>
        <view class="module-arrow">›</view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Module {
  id: string
  name: string
  desc: string
  icon: string
  color: string
  file: string
}

const modules = ref<Module[]>([
  {
    id: 'grammar',
    name: '满分语法',
    desc: '超级名师精讲',
    icon: '📖',
    color: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
    file: 'grammar_lessons_guanci.json'
  },
  {
    id: 'listening',
    name: '赢在听力',
    desc: '全面技巧训练',
    icon: '🎧',
    color: 'linear-gradient(135deg, #45B7D1 0%, #2C3E50 100%)',
    file: 'grammar_lessons_tingli.json'
  },
  {
    id: 'phrases',
    name: '玩转短语',
    desc: '多背多记',
    icon: '💬',
    color: 'linear-gradient(135deg, #FFBE0B 0%, #FB5607 100%)',
    file: 'grammar_lessons_duanyu.json'
  },
  {
    id: 'sentences',
    name: '长难句',
    desc: '不再为重点难',
    icon: '📝',
    color: 'linear-gradient(135deg, #8338EC 0%, #3A86FF 100%)',
    file: 'grammar_lessons_changnanju.json'
  },
  {
    id: 'cloze',
    name: '完型填空',
    desc: '技巧我有',
    icon: '✍️',
    color: 'linear-gradient(135deg, #FF006E 0%, #8338EC 100%)',
    file: 'grammar_lessons_wanxingtiankong.json'
  },
  {
    id: 'reading',
    name: '阅读理解',
    desc: '又快又准',
    icon: '📄',
    color: 'linear-gradient(135deg, #3A86FF 0%, #8ECAE6 100%)',
    file: 'grammar_lessons_yuedulijie.json'
  },
  {
    id: 'writing',
    name: '高分作文',
    desc: '超级模板',
    icon: '🏆',
    color: 'linear-gradient(135deg, #06D6A0 0%, #118AB2 100%)',
    file: 'grammar_lessons_zuowen.json'
  },
  {
    id: 'dialogue',
    name: '情景对话',
    desc: '口语提升',
    icon: '🗣️',
    color: 'linear-gradient(135deg, #FF8C00 0%, #FFBE0B 100%)',
    file: 'grammar_lessons_qingjingduihua.json'
  }
])

function goToModule(module: Module) {
  // Navigate to grammar page with the specific module filter
  uni.navigateTo({
    url: `/pages/grammar/index?module=${module.id}&file=${module.file}`
  })
}
</script>

<style scoped>
.zhongkao-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px 20px;
  color: #fff;
}

.title {
  font-size: 28px;
  font-weight: bold;
  display: block;
}

.subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 4px;
  display: block;
}

.module-grid {
  padding: 16px;
}

.module-card {
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.module-icon {
  font-size: 32px;
  margin-right: 16px;
}

.module-info {
  flex: 1;
}

.module-name {
  font-size: 18px;
  font-weight: bold;
  display: block;
}

.module-desc {
  font-size: 12px;
  opacity: 0.9;
  margin-top: 4px;
  display: block;
}

.module-arrow {
  font-size: 24px;
  opacity: 0.7;
}
</style>
