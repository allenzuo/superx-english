<template>
  <view class="grammar-page">
    <view class="header" v-if="moduleFile">
      <text class="section-name">{{ sectionTitle }}</text>
    </view>
    
    <view v-if="isLoading" class="loading">
      <text>加载语法知识中...</text>
    </view>
    
    <view v-else class="grammar-topics">
      <view 
        v-for="topic in topics" 
        :key="topic.id"
        class="topic-card"
        :style="{ borderLeftColor: topic.color || '#667eea' }"
        @tap="goToTopic(topic)"
      >
        <text class="topic-name">{{ topic.name }}</text>
        <text class="topic-count">{{ topic.lessons?.length || 0 }}节课</text>
      </view>
      
      <view v-if="topics.length === 0" class="empty">
        <text>暂无内容</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { grammarService, type GrammarTopic } from '@/services/grammar'

const topics = ref<GrammarTopic[]>([])
const isLoading = ref(true)
const moduleFile = ref('')

const sectionTitles: Record<string, string> = {
  'grammar': '满分语法',
  'grammar_lessons_guanci.json': '满分语法',
  'grammar_lessons_tingli.json': '赢在听力',
  'grammar_lessons_duanyu.json': '玩转短语',
  'grammar_lessons_changnanju.json': '长难句',
  'grammar_lessons_wanxingtiankong.json': '完型填空',
  'grammar_lessons_yuedulijie.json': '阅读理解',
  'grammar_lessons_zuowen.json': '高分作文',
  'grammar_lessons_qingjingduihua.json': '情景对话',
  'grammar_lessons_bijiaoji.json': '形容词副词',
  'grammar_lessons_daici.json': '代词',
  'grammar_lessons_shuci.json': '数词',
  'grammar_lessons_qingtaidongci.json': '情态动词',
  'grammar_lessons_dongcishitai.json': '动词时态',
  'grammar_lessons_dongciyutai.json': '动词语态',
  'grammar_lessons_lianci.json': '连词',
  'grammar_lessons_jiandanju.json': '简单句',
  'grammar_lessons_fuheju.json': '复合句',
  'grammar_lessons_zhuweiyizhi.json': '主谓一致',
  'grammar_lessons_daozhuangju.json': '倒装句',
  'grammar_lessons_feiweiyudongci.json': '非谓语动词'
}

const sectionTitle = computed(() => sectionTitles[moduleFile.value] || '语法学习')

const fileKeywords: Record<string, string[]> = {
  'grammar_lessons_guanci.json': ['冠词'],
  'grammar': ['冠词', '名词', '代词', '数词', '形容词', '副词', '情态动词', '动词', '时态', '语态', '连词', '简单句', '复合句', '主谓一致', '倒装', '非谓语'],
  'grammar_lessons_tingli.json': ['听力'],
  'grammar_lessons_duanyu.json': ['短语'],
  'grammar_lessons_changnanju.json': ['长难句'],
  'grammar_lessons_wanxingtiankong.json': ['完形'],
  'grammar_lessons_yuedulijie.json': ['阅读'],
  'grammar_lessons_zuowen.json': ['作文'],
  'grammar_lessons_qingjingduihua.json': ['情景'],
  'grammar_lessons_bijiaoji.json': ['比较', '最高级'],
  'grammar_lessons_daici.json': ['代词'],
  'grammar_lessons_shuci.json': ['数词'],
  'grammar_lessons_qingtaidongci.json': ['情态动词'],
  'grammar_lessons_dongcishitai.json': ['时态'],
  'grammar_lessons_dongciyutai.json': ['语态'],
  'grammar_lessons_lianci.json': ['连词'],
  'grammar_lessons_jiandanju.json': ['简单句'],
  'grammar_lessons_fuheju.json': ['复合句', '从句'],
  'grammar_lessons_zhuweiyizhi.json': ['主谓一致'],
  'grammar_lessons_daozhuangju.json': ['倒装'],
  'grammar_lessons_feiweiyudongci.json': ['非谓语']
}

onLoad((options: any) => {
  moduleFile.value = options.file || options.module || ''
})

const grammarKeywords = ['冠词', '名词', '代词', '数词', '形容词', '副词', '情态动词', '动词', '时态', '语态', '连词', '简单句', '复合句', '主谓一致', '倒装', '非谓语']

onMounted(async () => {
  await grammarService.loadGrammar()
  
  let allTopics = grammarService.getTopics()
  
  if (!moduleFile.value) {
    // 没有指定file时，只显示14个语法topics（满分语法）
    allTopics = allTopics.filter(t => 
      grammarKeywords.some(k => t.name.includes(k))
    )
  } else if (fileKeywords[moduleFile.value]) {
    const keywords = fileKeywords[moduleFile.value]
    if (keywords.length > 0) {
      allTopics = allTopics.filter(t => 
        keywords.some(k => t.name.includes(k))
      )
    }
  }
  
  topics.value = allTopics
  isLoading.value = false
})

function goToTopic(topic: GrammarTopic) {
  uni.navigateTo({
    url: `/pages/grammar/detail?id=${topic.id}&name=${encodeURIComponent(topic.name)}`
  })
}
</script>

<style scoped>
.grammar-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 16px;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.section-name {
  color: #fff;
  font-size: 20px;
  font-weight: bold;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #999;
}

.grammar-topics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.topic-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border-left: 4px solid #667eea;
}

.topic-name {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8px;
  line-height: 1.4;
}

.topic-count {
  font-size: 12px;
  color: #999;
}
</style>
