<template>
  <view class="reading-page">
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

    <scroll-view class="article-list" scroll-y>
      <view 
        v-for="(article, index) in articles" 
        :key="index"
        class="article-card"
        @tap="readArticle(article, index)"
      >
        <view class="article-header">
          <text class="tag">{{ article.type }}</text>
          <text class="difficulty" v-if="article.difficulty">{{ article.difficulty }}</text>
        </view>
        <view class="article-title">{{ article.title }}</view>
        <view class="article-summary">{{ article.summary }}</view>
        <view class="article-footer">
          <text class="words">{{ article.wordCount }}词</text>
          <text class="questions">{{ article.questionCount }}题</text>
        </view>
      </view>
      
      <view class="empty" v-if="articles.length === 0">
        <text>暂无数据</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Article {
  id: number
  title: string
  summary: string
  type: string
  difficulty?: string
  wordCount: number
  questionCount: number
  content?: string
  questions?: any[]
  data?: any
}

const currentTab = ref('all')
const articles = ref<Article[]>([])
const readingType = ref('standard')

const tabs = [
  { label: '全部', value: 'all' },
  { label: '记叙文', value: 'narrative' },
  { label: '说明文', value: 'expository' },
  { label: '议论文', value: 'argumentative' },
  { label: '完形填空', value: 'cloze' }
]

onMounted(() => {
  loadArticles()
})

function loadArticles() {
  // Handle hash-based routing: #/pages/reading/index?type=xxx
  let type = 'standard'
  const hash = window.location.hash
  if (hash) {
    const hashParts = hash.split('?')
    if (hashParts.length > 1) {
      const urlParams = new URLSearchParams(hashParts[1])
      type = urlParams.get('type') || 'standard'
    }
  }
  readingType.value = type
  loadArticlesByType(type)
}

function loadArticlesByType(type: string) {
  let url = '/static/data/reading_standard.json'
  let typeName = '阅读理解'
  
  switch (type) {
    case 'qa':
      url = '/static/data/reading_qa.json'
      typeName = '阅读问答'
      break
    case 'multimodal':
      url = '/static/data/reading_multimodal.json'
      typeName = '多模态阅读'
      break
    case 'cloze_grammar':
      url = '/static/data/cloze_grammar.json'
      typeName = '完形填空-新'
      break
    default:
      url = '/static/data/reading_standard.json'
      typeName = '阅读理解-新'
  }
  
  uni.request({
    url,
    success: (res: any) => {
      let data = res.data
      
      // Handle multimodal which is an object, not array
      if (data && typeof data === 'object' && !Array.isArray(data) && data.title) {
        data = [data]
      }
      
      if (data && Array.isArray(data)) {
        articles.value = data.map((item: any, index: number) => ({
          id: index,
          title: item.title || typeName + ' ' + (index + 1),
          summary: item.content?.substring(0, 100) || item.article?.substring(0, 100) || item.description?.substring(0, 100) || '',
          type: typeName,
          difficulty: getDifficulty(item.difficulty),
          wordCount: item.totalWordCount || Math.floor((item.content?.length || item.article?.length || 0) / 6),
          questionCount: item.questions?.length || item.questionsList?.length || item.exercises?.length || 5,
          content: item.content || item.article || '',
          questions: item.questions || item.questionsList || item.exercises,
          data: item
        }))
      } else {
        loadDefaultArticles()
      }
    },
    fail: () => {
      loadDefaultArticles()
    }
  })
}

function loadDefaultArticles() {
  articles.value = [
    { id: 1, title: 'The Importance of Reading', summary: 'Reading is one of the most important skills...', type: '阅读理解', difficulty: '简单', wordCount: 250, questionCount: 5 },
    { id: 2, title: 'My Favorite Season', summary: 'There are four seasons in a year...', type: '阅读理解', difficulty: '简单', wordCount: 200, questionCount: 5 }
  ]
}

function getDifficulty(level?: string): string {
  const diffMap: Record<string, string> = {
    'easy': '简单',
    'medium': '中等',
    'hard': '困难'
  }
  return diffMap[level || ''] || ''
}

function switchTab(tab: string) {
  currentTab.value = tab
}

function readArticle(article: Article, index: number) {
  uni.navigateTo({
    url: `/pages/reading/article?id=${index}&type=${readingType.value}&title=${encodeURIComponent(article.title)}`
  })
}
</script>

<style scoped>
.reading-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.tabs {
  display: flex;
  background: #fff;
  padding: 12px 16px;
  gap: 8px;
  overflow-x: auto;
}

.tab {
  padding: 8px 16px;
  font-size: 14px;
  color: #666;
  background: #f5f5f5;
  border-radius: 20px;
  white-space: nowrap;
}

.tab.active {
  background: #667eea;
  color: #fff;
}

.article-list {
  padding: 16px;
  height: calc(100vh - 120px);
}

.article-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.article-header {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.tag {
  font-size: 12px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}

.difficulty {
  font-size: 12px;
  color: #999;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.article-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.article-summary {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 12px;
}

.article-footer {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
